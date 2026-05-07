import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { DailyCheckin } from '@/types/arrow';

export function useDailyCheckin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const today = new Date().toISOString().split('T')[0];

  const todayCheckin = useQuery({
    queryKey: ['daily-checkin', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DailyCheckin | null;
    },
    enabled: !!user,
    retry: false,
  });

  const allCheckins = useQuery({
    queryKey: ['daily-checkins', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .order('date', { ascending: false })
        .limit(90);
      if (error) throw error;
      return (data || []) as unknown as DailyCheckin[];
    },
    enabled: !!user,
    retry: false,
  });

  const saveCheckin = useMutation({
    mutationFn: async (checkin: Partial<DailyCheckin>) => {
      const existing = todayCheckin.data;
      if (existing) {
        const { error } = await supabase.from('daily_checkins').update(checkin as any).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_checkins')
          .insert({ ...checkin, user_id: user!.id, date: today } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['daily-checkins'] });
      showSuccess('Check-in salvo!');
    },
    onError: () => showError('Erro ao salvar check-in'),
  });

  return {
    todayCheckin: todayCheckin.data,
    allCheckins: allCheckins.data || [],
    isLoading: todayCheckin.isLoading,
    saveCheckin,
  };
}
