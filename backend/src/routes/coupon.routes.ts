import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { getSession, requireAuth } from '../middleware/auth';

const router = Router();

// Public endpoints
router.post('/validate', CouponController.validateCoupon);
router.get('/active', CouponController.listActiveCoupons);

// Admin CRUD endpoints
router.get('/', getSession, requireAuth, CouponController.listAllCoupons);
router.post('/', getSession, requireAuth, CouponController.createCoupon);
router.put('/:id', getSession, requireAuth, CouponController.updateCoupon);
router.delete('/:id', getSession, requireAuth, CouponController.deleteCoupon);

export default router;
