import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  ActiveCoupon,
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponPayload,
  ValidateCouponResponse,
} from "@/types";

/**
 * Hook to fetch all coupons for admin CRUD
 */
export function useCoupons() {
  return useQuery<Coupon[], Error>({
    queryKey: queryKeys.coupons.all,
    queryFn: async () => {
      const response = await couponsApi.listAll<Coupon[]>();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch all currently active public promotion campaigns
 */
export function useActiveCoupons() {
  return useQuery<ActiveCoupon[], Error>({
    queryKey: queryKeys.coupons.active(),
    queryFn: async () => {
      const response = await couponsApi.getActive<ActiveCoupon[]>();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to validate a promo / coupon code against current cart subtotal
 */
export function useValidateCoupon() {
  return useMutation<ValidateCouponResponse, Error, ValidateCouponPayload>({
    mutationFn: async (payload) => {
      const response = await couponsApi.validate<ValidateCouponResponse>(payload);
      return response.data;
    },
  });
}

/**
 * Admin: Hook to create a new coupon
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation<Coupon, Error, CreateCouponInput>({
    mutationFn: async (payload) => {
      const response = await couponsApi.create<Coupon>(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

/**
 * Admin: Hook to update an existing coupon
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation<Coupon, Error, { id: string; data: UpdateCouponInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await couponsApi.update<Coupon>(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

/**
 * Admin: Hook to delete a coupon
 */
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const response = await couponsApi.delete<{ success: boolean; message: string }>(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}
