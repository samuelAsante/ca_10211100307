"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { getBackendUrl } from "@/lib/backend-url";
import { useCartStore } from "@/lib/store/cartStore";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";

type CallbackStatus = "verifying" | "success" | "failed" | "pending";

interface PaymentVerifyResponse {
  paymentRef: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status: "SUCCESS" | "FAILED" | "INITIATED" | "PROCESSING";
  failureReason?: string;
  order?: {
    id: string;
    customerName: string;
    totalAmount: number;
    status: string;
  };
}

const MAX_AUTO_POLLS = 3;

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const { trackEvent } = useAnalytics();

  // Paystack returns ?reference=PAY-xxx or ?trxref=PAY-xxx
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setData] = useState<PaymentVerifyResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  // Guard refs to prevent duplicate calls, race conditions, or infinite render loops
  const verifiedRef = useRef<string | null>(null);
  const isVerifyingRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest callbacks in refs so verifyPayment does not churn on outer state changes
  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;

  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  const routerRef = useRef(router);
  routerRef.current = router;

  const clearAllTimeouts = useCallback(() => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const verifyPayment = useCallback(
    async (forced = false) => {
      if (!reference) {
        setStatus("failed");
        setErrorMessage("No payment reference found in the return URL.");
        return;
      }

      // If already verified or currently executing, skip unless forced
      if (!forced && (verifiedRef.current === reference || isVerifyingRef.current)) {
        return;
      }

      verifiedRef.current = reference;
      isVerifyingRef.current = true;
      setStatus("verifying");
      setErrorMessage(null);

      try {
        const backendUrl = getBackendUrl();
        const res = await axios.get<PaymentVerifyResponse>(
          `${backendUrl}/api/payments/${encodeURIComponent(reference)}/verify`
        );

        const result = res.data;
        setData(result);

        if (result.status === "SUCCESS") {
          clearCartRef.current();
          setStatus("success");
          trackEventRef.current(
            "payment_success",
            {
              paymentRef: reference,
              orderId: result.orderId || result.order?.id,
            },
            { throttleMs: 5000, dedupeKey: `payment_success:${reference}` }
          );

          clearAllTimeouts();
          redirectTimeoutRef.current = setTimeout(() => {
            const targetOrderId = result.orderId || result.order?.id || "";
            routerRef.current.replace(
              `/checkout/success?ref=${encodeURIComponent(reference)}&orderId=${encodeURIComponent(targetOrderId)}`
            );
          }, 1500);
          return;
        }

        if (result.status === "FAILED") {
          setStatus("failed");
          setErrorMessage(result.failureReason || "Payment was not completed.");
          trackEventRef.current(
            "payment_failed",
            {
              paymentRef: reference,
              reason: result.failureReason,
            },
            { throttleMs: 5000, dedupeKey: `payment_failed:${reference}` }
          );
          return;
        }

        // Status is still PROCESSING or INITIATED
        setStatus("pending");
      } catch (err) {
        console.error("[Paystack Callback] Primary verification error:", err);
        // Fallback check against status endpoint
        try {
          const backendUrl = getBackendUrl();
          const fallbackRes = await axios.get<PaymentVerifyResponse>(
            `${backendUrl}/api/payments/${encodeURIComponent(reference)}/status`
          );
          const fallback = fallbackRes.data;
          setData(fallback);

          if (fallback.status === "SUCCESS") {
            clearCartRef.current();
            setStatus("success");
            clearAllTimeouts();
            redirectTimeoutRef.current = setTimeout(() => {
              const targetOrderId = fallback.orderId || fallback.order?.id || "";
              routerRef.current.replace(
                `/checkout/success?ref=${encodeURIComponent(reference)}&orderId=${encodeURIComponent(targetOrderId)}`
              );
            }, 1500);
            return;
          }

          if (fallback.status === "FAILED") {
            setStatus("failed");
            setErrorMessage(fallback.failureReason || "Payment could not be verified.");
            return;
          }

          setStatus("pending");
        } catch (fallbackErr) {
          console.error("[Paystack Callback] Fallback verification error:", fallbackErr);
          setStatus("failed");
          setErrorMessage("Could not connect to payment server. Please verify your connection.");
        }
      } finally {
        isVerifyingRef.current = false;
      }
    },
    [reference, clearAllTimeouts]
  );

  // Initial verification on mount
  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setStatus("failed");
      setErrorMessage("No payment reference found in the return URL.");
    }

    return () => {
      clearAllTimeouts();
    };
  }, [reference, verifyPayment, clearAllTimeouts]);

  // Automated graceful polling if status is pending (up to MAX_AUTO_POLLS times)
  useEffect(() => {
    if (status === "pending" && pollAttempt < MAX_AUTO_POLLS) {
      pollTimeoutRef.current = setTimeout(() => {
        setPollAttempt((prev) => prev + 1);
        verifyPayment(true);
      }, 3000);

      return () => {
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
      };
    }
  }, [status, pollAttempt, verifyPayment]);

  const handleManualCheck = () => {
    clearAllTimeouts();
    verifyPayment(true);
  };

  const handleRetryPayment = async () => {
    if (!reference || isRetrying) return;
    setIsRetrying(true);
    setErrorMessage(null);
    clearAllTimeouts();

    try {
      const backendUrl = getBackendUrl();
      const res = await axios.post(
        `${backendUrl}/api/payments/${encodeURIComponent(reference)}/retry`
      );
      const { authorizationUrl } = res.data;

      if (authorizationUrl) {
        window.location.href = authorizationUrl;
        return;
      }

      // If no new authorization URL was required, re-run verification
      await verifyPayment(true);
    } catch (err: any) {
      console.error("[Paystack Callback] Retry failed:", err);
      setErrorMessage(
        err?.response?.data?.error || "Could not re-initiate payment. Please return to checkout."
      );
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-xl text-center">
        {status === "verifying" && (
          <div className="space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Verifying Payment
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Confirming your transaction with Paystack. Please do not close or refresh this page.
              </p>
            </div>
            {reference && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 font-mono text-xs text-gray-500">
                Ref: {reference}
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Confirmed!
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your payment was received successfully. Redirecting to your receipt...
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={`/checkout/success?ref=${encodeURIComponent(reference || "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                View Order Receipt
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Not Completed
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {errorMessage || "Your transaction was cancelled or declined by your provider."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your items are still saved in your cart.
              </p>
            </div>

            {reference && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 font-mono text-xs text-gray-500">
                Reference: {reference}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={handleRetryPayment}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Preparing..." : "Try Again with Paystack"}
              </button>
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-6 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Back to Checkout
              </Link>
            </div>
          </div>
        )}

        {status === "pending" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <Clock className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Still Processing
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {pollAttempt < MAX_AUTO_POLLS
                  ? `Checking status with provider (attempt ${pollAttempt + 1} of ${MAX_AUTO_POLLS})...`
                  : "We are waiting for final confirmation from Paystack or your mobile money provider. If you have approved the prompt on your phone, click below to re-check."}
              </p>
            </div>

            <div className="flex flex-col gap-3 justify-center pt-2">
              <button
                onClick={handleManualCheck}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status Again
              </button>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:underline"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
