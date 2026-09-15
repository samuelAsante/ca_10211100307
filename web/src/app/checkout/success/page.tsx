"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBackendUrl } from "@/lib/backend-url";
import { useCartStore } from "@/lib/store/cartStore";

type ViewState = "verifying" | "success" | "failed" | "pending";

function SuccessInner() {
  const params = useSearchParams();
  // Paystack appends ?reference=... (and ?trxref=...) to the callback URL.
  const reference = params.get("reference") || params.get("trxref");
  const clearCart = useCartStore((s) => s.clearCart);

  // No reference => we arrived from the simulation flow, which only redirects
  // here after a confirmed success.
  const [state, setState] = useState<ViewState>(reference ? "verifying" : "success");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      clearCart();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/payments/${reference}/verify`);
        const data = await res.json();
        if (cancelled) return;

        if (data?.status === "SUCCESS") {
          setState("success");
          clearCart();
        } else if (data?.status === "FAILED") {
          setState("failed");
          setReason(data?.failureReason ?? null);
        } else {
          setState("pending");
        }
      } catch {
        if (!cancelled) setState("pending");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, clearCart]);

  if (state === "verifying") {
    return (
      <Shell>
        <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto" />
        <h1 className="mt-6 text-2xl font-bold">Verifying your payment…</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Please wait while we confirm your transaction.
        </p>
      </Shell>
    );
  }

  if (state === "failed") {
    return (
      <Shell>
        <h1 className="text-3xl font-bold text-red-600">Payment Not Completed</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {reason || "Your payment could not be completed."} Your cart has been
          kept so you can try again.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/checkout"
            className="inline-block bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700"
          >
            Try again
          </Link>
          <Link
            href="/products"
            className="inline-block border px-5 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Continue shopping
          </Link>
        </div>
      </Shell>
    );
  }

  if (state === "pending") {
    return (
      <Shell>
        <h1 className="text-3xl font-bold text-yellow-600">Payment Processing</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Your payment is being processed. We&apos;ll email you a confirmation as
          soon as it&apos;s complete.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700"
        >
          Continue shopping
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold text-green-600">Order Placed Successfully!</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Thank you for your order. We&apos;ll reach out shortly to confirm your
        delivery.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-block bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700"
      >
        Continue Shopping
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      {children}
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto" />
        </Shell>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
