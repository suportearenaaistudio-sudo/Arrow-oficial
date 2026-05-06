import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { Cycle, WeeklyCheckin } from '@/types/arrow';

export function useCycles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const cyclesQuery = useQuery({
    queryKey: ['cycles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Cycle[];
    },
    enabled: !!user,
    retry: false,
  });

  const activeCycle = cyclesQuery.data?.find(c => c.status === 'ativo') || null;

  const createCycle = useMutation({
    mutationFn: async (cycle: Partial<Cycle>) => {
      const duration = cycle.duration || 12;
      const startDate = new Date(cycle.start_date!);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration * 7);

      // Pre-populate weekly_checkins
      const checkins: WeeklyCheckin[] = Array.from({ length: duration }, (_, i) => {
        const weekDate = new Date(startDate);
        weekDate.setDate(weekDate.getDate() + i * 7);
        return {
          week_number: i + 1,
          date: weekDate.toISOString().split('T')[0],
          reflection: '',
          score: 0,
          achievements: [],
          challenges: '',
          next_week_focus: '',
        };
      });

      const { data, error } = await supabase
        .from('cycles')
        .insert({
          ...cycle,
          user_id: user!.id,
          end_date: endDate.toISOString().split('T')[0],
          weekly_checkins: checkins,
          duration,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      showSuccess('Ciclo criado com sucesso!');
    },
    onError: () => showError('Erro ao criar ciclo'),
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cycle> & { id: string }) => {
      const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
    onError: () => showError('Erro ao atualizar ciclo'),
  });

  const activateCycle = useMutation({
    mutationFn: async (cycleId: string) => {
      // Pause all active cycles first
      await supabase
        .from('cycles')
        .update({ status: 'pausado' })
        .eq('status', 'ativo')
        .eq('user_id', user!.id);

      // Activate the selected one
      const { error } = await supabase
        .from('cycles')
        .update({ status: 'ativo' })
        .eq('id', cycleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      showSuccess('Ciclo ativado!');
    },
    onError: () => showError('Erro ao ativar ciclo'),
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cycles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      showSuccess('Ciclo excluído');
    },
    onError: () => showError('Erro ao excluir ciclo'),
  });

  return {
    cycles: cyclesQuery.data || [],
    activeCycle,
    isLoading: cyclesQuery.isLoading,
    createCycle,
    updateCycle,
    activateCycle,
    deleteCycle,
  };
}

export function getCurrentWeek(cycle: Cycle): number {
  const now = new Date();
  const start = new Date(cycle.start_date);
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(diffWeeks, 1), cycle.duration);
}

export function getCycleProgress(cycle: Cycle): number {
  const week = getCurrentWeek(cycle);
  return Math.round((week / cycle.duration) * 100);
}
