import { prisma } from "../lib/prisma";
import { nanoid } from "nanoid";
import { trackSystemEvent } from "../websocket/ws";
import { EmailService } from "./email.service";
import { orderConfirmationTemplate } from "../mail/order-confirmation-template";
import { PaystackService } from "./paystack.service";

/**
 * Central payment orchestration used by both checkout and the payment routes.
 *
 * When Paystack is configured we initialise a real transaction and hand the
 * client an authorization URL. Otherwise we run the built-in simulation so the
 * app remains fully functional in local/dev without any payment keys.
 */

type Provider = "PAYSTACK" | "SIMULATION";

export interface InitiatePaymentArgs {
  orderId: string;
  amount: number;
  email: string;
  customerName: string;
  currency?: string;
  metadata?: Record<string, any>;
  /** Where Paystack should redirect the customer after payment. */
  callbackUrl?: string;
}

export interface InitiatePaymentResult {
  paymentRef: string;
  provider: Provider;
  status: "INITIATED";
  /** Present only for Paystack: redirect the browser here to complete payment. */
  authorizationUrl?: string;
}

export function generatePaymentRef(): string {
  return `PAY-${nanoid(12)}`;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

const SIMULATED_DELAY_MS = { min: 1500, max: 4000 };

function simulateOutcome(): { success: boolean; reason?: string } {
  const roll = Math.random();
  if (roll < 0.85) return { success: true };
  const reasons = ["Insufficient funds", "Card declined by issuer", "Network timeout with payment processor"];
  return { success: false, reason: reasons[Math.floor(Math.random() * reasons.length)] };
}

function randomDelay(): number {
  return SIMULATED_DELAY_MS.min + Math.random() * (SIMULATED_DELAY_MS.max - SIMULATED_DELAY_MS.min);
}

/** Kick off the async simulated state machine: INITIATED -> PROCESSING -> SUCCESS/FAILED. */
export function runPaymentSimulation(paymentRef: string): void {
  setTimeout(async () => {
    try {
      await prisma.payment.update({
        where: { paymentRef },
        data: { status: "PROCESSING" },
      });

      const payment = await prisma.payment.findUnique({ where: { paymentRef } });
      if (payment) {
        await trackSystemEvent({
          eventType: "PAYMENT_PROCESSING",
          userId: payment.customerEmail,
          sessionId: "payment",
          metadata: { paymentRef, orderId: payment.orderId },
        });
      }

      const outcome = simulateOutcome();
      setTimeout(async () => {
        if (outcome.success) {
          await markPaymentSuccess(paymentRef);
        } else {
          await markPaymentFailed(paymentRef, outcome.reason);
        }
      }, randomDelay());
    } catch (err) {
      console.error("[Payment] Simulation error:", err);
    }
  }, 500);
}

// ---------------------------------------------------------------------------
// Idempotent finalisation (shared by simulation, Paystack verify, and webhook)
// ---------------------------------------------------------------------------

/** Mark a payment (and its order) as successful. Safe to call more than once. */
export async function markPaymentSuccess(paymentRef: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { paymentRef } });
  if (!payment) {
    console.warn(`[Payment] markPaymentSuccess: payment ${paymentRef} not found`);
    return;
  }
  if (payment.status === "SUCCESS") return; // already finalised

  await prisma.$transaction([
    prisma.payment.update({
      where: { paymentRef },
      data: { status: "SUCCESS", processedAt: new Date(), failureReason: null },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ]);

  await trackSystemEvent({
    eventType: "PAYMENT_SUCCESS",
    userId: payment.customerEmail,
    sessionId: "payment",
    metadata: { paymentRef, orderId: payment.orderId, amount: payment.amount },
  });
  await trackSystemEvent({
    eventType: "ORDER_CONFIRMED",
    userId: payment.customerEmail,
    sessionId: "payment",
    metadata: { orderId: payment.orderId, paymentRef },
  });

  // Best-effort confirmation email.
  try {
    const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
    if (order) {
      const items = Array.isArray(order.items) ? (order.items as any[]) : [];
      const emailHtml = orderConfirmationTemplate({
        name: order.customerName,
        orderId: order.id,
        total: order.totalAmount,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      await EmailService.sendEmail(
        order.email,
        `Payment Confirmed – Order ${order.id}`,
        emailHtml
      );
    }
  } catch (emailErr) {
    console.error("[Payment] Confirmation email failed:", emailErr);
  }
}

/** Mark a payment as failed. No-ops if the payment already succeeded. */
export async function markPaymentFailed(
  paymentRef: string,
  reason?: string
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { paymentRef } });
  if (!payment) {
    console.warn(`[Payment] markPaymentFailed: payment ${paymentRef} not found`);
    return;
  }
  if (payment.status === "SUCCESS") return; // don't overwrite a success

  await prisma.payment.update({
    where: { paymentRef },
    data: {
      status: "FAILED",
      failureReason: reason || "Payment failed",
      processedAt: new Date(),
    },
  });

  await trackSystemEvent({
    eventType: "PAYMENT_FAILED",
    userId: payment.customerEmail,
    sessionId: "payment",
    metadata: { paymentRef, orderId: payment.orderId, reason },
  });
}

// ---------------------------------------------------------------------------
// Initiation (provider-aware)
// ---------------------------------------------------------------------------

/**
 * Create a payment record for an existing order and start processing it.
 * Uses Paystack when configured, otherwise the local simulation.
 */
export async function initiatePayment(
  args: InitiatePaymentArgs
): Promise<InitiatePaymentResult> {
  const { orderId, amount, email, customerName } = args;
  const currency = args.currency || "GHS";
  const paymentRef = generatePaymentRef();
  const provider: Provider = PaystackService.isConfigured() ? "PAYSTACK" : "SIMULATION";

  if (provider === "PAYSTACK") {
    // Initialise with Paystack first so a failure doesn't leave a dangling record.
    const init = await PaystackService.initializeTransaction({
      email,
      amountMajor: amount,
      reference: paymentRef,
      currency,
      callbackUrl: args.callbackUrl,
      metadata: { ...(args.metadata || {}), orderId, paymentRef },
    });

    await prisma.payment.create({
      data: {
        paymentRef,
        orderId,
        amount: Number(amount),
        currency,
        provider: "PAYSTACK",
        status: "INITIATED",
        customerEmail: email,
        customerName,
        metadata: { ...(args.metadata || {}), accessCode: init.access_code },
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentRef, paymentProvider: "PAYSTACK" },
    });

    await trackSystemEvent({
      eventType: "PAYMENT_INITIATED",
      userId: email,
      sessionId: "checkout",
      metadata: { paymentRef, orderId, amount, provider: "PAYSTACK" },
    });

    return { paymentRef, provider: "PAYSTACK", status: "INITIATED", authorizationUrl: init.authorization_url };
  }

  // Simulation path
  await prisma.payment.create({
    data: {
      paymentRef,
      orderId,
      amount: Number(amount),
      currency,
      provider: "SIMULATION",
      status: "INITIATED",
        customerEmail: email,
        customerName,
        metadata: { ...(args.metadata || {}) },
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentRef, paymentProvider: "SIMULATION" },
    });

  await trackSystemEvent({
    eventType: "PAYMENT_INITIATED",
    userId: email,
    sessionId: "checkout",
    metadata: { paymentRef, orderId, amount, provider: "SIMULATION" },
  });

  runPaymentSimulation(paymentRef);

  return { paymentRef, provider: "SIMULATION", status: "INITIATED" };
}

/**
 * Reconcile a Paystack payment against the gateway's verify endpoint and
 * finalise it (idempotently). Returns the resulting status.
 */
export async function reconcilePaystackPayment(
  paymentRef: string
): Promise<"SUCCESS" | "FAILED" | "PENDING"> {
  const payment = await prisma.payment.findUnique({ where: { paymentRef } });
  if (!payment) throw new Error("Payment not found");

  const data = await PaystackService.verifyTransaction(paymentRef);

  if (data.status === "success") {
    // Guard against amount tampering.
    const expected = PaystackService.toMinorUnit(payment.amount);
    if (typeof data.amount === "number" && data.amount !== expected) {
      await markPaymentFailed(
        paymentRef,
        `Amount mismatch (expected ${expected}, got ${data.amount})`
      );
      return "FAILED";
    }
    await markPaymentSuccess(paymentRef);
    return "SUCCESS";
  }

  if (data.status === "failed" || data.status === "abandoned") {
    await markPaymentFailed(paymentRef, data.gateway_response || "Payment not completed");
    return "FAILED";
  }

  return "PENDING";
}
