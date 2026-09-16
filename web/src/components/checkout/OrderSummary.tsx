"use client";

import React from "react";
import Image from "next/image";
import { CartItem } from "@/lib/store/cartStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Truck, Tag } from "lucide-react";

export interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  shipping?: number;
}

export function OrderSummary({
  items,
  subtotal,
  discount,
  total,
  couponCode,
  shipping = 0,
}: OrderSummaryProps) {
  return (
    <Card className="border-border shadow-xs bg-card/60">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Order Summary
          </span>
          <Badge variant="secondary" className="text-xs font-normal">
            {items.reduce((acc, item) => acc + item.quantity, 0)} {items.length === 1 ? "item" : "items"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Your cart is currently empty.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 max-h-[360px] overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted/40">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-border shrink-0 bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                      Item
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × GH₵{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0">
                  GH₵{(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border/60 pt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">GH₵{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Tag className="w-3.5 h-3.5" />
                Discount {couponCode ? `(${couponCode})` : ""}
              </span>
              <span className="font-medium">-GH₵{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-muted-foreground">
            <span className="flex items-center gap-1.5 text-xs">
              <Truck className="w-3.5 h-3.5" />
              Delivery (Accra &amp; Nationwide)
            </span>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {shipping === 0 ? "Free" : `GH₵${shipping.toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between items-center font-bold text-lg pt-3 border-t border-border/80">
            <span>Total</span>
            <span className="text-primary font-bold">GH₵{total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
