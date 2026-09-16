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
  /** Unique client or request idempotency key. */
  idempotencyKey?: string;
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

export interface GatewaySuccessDetails {
  channel?: string;
  authorization?: Record<string, any>;
  fees?: number;
  paidAt?: string | Date;
  gatewayResponse?: string;
}

/** Mark a payment (and its order) as successful. Safe to call more than once. */
export async function markPaymentSuccess(
  paymentRef: string,
  gatewayDetails?: GatewaySuccessDetails
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { paymentRef } });
  if (!payment) {
    console.warn(`[Payment] markPaymentSuccess: payment ${paymentRef} not found`);
    return;
  }
  if (payment.status === "SUCCESS") return; // already finalised

  const mergedMetadata = {
    ...((payment.metadata as Record<string, any>) || {}),
    ...(gatewayDetails || {}),
  };

  // Atomic conditional update to eliminate race conditions between webhooks and callback redirects.
  // Exactly one execution will see status: { not: "SUCCESS" } and succeed with count: 1.
  const paymentUpdate = await prisma.payment.updateMany({
    where: {
      paymentRef,
      status: { not: "SUCCESS" },
    },
    data: {
      status: "SUCCESS",
      processedAt: new Date(),
      failureReason: null,
      metadata: mergedMetadata,
    },
  });

  if (paymentUpdate.count === 0) {
    // Another concurrent thread or webhook already finalized this payment.
    return;
  }

  // Update order status to PAID atomically
  await prisma.order.updateMany({
    where: {
      id: payment.orderId,
      status: { not: "PAID" },
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Decrement inventory for items purchased in this order
  try {
    const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
    if (order && Array.isArray(order.items)) {
      for (const item of order.items as any[]) {
        const qty = Number(item?.quantity) || 0;
        const productId = item?.id;
        if (productId && qty > 0) {
          await prisma.product
            .update({
              where: { id: productId },
              data: { stock: { decrement: qty } },
            })
            .then(async (updatedProduct) => {
              await trackSystemEvent({
                eventType: "INVENTORY_UPDATED",
                userId: payment.customerEmail,
                sessionId: "system",
                metadata: {
                  productId: updatedProduct.id,
                  slug: updatedProduct.slug,
                  orderId: payment.orderId,
                  newStock: updatedProduct.stock,
                  deducted: qty,
                },
              });
            })
            .catch((stockErr) => {
              console.warn(
                `[Payment] Could not decrement stock for product ${productId}:`,
                stockErr?.message || stockErr
              );
            });
        }
      }
    }
  } catch (stockProcessErr) {
    console.error("[Payment] Stock reconciliation error:", stockProcessErr);
  }

  await trackSystemEvent({
    eventType: "PAYMENT_SUCCESS",
    userId: payment.customerEmail,
    sessionId: "payment",
    metadata: {
      paymentRef,
      orderId: payment.orderId,
      amount: payment.amount,
      channel: gatewayDetails?.channel || "card",
    },
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
        paymentRef: payment.paymentRef,
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
  const paymentUpdate = await prisma.payment.updateMany({
    where: {
      paymentRef,
      status: { notIn: ["SUCCESS", "FAILED"] },
    },
    data: {
      status: "FAILED",
      failureReason: reason || "Payment failed",
      processedAt: new Date(),
    },
  });

  if (paymentUpdate.count === 0) {
    // Either not found or already finalized as SUCCESS or FAILED
    return;
  }

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

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.status === "PAID") {
    throw new Error("Order is already paid");
  }

  const provider: Provider = PaystackService.isConfigured() ? "PAYSTACK" : "SIMULATION";

  // Check if this explicit idempotency key has already been processed
  if (args.idempotencyKey) {
    const existingByIdempotency = await prisma.payment.findUnique({
      where: { idempotencyKey: args.idempotencyKey },
    });
    if (existingByIdempotency) {
      const meta = existingByIdempotency.metadata as Record<string, any> | null;
      return {
        paymentRef: existingByIdempotency.paymentRef,
        provider: existingByIdempotency.provider as Provider,
        status: existingByIdempotency.status as any,
        authorizationUrl: meta?.authorizationUrl,
      };
    }
  }

  // Idempotent reuse: if an active payment session already exists for this order, reuse it
  const existingActivePayment = await prisma.payment.findFirst({
    where: {
      orderId,
      status: { in: ["INITIATED", "PROCESSING"] },
      provider,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActivePayment) {
    const meta = existingActivePayment.metadata as Record<string, any> | null;
    if (provider === "PAYSTACK" && meta?.authorizationUrl) {
      return {
        paymentRef: existingActivePayment.paymentRef,
        provider: "PAYSTACK",
        status: "INITIATED",
        authorizationUrl: meta.authorizationUrl,
      };
    }
  }

  const paymentRef = generatePaymentRef();

  if (provider === "PAYSTACK") {
    // Initialise with Paystack first so a failure doesn't leave a dangling record.
    const init = await PaystackService.initializeTransaction({
      email,
      amountMajor: amount,
      reference: paymentRef,
      currency,
      callbackUrl: args.callbackUrl,
      metadata: { ...(args.metadata || {}), orderId, paymentRef, idempotencyKey: args.idempotencyKey },
    });

    await prisma.payment.create({
      data: {
        paymentRef,
        orderId,
        idempotencyKey: args.idempotencyKey,
        amount: Number(amount),
        currency,
        provider: "PAYSTACK",
        status: "INITIATED",
        customerEmail: email,
        customerName,
        metadata: {
          ...(args.metadata || {}),
          accessCode: init.access_code,
          authorizationUrl: init.authorization_url,
        },
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
      idempotencyKey: args.idempotencyKey,
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
 * Reconcile a Paystack payment against the gateway's verify endpoint or verified webhook data
 * and finalise it (idempotently). Returns the resulting status.
 */
export async function reconcilePaystackPayment(
  paymentRef: string,
  webhookPayload?: any
): Promise<"SUCCESS" | "FAILED" | "PENDING"> {
  const payment = await prisma.payment.findUnique({ where: { paymentRef } });
  if (!payment) throw new Error("Payment not found");

  // Idempotent early-return: if already succeeded, avoid redundant work
  if (payment.status === "SUCCESS") {
    return "SUCCESS";
  }

  // Use webhook data if already verified by signature, otherwise query Paystack API
  const data = webhookPayload?.status
    ? webhookPayload
    : await PaystackService.verifyTransaction(paymentRef);

  if (data.status === "success") {
    // Guard against amount tampering (comparing minor units).
    const expected = PaystackService.toMinorUnit(payment.amount);
    if (typeof data.amount === "number" && data.amount !== expected) {
      await markPaymentFailed(
        paymentRef,
        `Amount mismatch (expected ${expected} pesewas, got ${data.amount} pesewas)`
      );
      return "FAILED";
    }

    await markPaymentSuccess(paymentRef, {
      channel: data.channel,
      authorization: (data.authorization as any) || undefined,
      fees: typeof data.fees === "number" ? data.fees : undefined,
      paidAt: data.paid_at,
      gatewayResponse: data.gateway_response,
    });
    return "SUCCESS";
  }

  if (data.status === "failed" || data.status === "abandoned") {
    await markPaymentFailed(
      paymentRef,
      data.gateway_response || (data.status === "abandoned" ? "Payment was cancelled/abandoned by customer" : "Payment failed")
    );
    return "FAILED";
  }

  return "PENDING";
}

