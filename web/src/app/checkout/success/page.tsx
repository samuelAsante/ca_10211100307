"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePaymentStatusMutation, useVerifyPaymentMutation } from "@/hooks/use-payments";
import { useCartStore } from "@/lib/store/cartStore";
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderDetails {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  paidAt?: string | null;
  createdAt: string;
}

interface PaymentInfo {
  paymentRef: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  failureReason?: string;
  processedAt?: string;
  metadata?: Record<string, any>;
  order?: OrderDetails;
}

function SuccessInner() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("ref") ||
    searchParams.get("reference") ||
    searchParams.get("trxref");
  const orderIdParam = searchParams.get("orderId");

  const clearCart = useCartStore((s) => s.clearCart);

  const [isLoading, setIsLoading] = useState(!!reference);
  const [paymentData, setPaymentData] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  const statusMutation = usePaymentStatusMutation();
  const verifyMutation = useVerifyPaymentMutation();

  const fetchReceipt = useCallback(async () => {
    if (!reference) {
      setIsLoading(false);
      return;
    }

    try {
      // First try status/receipt endpoint which includes order
      const info = (await statusMutation.mutateAsync(reference)) as PaymentInfo;
      setPaymentData(info);

      if (info.status === "SUCCESS") {
        clearCart();
      } else if (info.status === "INITIATED" || info.status === "PROCESSING") {
        // Attempt verification if not yet confirmed
        const verifyData = (await verifyMutation.mutateAsync(reference)) as PaymentInfo;
        setPaymentData(verifyData);
        if (verifyData.status === "SUCCESS") {
          clearCart();
        }
      }
    } catch (err) {
      console.error("[Success Page] Failed to fetch payment info:", err);
    } finally {
      setIsLoading(false);
    }
  }, [reference, clearCart, statusMutation, verifyMutation]);

  useEffect(() => {
    if (!reference) {
      setIsLoading(false);
      return;
    }
    if (fetchedRef.current === reference) return;
    fetchedRef.current = reference;
    fetchReceipt();
  }, [reference, fetchReceipt]);

  const copyReference = () => {
    const text = reference || paymentData?.paymentRef || "";
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
          Loading Order Receipt...
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Retrieving your payment details and order confirmation.
        </p>
      </div>
    );
  }

  // If accessed directly with no order reference or failed payment
  if (!reference && !paymentData) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          No Active Order Found
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          We could not find an active transaction for this session. If you recently completed an order, please check your email for confirmation.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          <ShoppingBag className="w-4 h-4" />
          Explore Kitchenware
        </Link>
      </div>
    );
  }

  const order = paymentData?.order;
  const items: OrderItem[] = Array.isArray(order?.items)
    ? (order?.items as OrderItem[])
    : [];
  const displayAmount = paymentData?.amount ?? order?.totalAmount ?? 0;
  const displayRef = reference || paymentData?.paymentRef || "N/A";
  const displayOrderId = order?.id || orderIdParam || paymentData?.orderId || "N/A";

  const isSuccess = paymentData?.status === "SUCCESS" || order?.status === "PAID";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 mt-6 sm:px-6 lg:px-8">
      {/* Print Controls / Action Bar */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      {/* Main Receipt Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className={`p-8 text-center border-b border-gray-200 dark:border-gray-800 ${
          isSuccess ? "bg-gradient-to-b from-green-50/50 dark:from-green-950/20" : "bg-gradient-to-b from-amber-50/50 dark:from-amber-950/20"
        }`}>
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
            isSuccess
              ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          }`}>
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
            isSuccess
              ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
          }`}>
            {isSuccess ? "Payment Confirmed" : "Order Processing"}
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isSuccess ? "Thank You For Your Order!" : "Order Received"}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            A confirmation receipt has been sent to{" "}
            <strong className="text-gray-900 dark:text-white">{order?.email || "your email"}</strong>.
            We will contact you shortly regarding delivery.
          </p>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/20 text-sm">
          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Order ID</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white block truncate">
              {displayOrderId}
            </span>
          </div>

          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Payment Reference</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs font-medium text-gray-900 dark:text-white truncate">
                {displayRef}
              </span>
              <button
                onClick={copyReference}
                className="text-gray-400 hover:text-gray-600 print:hidden"
                title="Copy reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Date &amp; Time</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white block mt-0.5">
              {paymentData?.processedAt || order?.createdAt
                ? new Date(paymentData?.processedAt || order?.createdAt || "").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
            </span>
          </div>

          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Total Amount</span>
            <span className="font-bold block mt-0.5 text-base text-indigo-600 dark:text-indigo-400">
              GH₵{Number(displayAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        {order && (
          <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Delivery Information
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{order.address}</span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{order.phone}</span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{order.email}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Payment Details
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {paymentData?.provider === "PAYSTACK" ? "Paystack" : "Direct Checkout"}
                  </span>
                  {paymentData?.metadata?.channel && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                      {paymentData.metadata.channel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currency: {paymentData?.currency || "GHS"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Paid on: {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itemized Table */}
        {items.length > 0 && (
          <div className="p-6 sm:p-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Items Ordered
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item, index) => (
                <div key={item.id || index} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {item.quantity}×
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    GH₵{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>GH₵{Number(displayAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t">
                <span>Total Paid</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  GH₵{Number(displayAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-200 dark:border-gray-800 text-center print:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
