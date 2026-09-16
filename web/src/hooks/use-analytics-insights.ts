import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  Insight,
  InsightsPagination,
  InsightsQueryParams,
  InsightsResponse,
} from "@/types";

const defaultPagination: InsightsPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  offset: 0,
  hasMore: false,
  hasPrev: false,
};

export interface UseInsightsTimelineResult {
  insights: Insight[];
  pagination: InsightsPagination;
}

/**
 * Hook to fetch paginated AI insights timeline
 */
export function useInsightsTimeline(params: InsightsQueryParams = { page: 1, limit: 10 }) {
  const queryKey = queryKeys.analytics.insights(params);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<UseInsightsTimelineResult> => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));

      const res = await api.get<InsightsResponse>(`/api/insights?${searchParams.toString()}`);
      return {
        insights: res.data?.insights || [],
        pagination: res.data?.pagination || defaultPagination,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Mutation to trigger AI batch re-analysis
 */
export function useTriggerBatchAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const res = await api.post(`/api/admin/batches/${encodeURIComponent(batchId)}/analyze`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
