import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import type { DailyPlan } from '@/types/arrow';
import { todayKey } from '@/lib/time-blocks';

export function useDailyPlan(date = todayKey()) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const key = ['daily-plan', profile?.id, date];
  const query = useQuery({
    queryKey: key,
    queryFn: () => desktopAPI.db.dailyPlans.get(date) as Promise<DailyPlan | null>,
    enabled: !!profile,
    retry: false,
  });
  const save = useMutation({
    mutationFn: (patch: Partial<DailyPlan>) => desktopAPI.db.dailyPlans.upsert({ date, ...patch }) as Promise<DailyPlan>,
    onSuccess: (plan) => queryClient.setQueryData(key, plan),
  });
  const plan = query.data ?? null;
  const taskIds = plan?.task_ids ?? [];
  return {
    plan, taskIds, isLoading: query.isLoading, save,
    setTasks: (ids: string[]) => save.mutate({ task_ids: [...new Set(ids)] }),
    setMit: (taskId: string | null, text?: string | null) => save.mutate({ mit_task_id: taskId, mit_text: text ?? null }),
    setEnergy: (energy: DailyPlan['energy_level']) => save.mutate({ energy_level: energy }),
  };
}
