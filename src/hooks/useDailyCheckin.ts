import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import type { DailyCheckin } from '@/types/arrow';

export function useDailyCheckin() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const todayQuery = useQuery({
    queryKey: ['daily-checkin', profile?.id, today],
    queryFn: async () => {
      const data = await desktopAPI.db.checkins.getByDate(today);
      return data as DailyCheckin | null;
    },
    enabled: !!profile,
    retry: false,
  });

  const allQuery = useQuery({
    queryKey: ['daily-checkins', profile?.id],
    queryFn: async () => {
      return desktopAPI.db.checkins.list() as Promise<DailyCheckin[]>;
    },
    enabled: !!profile,
    retry: false,
  });

  const saveCheckin = useMutation({
    mutationFn: async (checkin: Partial<DailyCheckin>) => {
      return desktopAPI.db.checkins.upsert({ ...checkin, date: today }) as Promise<DailyCheckin>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['daily-checkins'] });
    },
  });

  return {
    todayCheckin: todayQuery.data,
    allCheckins: allQuery.data || [],
    isLoading: todayQuery.isLoading || allQuery.isLoading,
    upsertCheckin: saveCheckin,
    saveCheckin,
    hasCheckedInToday: !!todayQuery.data,
  };
}
