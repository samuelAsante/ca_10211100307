import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { trackSystemEvent } from '../websocket/ws';
import { initiatePayment } from '../services/payment.service';

/** Frontend base URL used for the Paystack post-payment redirect. */
function getFrontendUrl(req: Request): string {
    return (
        process.env.FRONTEND_URL?.replace(/\/$/, "") ||
        (req.headers.origin as string | undefined)?.replace(/\/$/, "") ||
        "http://localhost:3000"
    );
}

/** Must match `getTotalPrice()` in web/src/lib/store/cartStore.ts */
function expectedCheckoutTotal(cartItems: unknown[]): number {
    const rawSubtotal = cartItems.reduce((sum: number, item: any) => {
        const price = Number(item?.price) || 0;
        const qty = Number(item?.quantity) || 0;
        return sum + price * qty;
    }, 0);
    const bulkDiscount = rawSubtotal > 300 ? 0.1 * rawSubtotal : 0;
    return rawSubtotal - bulkDiscount;
}

export class OrderController {
    static async checkout(req: Request, res: Response) {
        try {
            const body = req.body;
            const { fullName, email, phone, address, cartItems, total } = body;

            if (!fullName || !email || !phone || !address || !cartItems || !total) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            if (!Array.isArray(cartItems) || cartItems.length === 0) {
                return res.status(400).json({ error: "Cart must contain at least one item" });
            }

            const idempotencyKey = (
                (req.headers["idempotency-key"] as string) ||
                (req.headers["x-idempotency-key"] as string) ||
                body.idempotencyKey
            )?.trim();

            if (idempotencyKey) {
                const existingOrder = await prisma.order.findUnique({
                    where: { idempotencyKey },
                });

                if (existingOrder) {
                    const payment = await prisma.payment.findFirst({
                        where: { orderId: existingOrder.id },
                        orderBy: { createdAt: "desc" },
                    });
                    const meta = payment?.metadata as Record<string, any> | null;

                    return res.json({
                        success: true,
                        orderId: existingOrder.id,
                        paymentRef: payment?.paymentRef,
                        paymentStatus: payment?.status,
                        provider: payment?.provider,
                        authorizationUrl: meta?.authorizationUrl,
                        isIdempotentReplay: true,
                    });
                }
            }

            const computedTotal = expectedCheckoutTotal(cartItems);

            if (Math.abs(computedTotal - Number(total)) > 1) {
                return res.status(400).json({
                    error: "Price mismatch — total does not match cart items",
                    expected: computedTotal,
                    received: total,
                });
            }

            const order = await prisma.order.create({
                data: {
                    customerName: fullName,
                    email,
                    phone,
                    address,
                    status: "PENDING",
                    totalAmount: total,
                    items: cartItems,
                    idempotencyKey: idempotencyKey || undefined,
                },
                select: {
                    id: true,
                },
            });

            await trackSystemEvent({
                eventType: "CHECKOUT_INITIATED",
                userId: email,
                sessionId: "checkout",
                metadata: {
                    orderId: order.id,
                    totalAmount: total,
                    itemCount: Array.isArray(cartItems) ? cartItems.length : 0,
                },
            });

            // Initiate payment (Paystack when configured, otherwise simulation)
            try {
                const payment = await initiatePayment({
                    orderId: order.id,
                    amount: Number(total),
                    email,
                    customerName: fullName,
                    currency: "GHS",
                    metadata: { itemCount: cartItems.length },
                    callbackUrl: `${getFrontendUrl(req)}/checkout/callback`,
                    idempotencyKey: idempotencyKey || undefined,
                });

                return res.json({
                    success: true,
                    orderId: order.id,
                    paymentRef: payment.paymentRef,
                    paymentStatus: payment.status,
                    provider: payment.provider,
                    authorizationUrl: payment.authorizationUrl,
                });
            } catch (paymentErr) {
                console.error("[Payment] Initiation error:", paymentErr);
                return res.status(502).json({
                    error: "Order created but payment could not be initiated. Please try again.",
                    orderId: order.id,
                });
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            return res.status(500).json({ error: "Failed to place order" });
        }
    }

    static async listOrders(req: Request, res: Response) {
        try {
            const session = (req as any).session;
            if (!session?.user?.id) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            if (session.user.role !== "admin") {
                return res.status(403).json({ error: "Forbidden" });
            }

            const orders = await prisma.order.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    customerName: true,
                    email: true,
                    paymentRef: true,
                    paymentProvider: true,
                    paidAt: true,
                    createdAt: true,
                },
            });

            return res.json(orders);
        } catch (error) {
            console.error("Failed to list orders:", error);
            return res.status(500).json({ error: "Failed to load orders" });
        }
    }

    static async getOrderStatus(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    customerName: true,
                    email: true,
                    createdAt: true,
                },
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            return res.json(order);
        } catch (error) {
            console.error("Failed to fetch order status:", error);
            return res.status(500).json({ error: "Failed to fetch order status" });
        }
    }

    static async fulfillOrder(req: Request, res: Response) {
        try {
            const session = (req as any).session;
            if (!session?.user?.id) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            if (session.user.role !== "admin") {
                return res.status(403).json({ error: "Forbidden" });
            }

            const { orderId } = req.params;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true },
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.status !== "PAID") {
                return res.status(409).json({ error: "Only PAID orders can be fulfilled" });
            }

            const updated = await prisma.order.update({
                where: { id: orderId },
                data: { status: "FULFILLED" },
                select: { id: true, status: true },
            });

            await trackSystemEvent({
                eventType: "DELIVERY_STATUS_CHANGED",
                userId: session.user.id,
                sessionId: "admin",
                metadata: {
                    orderId,
                    statusFrom: "PAID",
                    statusTo: "FULFILLED",
                },
            });

            return res.json(updated);
        } catch (error) {
            console.error("Failed to fulfill order:", error);
            return res.status(500).json({ error: "Failed to fulfill order" });
        }
    }

    static async cancelOrder(req: Request, res: Response) {
        try {
            const session = (req as any).session;
            if (!session?.user?.id) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            if (session.user.role !== "admin") {
                return res.status(403).json({ error: "Forbidden" });
            }

            const { orderId } = req.params;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true },
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.status === "FULFILLED" || order.status === "CANCELLED") {
                return res.status(409).json({ error: "Order cannot be cancelled in current state" });
            }

            const updated = await prisma.order.update({
                where: { id: orderId },
                data: { status: "CANCELLED" },
                select: { id: true, status: true },
            });

            await trackSystemEvent({
                eventType: "DELIVERY_STATUS_CHANGED",
                userId: session.user.id,
                sessionId: "admin",
                metadata: {
                    orderId,
                    statusFrom: order.status,
                    statusTo: "CANCELLED",
                },
            });

            return res.json(updated);
        } catch (error) {
            console.error("Failed to cancel order:", error);
            return res.status(500).json({ error: "Failed to cancel order" });
        }
    }
}
