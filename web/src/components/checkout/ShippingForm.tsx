"use client";

import React from "react";
import Link from "next/link";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ShippingFormData } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

export interface ShippingFormProps {
  register: UseFormRegister<ShippingFormData>;
  errors: FieldErrors<ShippingFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  mounted: boolean;
  hasItems: boolean;
  total: number;
}

export function ShippingForm({
  register,
  errors,
  onSubmit,
  isSubmitting,
  mounted,
  hasItems,
  total,
}: ShippingFormProps) {
  return (
    <Card className="border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Shipping Information</span>
          <Badge variant="outline" className="text-xs gap-1 font-normal text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Direct Courier Delivery
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g. Kwame Mensah"
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.fullName ? "true" : "false"}
              {...register("fullName", { required: "Name is required" })}
            />
            {errors.fullName && (
              <p className="text-destructive text-xs font-medium">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="kwame@example.com"
                autoComplete="email"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-destructive text-xs font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number (MoMo / WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="024 123 4567"
                autoComplete="tel"
                aria-required="true"
                aria-invalid={errors.phone ? "true" : "false"}
                {...register("phone", {
                  required: "Phone number is required",
                  minLength: {
                    value: 9,
                    message: "Phone number is too short",
                  },
                })}
              />
              {errors.phone && (
                <p className="text-destructive text-xs font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Delivery Address</Label>
            <Textarea
              id="address"
              placeholder="House/Apartment #, Street, Landmark, Area (e.g. East Legon near Shell)"
              autoComplete="street-address"
              aria-required="true"
              aria-invalid={errors.address ? "true" : "false"}
              className="min-h-[80px]"
              {...register("address", { required: "Delivery address is required" })}
            />
            {errors.address && (
              <p className="text-destructive text-xs font-medium">{errors.address.message}</p>
            )}
          </div>

          {/* Secure Payment Providers Notice */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
              <span className="font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Secured via Paystack
              </span>
              <span className="text-muted-foreground text-[11px]">Mobile Money &amp; Bank Cards</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <Badge variant="outline" className="bg-background/80 font-medium">MTN MoMo</Badge>
              <Badge variant="outline" className="bg-background/80 font-medium">Telecel Cash</Badge>
              <Badge variant="outline" className="bg-background/80 font-medium">AT Money</Badge>
              <Badge variant="outline" className="bg-background/80 font-medium">Visa / Mastercard</Badge>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !mounted || !hasItems}
            className="w-full h-12 rounded-full font-medium text-base shadow-sm transition"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initiating Secure Checkout...
              </>
            ) : (
              `Pay GH₵${total.toFixed(2)}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By placing your order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground transition">
              Privacy Policy
            </Link>.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
