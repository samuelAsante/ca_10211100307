import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { getSession, requireAuth } from "../middleware/auth";

const router = Router();

// Paystack server-to-server webhook (signature verified inside the handler).
router.post("/webhook", PaymentController.webhook);

router.post("/initiate", PaymentController.initiatePayment);
router.get("/:ref/status", PaymentController.getPaymentStatus);
router.get("/:ref/verify", PaymentController.verifyPayment);
router.post("/:ref/retry", PaymentController.retryPayment);
router.get("/", getSession, requireAuth, PaymentController.listPayments);

export default router;
