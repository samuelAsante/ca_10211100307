"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import { useCheckoutMutation, useRetryPaymentMutation, usePaymentStatus } from "@/hooks/use-payments";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCartStore } from "@/lib/store/cartStore";
import { ShippingForm, OrderSummary, PaymentStatusCard } from "@/components/checkout";
import type { ShippingFormData, PaymentState } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, getSubtotal, getDiscount, clearCart, coupon } = useCartStore();
  const { trackCheckout, trackEvent } = useAnalytics();

  const [mounted, setMounted] = useState(false);
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [activePaymentRef, setActivePaymentRef] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
    }
  }, []);

  const safeItems = mounted ? items : [];
  const subtotal = mounted ? (getSubtotal ? getSubtotal() : getTotalPrice()) : 0;
  const discount = mounted && getDiscount ? getDiscount() : 0;
  const total = mounted ? getTotalPrice() : 0;
  const shipping = 0;
  const finalTotal = total + shipping;

  const checkoutMutation = useCheckoutMutation();
  const retryPaymentMutation = useRetryPaymentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>();

  // Module-based query hook for polling payment status
  const isPollingEnabled = Boolean(
    activePaymentRef && payment?.status !== "SUCCESS" && payment?.status !== "FAILED"
  );
  const { data: polledStatus } = usePaymentStatus(activePaymentRef, {
    enabled: isPollingEnabled,
    refetchInterval: isPollingEnabled ? 1500 : false,
  });

  useEffect(() => {
    if (!polledStatus || !activePaymentRef) return;

    setPayment({
      paymentRef: activePaymentRef,
      orderId: activeOrderId || "",
      status: polledStatus.status,
      failureReason: polledStatus.failureReason,
    });

    if (polledStatus.status === "SUCCESS") {
      trackEvent("payment_success", { paymentRef: activePaymentRef, orderId: activeOrderId });
      toast.success("Payment successful!");
      clearCart();
      setTimeout(() => router.push("/checkout/success"), 1500);
    } else if (polledStatus.status === "FAILED") {
      trackEvent("payment_failed", {
        paymentRef: activePaymentRef,
        orderId: activeOrderId,
        reason: polledStatus.failureReason,
      });
      toast.error(`Payment failed: ${polledStatus.failureReason || "Transaction declined"}`);
    }
  }, [polledStatus, activePaymentRef, activeOrderId, trackEvent, clearCart, router]);

  const handleRetry = async () => {
    if (!payment) return;
    try {
      idempotencyKeyRef.current = uuidv4();
      setPayment((prev) => (prev ? { ...prev, status: "INITIATED" } : null));

      const resData = await retryPaymentMutation.mutateAsync(payment.paymentRef);
      const { paymentRef: newRef, authorizationUrl } = resData;

      if (authorizationUrl) {
        toast("Redirecting to secure payment...");
        window.location.href = authorizationUrl;
        return;
      }

      setPayment({ paymentRef: newRef, orderId: payment.orderId, status: "INITIATED" });
      setActivePaymentRef(newRef);
      setActiveOrderId(payment.orderId);
      toast("Retrying payment...");
    } catch {
      toast.error("Failed to retry payment");
    }
  };

  const onSubmit = async (data: ShippingFormData) => {
    try {
      trackCheckout("start", finalTotal);

      const headers: Record<string, string> = {};
      if (idempotencyKeyRef.current) {
        headers["Idempotency-Key"] = idempotencyKeyRef.current;
      }

      const clientOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = clientOrigin ? `${clientOrigin}/checkout/callback` : undefined;

      const responseData = await checkoutMutation.mutateAsync({
        payload: {
          ...data,
          cartItems: safeItems,
          total: finalTotal,
          callbackUrl,
          couponCode: coupon?.code,
        },
        headers,
      });

      trackCheckout("complete", finalTotal);

      const { orderId, paymentRef, authorizationUrl } = responseData;

      if (authorizationUrl) {
        toast("Redirecting to secure payment...");
        window.location.href = authorizationUrl;
        return;
      }

      setPayment({ paymentRef, orderId, status: "INITIATED" });
      setActivePaymentRef(paymentRef);
      setActiveOrderId(orderId);
      toast("Processing payment...");
    } catch (err) {
      console.error(err);
      trackEvent("checkout_failed", { itemCount: safeItems.length, total: finalTotal });
      const apiError = err instanceof Error ? err.message : "Failed to place order";
      toast.error(apiError);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {payment ? (
        <PaymentStatusCard
          payment={payment}
          total={finalTotal}
          onRetry={handleRetry}
          isRetrying={retryPaymentMutation.isPending}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <ShippingForm
              register={register}
              errors={errors}
              onSubmit={handleSubmit(onSubmit)}
              isSubmitting={checkoutMutation.isPending}
              mounted={mounted}
              hasItems={safeItems.length > 0}
              total={finalTotal}
            />
          </div>
          <div className="lg:col-span-5">
            <OrderSummary
              items={safeItems}
              subtotal={subtotal}
              discount={discount}
              total={finalTotal}
              couponCode={coupon?.code}
            />
          </div>
        </div>
      )}
    </main>
  );
}
