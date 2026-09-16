import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { PaystackService } from "../services/paystack.service";
import {
  initiatePayment,
  reconcilePaystackPayment,
  markPaymentFailed,
} from "../services/payment.service";

const PAYMENT_PUBLIC_SELECT = {
  paymentRef: true,
  orderId: true,
  amount: true,
  currency: true,
  provider: true,
  status: true,
  failureReason: true,
  processedAt: true,
  createdAt: true,
} as const;

function getFrontendUrl(req: Request): string {
  const customDomain = "https://www.ashantiskitchenware.com";
  const origin = (req.headers.origin as string | undefined)?.replace(/\/$/, "");

  if (origin) {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return origin;
    }
    if (origin.includes("ashantiskitchenware.com")) {
      return origin;
    }
  }

  const envUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
  if (envUrl) {
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    if (!envUrl.includes("onrender.com")) {
      return envUrl;
    }
  }

  return customDomain;
}

export class PaymentController {
  /**
   * Initiate a payment for an existing order.
   * (Checkout initiates payment inline; this endpoint supports retry/manual flows.)
   */
  static async initiatePayment(req: Request, res: Response) {
    try {
      const { orderId, amount, currency, customerEmail, customerName, metadata } = req.body;

      if (!orderId || !amount || !customerEmail) {
        return res
          .status(400)
          .json({ error: "Missing required fields: orderId, amount, customerEmail" });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.status !== "PENDING") {
        return res.status(409).json({ error: `Order is already ${order.status}` });
      }

      const idempotencyKey = (
        (req.headers["idempotency-key"] as string) ||
        (req.headers["x-idempotency-key"] as string) ||
        req.body.idempotencyKey
      )?.trim();

      const result = await initiatePayment({
        orderId,
        amount: Number(amount),
        email: customerEmail,
        customerName: customerName || order.customerName,
        currency: currency || "GHS",
        metadata: metadata || {},
        callbackUrl:
          (req.body?.callbackUrl as string)?.trim()?.replace(/https?:\/\/[^/]*\.onrender\.com/, "https://www.ashantiskitchenware.com") ||
          `${getFrontendUrl(req)}/checkout/callback`,
        idempotencyKey,
      });

      return res.status(201).json({
        success: true,
        paymentRef: result.paymentRef,
        status: result.status,
        provider: result.provider,
        authorizationUrl: result.authorizationUrl,
        message:
          result.provider === "PAYSTACK"
            ? "Redirect the customer to authorizationUrl to complete payment."
            : "Payment is being processed. Poll /api/payments/:ref/status for updates.",
      });
    } catch (error) {
      console.error("[Payment] Initiation error:", error);
      return res.status(500).json({ error: "Failed to initiate payment" });
    }
  }

  static async getPaymentStatus(req: Request, res: Response) {
    try {
      const { ref } = req.params;
      const payment = await prisma.payment.findUnique({
        where: { paymentRef: ref },
        select: {
          ...PAYMENT_PUBLIC_SELECT,
          metadata: true,
        },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        select: {
          id: true,
          customerName: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          totalAmount: true,
          items: true,
          paidAt: true,
          createdAt: true,
        },
      });

      return res.json({
        ...payment,
        order,
      });
    } catch (error) {
      console.error("[Payment] Status fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch payment status" });
    }
  }

  /**
   * Verify a payment with the provider and reconcile our records.
   * Called by the callback page after Paystack redirects back.
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { ref } = req.params;
      const payment = await prisma.payment.findUnique({ where: { paymentRef: ref } });
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.provider === "PAYSTACK") {
        try {
          await reconcilePaystackPayment(ref);
        } catch (verifyErr) {
          console.error("[Payment] Paystack verify error:", verifyErr);
          // Fall through and return whatever status we currently hold.
        }
      }

      const updated = await prisma.payment.findUnique({
        where: { paymentRef: ref },
        select: {
          ...PAYMENT_PUBLIC_SELECT,
          metadata: true,
        },
      });

      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        select: {
          id: true,
          customerName: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          totalAmount: true,
          items: true,
          paidAt: true,
          createdAt: true,
        },
      });

      return res.json({
        ...updated,
        order,
      });
    } catch (error) {
      console.error("[Payment] Verify error:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }
  }

  /**
   * Paystack webhook. Signature-verified server-to-server notification and the
   * authoritative source of payment status.
   */
  static async webhook(req: Request, res: Response) {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer | undefined;

    if (!PaystackService.verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Payment Webhook] Signature verification failed or missing");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;
    try {
      const reference: string | undefined = event?.data?.reference;
      if (reference) {
        if (event?.event === "charge.success") {
          // Reconcile directly with event.data to avoid redundant HTTP roundtrips
          await reconcilePaystackPayment(reference, event.data).catch((e) =>
            console.error("[Payment] Webhook reconcile error:", e)
          );
        } else if (event?.event === "charge.failed") {
          await markPaymentFailed(
            reference,
            event?.data?.gateway_response || "Payment failed"
          );
        }
      }
    } catch (err) {
      console.error("[Payment] Webhook handling error:", err);
    }

    // Always acknowledge with 200 OK so Paystack doesn't re-queue or retry unnecessarily.
    return res.sendStatus(200);
  }

  static async listPayments(req: Request, res: Response) {
    try {
      const session = (req as any).session;
      if (!session?.user?.id || session.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const stats = await prisma.payment.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      });

      return res.json({ payments, stats });
    } catch (error) {
      console.error("[Payment] List error:", error);
      return res.status(500).json({ error: "Failed to list payments" });
    }
  }

  /** Retry a failed payment by initiating a fresh attempt for the same order. */
  static async retryPayment(req: Request, res: Response) {
    try {
      const { ref } = req.params;
      const payment = await prisma.payment.findUnique({ where: { paymentRef: ref } });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment.status !== "FAILED") {
        return res.status(409).json({ error: `Cannot retry payment in ${payment.status} status` });
      }

      const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.status !== "PENDING") {
        return res.status(409).json({ error: `Order is already ${order.status}` });
      }

      const result = await initiatePayment({
        orderId: payment.orderId,
        amount: payment.amount,
        email: payment.customerEmail,
        customerName: payment.customerName,
        currency: payment.currency,
        metadata: { retryOf: ref },
        callbackUrl:
          (req.body?.callbackUrl as string)?.trim()?.replace(/https?:\/\/[^/]*\.onrender\.com/, "https://www.ashantiskitchenware.com") ||
          `${getFrontendUrl(req)}/checkout/callback`,
      });

      return res.json({
        success: true,
        paymentRef: result.paymentRef,
        status: result.status,
        provider: result.provider,
        authorizationUrl: result.authorizationUrl,
      });
    } catch (error) {
      console.error("[Payment] Retry error:", error);
      return res.status(500).json({ error: "Failed to retry payment" });
    }
  }
}
