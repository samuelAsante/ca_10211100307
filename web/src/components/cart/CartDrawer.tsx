"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useValidateCoupon } from "@/hooks/use-coupons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  IconShoppingCart,
  IconTrash,
  IconPlus,
  IconMinus,
  IconTicket,
  IconX,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getDiscount = useCartStore((state) => state.getDiscount);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const [couponInput, setCouponInput] = useState("");
  const validateCouponMutation = useValidateCoupon();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotalPrice();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      const result = await validateCouponMutation.mutateAsync({
        code: couponInput.trim(),
        subtotal,
      });

      if (result.valid) {
        applyCoupon(result);
        toast.success(`Promo code "${result.code}" applied! You saved GH₵ ${result.discountAmount.toFixed(2)}`);
        setCouponInput("");
      } else {
        toast.error(result.message || "Invalid coupon code");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to validate promo code");
    }
  };

  const handleProceedToCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 z-50">
        <SheetHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconShoppingCart className="h-5 w-5 text-red-600" />
              <SheetTitle className="text-lg font-bold">Your Kitchenware Cart</SheetTitle>
              <Badge variant="secondary" className="text-xs">
                {items.reduce((acc, item) => acc + item.quantity, 0)} items
              </Badge>
            </div>
          </div>
          <SheetDescription className="text-xs text-neutral-500">
            Premium cookware and appliances delivered across Ghana.
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100 dark:divide-neutral-800 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-neutral-500 space-y-4">
              <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                <IconShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">Your cart is empty</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Browse our curated collections of pots, pans, and chef essentials.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push("/products");
                }}
                className="mt-2"
              >
                Browse Cookware Sets
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex gap-3 items-center">
                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                  <Image
                    src={item.image || "/fallback-image.webp"}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs font-semibold text-red-600 mt-0.5">
                    GH₵ {item.price.toFixed(2)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        aria-label="Decrease quantity"
                      >
                        <IconMinus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        aria-label="Increase quantity"
                      >
                        <IconPlus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-red-600 p-1 transition"
                      aria-label="Remove item"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    GH₵ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Coupon & Checkout */}
        {items.length > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
            {/* Promo Code Input or Active Badge */}
            {coupon ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                      {coupon.code}
                    </span>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      -GH₵ {coupon.discountAmount.toFixed(2)} applied
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeCoupon}
                  className="h-6 w-6 p-0 text-emerald-700 hover:text-emerald-900"
                  title="Remove coupon"
                >
                  <IconX className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <IconTicket className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <Input
                    placeholder="Promo code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="h-8 pl-8 text-xs font-mono uppercase"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={validateCouponMutation.isPending || !couponInput.trim()}
                  className="h-8 text-xs"
                >
                  {validateCouponMutation.isPending ? "Applying..." : "Apply"}
                </Button>
              </form>
            )}

            {/* Pricing Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>GH₵ {subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {coupon ? `(${coupon.code})` : "(Bulk 10%)"}</span>
                  <span>-GH₵ {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-neutral-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                <span>Total</span>
                <span className="text-red-600">GH₵ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-5 font-semibold"
              >
                Proceed to Checkout
                <IconArrowRight className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline underline-offset-2"
                >
                  View Full Cart & Items
                </Link>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
