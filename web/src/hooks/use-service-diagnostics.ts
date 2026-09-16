import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, diagnosticsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { RunProbeVariables, ServiceOverview, ServiceProbeResult } from "@/types";

/**
 * Hook to fetch service diagnostics overview
 */
export function useServiceDiagnostics() {
  return useQuery({
    queryKey: queryKeys.diagnostics.overview(),
    queryFn: async (): Promise<ServiceOverview> => {
      const res = await diagnosticsApi.getOverview<ServiceOverview>();
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to run an individual service probe mutation
 */
export function useRunServiceProbe() {
  const queryClient = useQueryClient();

  return useMutation<ServiceProbeResult, Error, RunProbeVariables>({
    mutationFn: async ({ serviceKey, endpoint, body }) => {
      const start = Date.now();
      try {
        const res = await api.post(endpoint, body);
        const latencyMs = res.data?.latencyMs || Date.now() - start;
        return {
          running: false,
          status: "success",
          latencyMs,
          data: res.data,
          timestamp: new Date().toLocaleTimeString(),
        };
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        return {
          running: false,
          status: "error",
          latencyMs,
          error: err.message || `Probe failed for ${serviceKey}`,
          timestamp: new Date().toLocaleTimeString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diagnostics.overview() });
    },
  });
}
