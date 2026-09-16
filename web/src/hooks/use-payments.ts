import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CheckoutPayload {
  items: Array<{
    id: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  totalAmount: number;
}

export interface CheckoutResponse {
  orderId: string;
  paymentRef: string;
  authorizationUrl?: string;
  accessCode?: string;
  amount: number;
  currency: string;
}

export interface PaymentStatusResponse {
  status: "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  orderId: string;
  paymentRef: string;
  failureReason?: string;
}

/**
 * Hook to poll payment status
 */
export function usePaymentStatus(
  ref?: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: ["payments", "status", ref],
    queryFn: async (): Promise<PaymentStatusResponse> => {
      const res = await api.get<PaymentStatusResponse>(`/api/payments/${encodeURIComponent(ref || "")}/status`);
      return res.data;
    },
    enabled: Boolean(ref) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Hook to initiate order checkout
 */
export function useCheckoutMutation() {
  return useMutation<CheckoutResponse, Error, CheckoutPayload>({
    mutationFn: async (payload) => {
      const res = await api.post<CheckoutResponse>("/api/orders/checkout", payload);
      return res.data;
    },
  });
}

/**
 * Hook to retry failed payment
 */
export function useRetryPaymentMutation() {
  return useMutation<{ authorizationUrl: string }, Error, string>({
    mutationFn: async (paymentRef) => {
      const res = await api.post<{ authorizationUrl: string }>(
        `/api/payments/${encodeURIComponent(paymentRef)}/retry`
      );
      return res.data;
    },
  });
}
