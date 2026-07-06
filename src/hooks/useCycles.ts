import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Cycle, WeeklyCheckin } from '@/types/arrow';

export function useCycles() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const cyclesQuery = useQuery({
    queryKey: ['cycles', profile?.id],
    queryFn: () => desktopAPI.db.cycles.list() as Promise<Cycle[]>,
    enabled: !!profile,
    retry: false,
  });

  const activeCycle = cyclesQuery.data?.find(c => c.status === 'ativo') || null;

  const createCycle = useMutation({
    mutationFn: async (cycle: Partial<Cycle>) => {
      const duration = cycle.duration || 12;
      const startDate = new Date(cycle.start_date!);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration * 7);

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

      return desktopAPI.db.cycles.create({
        ...cycle,
        end_date: endDate.toISOString().split('T')[0],
        weekly_checkins: checkins,
        duration,
      }) as Promise<Cycle>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      showSuccess('Ciclo criado com sucesso!');
    },
    onError: () => showError('Erro ao criar ciclo'),
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cycle> & { id: string }) => {
      return desktopAPI.db.cycles.update({ id, ...updates }) as Promise<Cycle>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles'] }),
    onError: () => showError('Erro ao atualizar ciclo'),
  });

  const activateCycle = useMutation({
    mutationFn: async (cycleId: string) => {
      await desktopAPI.db.cycles.activate(cycleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      showSuccess('Ciclo ativado!');
    },
    onError: () => showError('Erro ao ativar ciclo'),
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.db.cycles.delete(id);
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
