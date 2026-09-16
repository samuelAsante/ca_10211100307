"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api, paymentsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  CheckoutPayload,
  CheckoutResponse,
  PaymentStatusResponse,
} from "@/types";

export type {
  CheckoutPayload,
  CheckoutResponse,
  PaymentStatusResponse,
};

/**
 * Hook to poll or fetch payment status
 */
export function usePaymentStatus(
  ref?: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery<PaymentStatusResponse, Error>({
    queryKey: queryKeys.payments.status(ref || ""),
    queryFn: async () => {
      const res = await paymentsApi.getStatus<PaymentStatusResponse>(ref || "");
      return res.data;
    },
    enabled: Boolean(ref) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Hook to verify payment status
 */
export function useVerifyPayment(
  ref?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery<PaymentStatusResponse, Error>({
    queryKey: queryKeys.payments.verify(ref || ""),
    queryFn: async () => {
      const res = await paymentsApi.verify<PaymentStatusResponse>(ref || "");
      return res.data;
    },
    enabled: Boolean(ref) && (options?.enabled ?? true),
    retry: 1,
  });
}

/**
 * Mutation to explicitly verify payment
 */
export function useVerifyPaymentMutation() {
  return useMutation<PaymentStatusResponse, Error, string>({
    mutationFn: async (ref: string) => {
      const res = await paymentsApi.verify<PaymentStatusResponse>(ref);
      return res.data;
    },
  });
}

/**
 * Mutation to fetch current payment status
 */
export function usePaymentStatusMutation() {
  return useMutation<PaymentStatusResponse, Error, string>({
    mutationFn: async (ref: string) => {
      const res = await paymentsApi.getStatus<PaymentStatusResponse>(ref);
      return res.data;
    },
  });
}

/**
 * Hook to initiate order checkout
 */
export function useCheckoutMutation() {
  return useMutation<CheckoutResponse, Error, { payload: CheckoutPayload; headers?: Record<string, string> }>({
    mutationFn: async ({ payload, headers }) => {
      const res = await paymentsApi.checkout<CheckoutResponse>(payload, headers);
      return res.data;
    },
  });
}

/**
 * Hook to retry failed payment
 */
export function useRetryPaymentMutation() {
  return useMutation<{ authorizationUrl: string; paymentRef: string; orderId?: string }, Error, string>({
    mutationFn: async (paymentRef: string) => {
      const res = await paymentsApi.retry<{ authorizationUrl: string; paymentRef: string; orderId?: string }>(paymentRef);
      return res.data;
    },
  });
}
