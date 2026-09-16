import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { CreateProductInput, Product, ProductQueryParams, UpdateProductInput } from "@/types";

/**
 * Hook to fetch products with optional query parameters
 */
export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async (): Promise<Product[]> => {
      const res = await productsApi.getAll<any>(params);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch low-stock products for admin restock alerts
 */
export function useLowStockProducts(threshold = 5) {
  return useQuery({
    queryKey: queryKeys.products.lowStock(threshold),
    queryFn: async () => {
      const res = await productsApi.getLowStock<{
        threshold: number;
        count: number;
        products: Product[];
      }>(threshold);
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single product by slug
 */
export function useProduct(slug?: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug || ""),
    queryFn: async (): Promise<Product | null> => {
      if (!slug) return null;
      const res = await productsApi.getBySlug<Product>(slug);
      return res.data;
    },
    enabled: Boolean(slug),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductInput) => {
      const res = await productsApi.create(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, ...payload }: UpdateProductInput & { slug: string }) => {
      const res = await productsApi.update(slug, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.slug) });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await productsApi.delete(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}
