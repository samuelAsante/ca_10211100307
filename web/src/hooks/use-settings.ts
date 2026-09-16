"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { BusinessSettings, UpdateBusinessSettingsInput } from "@/types";

/**
 * Hook to fetch business settings
 */
export function useBusinessSettings() {
  return useQuery<BusinessSettings | null, Error>({
    queryKey: queryKeys.settings.business(),
    queryFn: async () => {
      const res = await settingsApi.get<BusinessSettings>();
      return res.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update business settings
 */
export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation<BusinessSettings, Error, UpdateBusinessSettingsInput>({
    mutationFn: async (payload: UpdateBusinessSettingsInput) => {
      const res = await settingsApi.update<BusinessSettings>(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}
