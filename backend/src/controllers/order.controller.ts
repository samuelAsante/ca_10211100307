import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { trackSystemEvent } from '../websocket/ws';
import { initiatePayment } from '../services/payment.service';
import { calculateCouponDiscount } from './coupon.controller';

/** Frontend base URL used for the Paystack post-payment redirect. */
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

export class OrderController {
    static async checkout(req: Request, res: Response) {
        try {
            const body = req.body;
            const { fullName, email, phone, address, cartItems, total, couponCode } = body;

            if (!fullName || !email || !phone || !address || !cartItems || total === undefined) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            if (!Array.isArray(cartItems) || cartItems.length === 0) {
                return res.status(400).json({ error: "Cart must contain at least one item" });
            }

            const incomingKey = (
                (req.headers["idempotency-key"] as string) ||
                (req.headers["x-idempotency-key"] as string) ||
                body.idempotencyKey
            )?.trim();

            if (incomingKey) {
                const existingOrder = await prisma.order.findFirst({
                    where: { idempotencyKey: incomingKey },
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

            const idempotencyKey = incomingKey || uuidv4();

            // Authoritative Product & Stock Check from Database
            const productIds = cartItems
                .map((item: any) => item?.id)
                .filter((id: any): id is string => typeof id === "string" && id.length > 0);

            const dbProducts = await prisma.product.findMany({
                where: { id: { in: productIds } },
            });
            const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

            let rawSubtotal = 0;
            const verifiedItems: any[] = [];

            for (const item of cartItems) {
                const qty = Math.max(1, Number(item?.quantity) || 1);
                const dbProduct = productsMap.get(item?.id);

                if (dbProduct) {
                    // Pre-checkout stock verification
                    if (dbProduct.stock < qty) {
                        return res.status(400).json({
                            error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} unit(s) available.`,
                            productId: dbProduct.id,
                            availableStock: dbProduct.stock,
                            requestedQuantity: qty,
                        });
                    }

                    const hasDiscount = typeof dbProduct.discount === "number" && dbProduct.discount > 0;
                    const unitPrice = hasDiscount
                        ? dbProduct.price - (dbProduct.price * dbProduct.discount) / 100
                        : dbProduct.price;

                    rawSubtotal += unitPrice * qty;
                    verifiedItems.push({
                        id: dbProduct.id,
                        name: dbProduct.name,
                        price: Math.round(unitPrice * 100) / 100,
                        quantity: qty,
                        image: dbProduct.images?.[0] || item?.image || "/fallback-image.webp",
                        discount: dbProduct.discount,
                    });
                } else {
                    const price = Number(item?.price) || 0;
                    rawSubtotal += price * qty;
                    verifiedItems.push({
                        id: item?.id || uuidv4(),
                        name: item?.name || "Cookware Item",
                        price,
                        quantity: qty,
                        image: item?.image || "/fallback-image.webp",
                    });
                }
            }

            // Authoritative Discount Calculation
            let discountAmount = 0;
            let appliedPromo: string | null = null;

            if (couponCode && typeof couponCode === "string") {
                const normalizedCode = couponCode.trim().toUpperCase();
                const dbCoupon = await prisma.coupon.findUnique({
                    where: { code: normalizedCode },
                });
                if (
                    dbCoupon &&
                    dbCoupon.isActive &&
                    (!dbCoupon.expiresAt || new Date(dbCoupon.expiresAt) >= new Date()) &&
                    (!dbCoupon.maxUses || dbCoupon.usedCount < dbCoupon.maxUses) &&
                    rawSubtotal >= dbCoupon.minSubtotal
                ) {
                    const couponCalc = calculateCouponDiscount(
                        dbCoupon.discountType,
                        dbCoupon.discountValue,
                        dbCoupon.maxDiscount,
                        rawSubtotal
                    );
                    discountAmount = couponCalc.discountAmount;
                    appliedPromo = dbCoupon.code;
                }
            } else if (rawSubtotal > 300) {
                discountAmount = Math.round(0.1 * rawSubtotal * 100) / 100;
            }

            const authoritativeTotal = Math.max(0, Math.round((rawSubtotal - discountAmount) * 100) / 100);

            // Allow at most 1.5 GHS rounding variance between client and server calculations
            if (Math.abs(authoritativeTotal - Number(total)) > 1.5) {
                return res.status(400).json({
                    error: "Price mismatch — authoritative order total does not match submitted amount.",
                    expected: authoritativeTotal,
                    received: total,
                });
            }

            const finalOrderTotal = authoritativeTotal;

            const order = await prisma.order.create({
                data: {
                    customerName: fullName,
                    email,
                    phone,
                    address,
                    status: "PENDING",
                    totalAmount: finalOrderTotal,
                    items: verifiedItems,
                    idempotencyKey: idempotencyKey || undefined,
                },
                select: {
                    id: true,
                },
            });

            if (appliedPromo) {
                await prisma.coupon
                    .update({
                        where: { code: appliedPromo },
                        data: { usedCount: { increment: 1 } },
                    })
                    .catch((err) => console.warn(`[Order] Could not increment coupon use count:`, err?.message || err));
            }

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
                    callbackUrl:
                        (body.callbackUrl as string)?.trim()?.replace(/https?:\/\/[^/]*\.onrender\.com/, "https://www.ashantiskitchenware.com") ||
                        `${getFrontendUrl(req)}/checkout/callback`,
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
                select: { id: true, status: true, items: true },
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.status === "FULFILLED" || order.status === "CANCELLED") {
                return res.status(409).json({ error: "Order cannot be cancelled in current state" });
            }

            // Restore product stock if the order was already paid
            if (order.status === "PAID" && Array.isArray(order.items)) {
                for (const item of order.items as any[]) {
                    const qty = Number(item?.quantity) || 0;
                    const productId = item?.id;
                    if (productId && qty > 0) {
                        await prisma.product
                            .update({
                                where: { id: productId },
                                data: { stock: { increment: qty } },
                            })
                            .catch((err) =>
                                console.warn(`[Order] Could not restore stock for product ${productId}:`, err?.message || err)
                            );
                    }
                }
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

    static async trackOrder(req: Request, res: Response) {
        try {
            const { identifier } = req.params;
            if (!identifier) {
                return res.status(400).json({ error: "Order ID or Phone Number is required" });
            }

            const cleanQuery = identifier.trim();

            // Search by Order ID first
            let order = await prisma.order.findUnique({
                where: { id: cleanQuery },
            });

            // If not found, search by phone number (most recent order)
            if (!order) {
                order = await prisma.order.findFirst({
                    where: {
                        phone: {
                            contains: cleanQuery,
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });
            }

            if (!order) {
                return res.status(404).json({ error: "No order found matching this Order ID or Phone Number" });
            }

            // Mask sensitive customer contact details for public privacy
            const maskPhone = (phone: string) => {
                const cleaned = phone.replace(/\s+/g, "");
                if (cleaned.length <= 4) return cleaned;
                return cleaned.slice(0, 3) + "****" + cleaned.slice(-3);
            };

            const maskEmail = (email: string) => {
                const parts = email.split("@");
                if (parts.length !== 2) return email;
                const name = parts[0];
                const maskedName = name.length > 2 ? name[0] + "***" + name.slice(-1) : name;
                return `${maskedName}@${parts[1]}`;
            };

            const timeline = [
                {
                    step: "ORDER_PLACED",
                    title: "Order Placed",
                    description: "Order received and registered in our Ashanti's Kitchenware system.",
                    timestamp: order.createdAt,
                    completed: true,
                    current: order.status === "PENDING",
                },
                {
                    step: "PAYMENT_CONFIRMED",
                    title: "Payment Confirmed",
                    description:
                        order.status === "PENDING"
                            ? "Awaiting Paystack payment confirmation."
                            : "Payment verified successfully.",
                    timestamp: order.paidAt || null,
                    completed: order.status === "PAID" || order.status === "FULFILLED",
                    current: order.status === "PAID",
                },
                {
                    step: "PROCESSING",
                    title: "Packing & Quality Check",
                    description: "Cookware set packaged with care at our Accra distribution center.",
                    timestamp: null,
                    completed: order.status === "PAID" || order.status === "FULFILLED",
                    current: false,
                },
                {
                    step: "FULFILLED",
                    title: "Dispatched / Delivered",
                    description:
                        order.status === "FULFILLED"
                            ? "Handed over to courier for Accra / nationwide delivery."
                            : "Courier dispatch scheduled upon packaging.",
                    timestamp: null,
                    completed: order.status === "FULFILLED",
                    current: order.status === "FULFILLED",
                },
            ];

            return res.json({
                id: order.id,
                customerName: order.customerName,
                maskedPhone: maskPhone(order.phone),
                maskedEmail: maskEmail(order.email),
                address: order.address,
                status: order.status,
                totalAmount: order.totalAmount,
                items: order.items,
                paymentRef: order.paymentRef,
                paymentProvider: order.paymentProvider,
                paidAt: order.paidAt,
                createdAt: order.createdAt,
                timeline,
            });
        } catch (error) {
            console.error("Failed to track order:", error);
            return res.status(500).json({ error: "Failed to track order" });
        }
    }
}
