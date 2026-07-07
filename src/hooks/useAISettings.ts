import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVault } from '@/contexts/VaultContext';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';
import type { AISettings } from '@/lib/ai-types';

export function useAISettings() {
  const { profile } = useVault();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['ai-settings', profile?.id],
    queryFn: () => desktopAPI.ai.getSettings() as Promise<AISettings>,
    enabled: isDesktop() && !!profile,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const saveApiKey = useMutation({
    mutationFn: (apiKey: string) => desktopAPI.ai.saveApiKey(apiKey) as Promise<AISettings>,
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-settings', profile?.id], data);
    },
  });

  const removeApiKey = useMutation({
    mutationFn: () => desktopAPI.ai.removeApiKey() as Promise<AISettings>,
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-settings', profile?.id], data);
    },
  });

  const saveModel = useMutation({
    mutationFn: (model: string) => desktopAPI.ai.saveModel(model) as Promise<AISettings>,
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-settings', profile?.id], data);
    },
  });

  const testApiKey = useMutation({
    mutationFn: ({ apiKey, model }: { apiKey?: string; model?: string }) =>
      desktopAPI.ai.testApiKey(apiKey, model),
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    configured: settingsQuery.data?.configured ?? false,
    weeklyUsage: settingsQuery.data?.weeklyUsage,
    model: settingsQuery.data?.model,
    saveApiKey,
    saveModel,
    removeApiKey,
    testApiKey,
    refetch: settingsQuery.refetch,
  };
}
