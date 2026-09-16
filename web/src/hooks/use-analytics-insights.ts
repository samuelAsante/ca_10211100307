"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  Insight,
  InsightsPagination,
  InsightsQueryParams,
  InsightsResponse,
  MetricsData,
  AnalyticsBatch,
  AnalyticsJob,
  DeadLetterJob,
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
      const res = await analyticsApi.triggerBatchAnalysis(batchId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

/**
 * Hook to fetch admin analytics metrics
 */
export function useAdminMetrics(options?: { refetchInterval?: number | false }) {
  return useQuery<MetricsData, Error>({
    queryKey: queryKeys.analytics.metrics(),
    queryFn: async () => {
      const res = await analyticsApi.getMetrics<MetricsData>();
      return res.data;
    },
    refetchInterval: options?.refetchInterval ?? 10000,
    staleTime: 10 * 1000,
  });
}

/**
 * Hook to fetch admin telemetry batches
 */
export function useAdminBatches() {
  return useQuery<AnalyticsBatch[], Error>({
    queryKey: queryKeys.analytics.batches(),
    queryFn: async () => {
      const res = await analyticsApi.getBatches<{ batches?: AnalyticsBatch[] }>();
      return res.data?.batches || [];
    },
    staleTime: 15 * 1000,
  });
}

/**
 * Hook to fetch admin analysis jobs & dead-letter queue
 */
export function useAdminJobs(options?: { refetchInterval?: number | false }) {
  return useQuery<{ jobs: AnalyticsJob[]; deadLetterJobs: DeadLetterJob[] }, Error>({
    queryKey: queryKeys.analytics.jobs(),
    queryFn: async () => {
      const [jobsRes, dlqRes] = await Promise.all([
        analyticsApi.getJobs<{ jobs?: AnalyticsJob[] }>(),
        analyticsApi.getDeadLetterQueue<{ jobs?: DeadLetterJob[] }>(),
      ]);
      return {
        jobs: jobsRes.data?.jobs || [],
        deadLetterJobs: dlqRes.data?.jobs || [],
      };
    },
    refetchInterval: options?.refetchInterval ?? 10000,
    staleTime: 10 * 1000,
  });
}
