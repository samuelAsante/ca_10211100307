"use client";

import React from "react";
import { PaymentState } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export interface PaymentStatusCardProps {
  payment: PaymentState;
  total: number;
  onRetry: () => void | Promise<void>;
  isRetrying?: boolean;
}

export function PaymentStatusCard({
  payment,
  total,
  onRetry,
  isRetrying = false,
}: PaymentStatusCardProps) {
  const getStatusBadge = (status: PaymentState["status"]) => {
    switch (status) {
      case "INITIATED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Initiated</Badge>;
      case "PROCESSING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">Processing</Badge>;
      case "SUCCESS":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Success</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      <Card className="border-border shadow-md">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="text-center">
            {payment.status === "INITIATED" && (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold">Initiating Secure Payment...</h2>
                <p className="text-sm text-muted-foreground">Connecting to Paystack gateway</p>
              </div>
            )}

            {payment.status === "PROCESSING" && (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-950/40 mx-auto flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold">Processing Payment...</h2>
                <p className="text-sm text-muted-foreground">
                  Please approve the mobile money prompt on your phone or wait while we confirm your card transaction.
                </p>
              </div>
            )}

            {payment.status === "SUCCESS" && (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/40 mx-auto flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">Payment Successful!</h2>
                <p className="text-sm text-muted-foreground">Redirecting to your order confirmation...</p>
              </div>
            )}

            {payment.status === "FAILED" && (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center text-destructive">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-destructive">Payment Failed</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {payment.failureReason || "The transaction could not be completed. Please try again."}
                  </p>
                </div>
                <Button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="rounded-full gap-2 px-6 shadow-sm"
                >
                  <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "Retrying..." : "Retry Payment"}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-5 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Reference</span>
              <span className="font-mono text-xs font-medium">{payment.paymentRef}</span>
            </div>

            {payment.orderId && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs font-medium">{payment.orderId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(payment.status)}
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-base">GH₵{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
