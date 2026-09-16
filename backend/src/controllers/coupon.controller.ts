import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export interface CouponCalculationResult {
    discountAmount: number;
    newTotal: number;
}

export function calculateCouponDiscount(
    discountType: string,
    discountValue: number,
    maxDiscount: number | null,
    subtotal: number
): CouponCalculationResult {
    let discount = 0;
    if (discountType === 'percentage') {
        discount = (discountValue / 100) * subtotal;
        if (maxDiscount && discount > maxDiscount) {
            discount = maxDiscount;
        }
    } else {
        discount = Math.min(discountValue, subtotal);
    }

    const roundedDiscount = Math.round(discount * 100) / 100;
    const newTotal = Math.max(0, Math.round((subtotal - roundedDiscount) * 100) / 100);

    return { discountAmount: roundedDiscount, newTotal };
}

export class CouponController {
    /**
     * Validate coupon code for checkout
     */
    static async validateCoupon(req: Request, res: Response) {
        try {
            const { code, subtotal } = req.body;

            if (!code || typeof code !== 'string') {
                return res.status(400).json({ valid: false, message: 'Promo code is required' });
            }

            const numericSubtotal = Number(subtotal) || 0;
            const normalizedCode = code.trim().toUpperCase();

            // Query database for coupon
            const coupon = await prisma.coupon.findUnique({
                where: { code: normalizedCode },
            });

            if (!coupon || !coupon.isActive) {
                return res.status(404).json({
                    valid: false,
                    message: `Promo code "${code}" is invalid or inactive.`,
                });
            }

            if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                return res.status(400).json({
                    valid: false,
                    message: `Promo code "${code}" expired on ${new Date(coupon.expiresAt).toLocaleDateString()}`,
                });
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return res.status(400).json({
                    valid: false,
                    message: `Promo code "${code}" has reached its maximum usage limit.`,
                });
            }

            if (numericSubtotal < coupon.minSubtotal) {
                return res.status(400).json({
                    valid: false,
                    message: `Promo code "${code}" requires a minimum order of GH₵ ${coupon.minSubtotal.toFixed(2)} (current subtotal: GH₵ ${numericSubtotal.toFixed(2)})`,
                    minSubtotal: coupon.minSubtotal,
                });
            }

            const { discountAmount, newTotal } = calculateCouponDiscount(
                coupon.discountType,
                coupon.discountValue,
                coupon.maxDiscount,
                numericSubtotal
            );

            return res.json({
                valid: true,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                originalSubtotal: numericSubtotal,
                newTotal,
            });
        } catch (error) {
            console.error('[Coupons] Validation error:', error);
            return res.status(500).json({ valid: false, message: 'Failed to validate coupon code' });
        }
    }

    /**
     * Public list of active coupons for customer promotions banner
     */
    static async listActiveCoupons(req: Request, res: Response) {
        try {
            const active = await prisma.coupon.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    code: true,
                    description: true,
                    discountType: true,
                    discountValue: true,
                    minSubtotal: true,
                    maxDiscount: true,
                    expiresAt: true,
                },
            });
            return res.json(active);
        } catch (error) {
            console.error('[Coupons] Failed to list active coupons:', error);
            return res.status(500).json({ error: 'Failed to fetch active coupons' });
        }
    }

    /**
     * Admin: List all coupons with full CRUD metadata
     */
    static async listAllCoupons(req: Request, res: Response) {
        try {
            const coupons = await prisma.coupon.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return res.json(coupons);
        } catch (error) {
            console.error('[Coupons] Failed to list all coupons:', error);
            return res.status(500).json({ error: 'Failed to fetch coupons' });
        }
    }

    /**
     * Admin: Create new coupon
     */
    static async createCoupon(req: Request, res: Response) {
        try {
            const { code, description, discountType, discountValue, minSubtotal, maxDiscount, maxUses, expiresAt, isActive } = req.body;

            if (!code || !description || discountValue === undefined) {
                return res.status(400).json({ error: 'Code, description, and discount value are required.' });
            }

            const normalizedCode = code.trim().toUpperCase();

            const existing = await prisma.coupon.findUnique({
                where: { code: normalizedCode },
            });

            if (existing) {
                return res.status(409).json({ error: `Coupon code "${normalizedCode}" already exists.` });
            }

            const newCoupon = await prisma.coupon.create({
                data: {
                    code: normalizedCode,
                    description: description.trim(),
                    discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
                    discountValue: Number(discountValue) || 0,
                    minSubtotal: Number(minSubtotal) || 0,
                    maxDiscount: maxDiscount !== undefined && maxDiscount !== null ? Number(maxDiscount) : null,
                    maxUses: maxUses !== undefined && maxUses !== null ? Number(maxUses) : null,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    isActive: isActive !== undefined ? Boolean(isActive) : true,
                },
            });

            return res.status(201).json(newCoupon);
        } catch (error) {
            console.error('[Coupons] Failed to create coupon:', error);
            return res.status(500).json({ error: 'Failed to create coupon' });
        }
    }

    /**
     * Admin: Update coupon
     */
    static async updateCoupon(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, description, discountType, discountValue, minSubtotal, maxDiscount, maxUses, expiresAt, isActive } = req.body;

            const existing = await prisma.coupon.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            const updated = await prisma.coupon.update({
                where: { id },
                data: {
                    ...(code && { code: code.trim().toUpperCase() }),
                    ...(description !== undefined && { description: description.trim() }),
                    ...(discountType !== undefined && { discountType: discountType === 'fixed' ? 'fixed' : 'percentage' }),
                    ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
                    ...(minSubtotal !== undefined && { minSubtotal: Number(minSubtotal) }),
                    ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
                    ...(maxUses !== undefined && { maxUses: maxUses ? Number(maxUses) : null }),
                    ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
                    ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                },
            });

            return res.json(updated);
        } catch (error) {
            console.error('[Coupons] Failed to update coupon:', error);
            return res.status(500).json({ error: 'Failed to update coupon' });
        }
    }

    /**
     * Admin: Delete coupon
     */
    static async deleteCoupon(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.coupon.delete({ where: { id } });
            return res.json({ success: true, message: 'Coupon deleted successfully' });
        } catch (error) {
            console.error('[Coupons] Failed to delete coupon:', error);
            return res.status(500).json({ error: 'Failed to delete coupon' });
        }
    }
}
