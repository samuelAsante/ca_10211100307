import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Order, OrderQueryParams, TrackOrderResponse } from "@/types";

/**
 * Hook to fetch admin orders list
 */
export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async (): Promise<Order[]> => {
      const res = await ordersApi.list<Order[]>(params);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch order status by ID
 */
export function useOrderStatus(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.status(orderId),
    queryFn: async () => {
      const res = await ordersApi.getStatus(orderId);
      return res.data;
    },
    enabled: Boolean(orderId),
  });
}

/**
 * Hook to fulfill an order
 */
export function useFulfillOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await ordersApi.fulfill(orderId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await ordersApi.cancel(orderId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Hook to publicly track an order by Order ID or customer phone number
 */
export function useTrackOrder(identifier: string) {
  const cleanId = identifier?.trim() || "";

  return useQuery<TrackOrderResponse, Error>({
    queryKey: queryKeys.orders.track(cleanId),
    queryFn: async () => {
      const res = await ordersApi.track<TrackOrderResponse>(cleanId);
      return res.data;
    },
    enabled: cleanId.length > 0,
    retry: 1,
    staleTime: 15 * 1000,
  });
}

