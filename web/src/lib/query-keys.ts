/**
 * Central Query Keys Factory
 * Provides stable, typed hierarchical keys for TanStack Query caching and invalidation.
 * Standard pattern: queryKeys.<feature>.<operation>(params)
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) =>
      [...queryKeys.products.details(), slug] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    insights: (params?: Record<string, any>) =>
      [...queryKeys.analytics.all, "insights", params] as const,
    metrics: (params?: Record<string, any>) =>
      [...queryKeys.analytics.all, "metrics", params] as const,
    stats: () => [...queryKeys.analytics.all, "stats"] as const,
    batches: () => [...queryKeys.analytics.all, "batches"] as const,
    jobs: () => [...queryKeys.analytics.all, "jobs"] as const,
  },
  diagnostics: {
    all: ["diagnostics"] as const,
    overview: () => [...queryKeys.diagnostics.all, "overview"] as const,
    service: (serviceKey: string) =>
      [...queryKeys.diagnostics.all, "service", serviceKey] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (params?: Record<string, any>) =>
      [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.orders.details(), id] as const,
    status: (id: string) =>
      [...queryKeys.orders.all, "status", id] as const,
  },
} as const;
