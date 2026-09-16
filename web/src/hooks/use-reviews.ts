"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { CreateReviewInput, Review } from "@/types";

/**
 * Hook to fetch reviews for a specific product
 */
export function useReviews(productSlug?: string) {
  const cleanSlug = productSlug?.trim() || "";

  return useQuery<Review[], Error>({
    queryKey: queryKeys.reviews.byProduct(cleanSlug),
    queryFn: async () => {
      if (!cleanSlug) return [];
      const res = await reviewsApi.getByProduct<Review[]>(cleanSlug);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: Boolean(cleanSlug),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to submit a new product review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, CreateReviewInput>({
    mutationFn: async (payload: CreateReviewInput) => {
      const res = await reviewsApi.create<Review>(payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byProduct(variables.productSlug),
      });
    },
  });
}
