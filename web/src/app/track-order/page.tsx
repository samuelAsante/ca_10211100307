"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTrackOrder } from "@/hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconPackage,
  IconCheck,
  IconClock,
  IconTruck,
  IconAlertCircle,
  IconPhone,
  IconBrandWhatsapp,
  IconArrowLeft,
} from "@tabler/icons-react";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("id") || searchParams.get("orderId") || "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const { data: order, isLoading, isError, error, refetch } = useTrackOrder(activeQuery);

  useEffect(() => {
    if (initialQuery) {
      setSearchInput(initialQuery);
      setActiveQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setActiveQuery(searchInput.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULFILLED":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Delivered / Fulfilled</Badge>;
      case "PAID":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Paid & Preparing</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Awaiting Payment</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Link & Header */}
        <div className="space-y-3 text-center sm:text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Back to Ashanti&apos;s Kitchenware Store
          </Link>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Track Your Order
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Enter your Order ID or phone number to check live packaging, payment, and courier dispatch updates.
            </p>
          </div>
        </div>

        {/* Search Box */}
        <Card className="shadow-md border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  placeholder="Enter Order ID (e.g. clx...) or Phone Number"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-11 h-12 text-sm sm:text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center space-y-3">
            <IconAlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="font-semibold text-red-800 dark:text-red-300">
              No order found matching &quot;{activeQuery}&quot;
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto">
              Please check your confirmation email or Paystack receipt for the exact Order ID, or search using the phone number entered at checkout.
            </p>
          </div>
        )}

        {/* Order Details Found */}
        {order && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Order Status Header Card */}
            <Card className="shadow-md border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">Order Reference</span>
                  <p className="font-mono font-bold text-base sm:text-lg">{order.id}</p>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Timeline Stepper */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
                    Live Dispatch Progress
                  </h3>

                  <div className="relative pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-6">
                    {order.timeline?.map((step, idx) => {
                      const isComplete = step.completed;
                      const isCurrent = step.current;

                      return (
                        <div key={idx} className="relative group">
                          {/* Step Marker */}
                          <div
                            className={`absolute -left-[31px] top-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isComplete
                                ? "bg-emerald-600 text-white shadow-sm"
                                : isCurrent
                                ? "bg-red-600 text-white animate-pulse"
                                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            {isComplete ? (
                              <IconCheck className="h-3.5 w-3.5" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Step Content */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                {step.title}
                              </h4>
                              {step.timestamp && (
                                <span className="text-[11px] text-neutral-500">
                                  {new Date(step.timestamp).toLocaleDateString("en-GH", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cancelled Alert Banner */}
                {order.status === "CANCELLED" && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-4 flex items-start gap-3">
                    <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-800 dark:text-red-300">
                      <p className="font-semibold">This order has been cancelled.</p>
                      <p className="mt-0.5">
                        If you have questions regarding a refund or cancellation reason, please contact our support team.
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer & Delivery Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-500 block">Recipient</span>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white mt-0.5">
                      {order.customerName}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">{order.maskedPhone}</p>
                    <p className="text-neutral-600 dark:text-neutral-400">{order.maskedEmail}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-neutral-500 block">Delivery Address</span>
                    <p className="text-neutral-800 dark:text-neutral-200 mt-0.5 whitespace-pre-line">
                      {order.address}
                    </p>
                  </div>
                </div>

                {/* Purchased Items List */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    Ordered Cookware Items
                  </h4>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {Array.isArray(order.items) &&
                      order.items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 relative rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                              <Image
                                src={item.image || "/fallback-image.webp"}
                                alt={item.name || "Item"}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">{item.name}</p>
                              <p className="text-neutral-500">Qty: {item.quantity} × GH₵ {Number(item.price).toFixed(2)}</p>
                            </div>
                          </div>

                          <span className="font-bold text-neutral-900 dark:text-white">
                            GH₵ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Total Charged</span>
                    <span className="text-lg font-bold text-red-600">GH₵ {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Assistance Box */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Need help with this order?
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Our Accra customer care representatives are available Mon–Sat (8am–6pm).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs bg-white dark:bg-neutral-900"
                  >
                    <a href="tel:+233240000000">
                      <IconPhone className="h-3.5 w-3.5" />
                      Call Us
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <a
                      href={`https://wa.me/233240000000?text=${encodeURIComponent(
                        `Hello Ashanti's Kitchenware, I would like an update on my Order #${order.id}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandWhatsapp className="h-4 w-4" />
                      WhatsApp Help
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
