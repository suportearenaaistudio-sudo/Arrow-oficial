import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import type { WeeklyPlan } from '@/types/arrow';

export function useWeeklyPlan(cycleId?: string, weekNumber?: number) {
  const { profile } = useVault(); const queryClient = useQueryClient();
  const key = ['weekly-plan', profile?.id, cycleId, weekNumber];
  const query = useQuery({ queryKey: key, queryFn: () => desktopAPI.db.weeklyPlans.get(cycleId!, weekNumber!) as Promise<WeeklyPlan | null>, enabled: !!profile && !!cycleId && !!weekNumber });
  const save = useMutation({ mutationFn: (data: Partial<WeeklyPlan>) => desktopAPI.db.weeklyPlans.upsert({ cycle_id: cycleId, week_number: weekNumber, ...data }) as Promise<WeeklyPlan>, onSuccess: (data) => queryClient.setQueryData(key, data) });
  return { plan: query.data, save };
}
