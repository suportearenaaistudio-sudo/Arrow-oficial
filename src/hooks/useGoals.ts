import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Goal } from '@/types/arrow';

function cleanGoalFilters(filters?: { category?: string; status?: string; search?: string; cycleId?: string }) {
  if (!filters) return undefined;
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== ''),
  );
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function useGoals(filters?: { category?: string; status?: string; search?: string; cycleId?: string }) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const apiFilters = cleanGoalFilters(filters);

  const goalsQuery = useQuery({
    queryKey: ['goals', profile?.id, apiFilters],
    queryFn: () => desktopAPI.db.goals.list(apiFilters) as Promise<Goal[]>,
    enabled: !!profile,
    retry: false,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: Partial<Goal>) => {
      return desktopAPI.db.goals.create(goal) as Promise<Goal>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('Meta criada com sucesso!');
    },
    onError: () => showError('Erro ao criar meta'),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      return desktopAPI.db.goals.update({ id, ...updates }) as Promise<Goal>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: () => showError('Erro ao atualizar meta'),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.db.goals.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('Meta excluída');
    },
    onError: () => showError('Erro ao excluir meta'),
  });

  const goals = goalsQuery.data || [];
  const stats = {
    total: goals.length,
    ativas: goals.filter(g => g.status === 'ativo').length,
    concluidas: goals.filter(g => g.status === 'concluido').length,
    pausadas: goals.filter(g => g.status === 'pausado').length,
  };

  return { goals, stats, isLoading: goalsQuery.isLoading, createGoal, updateGoal, deleteGoal };
}
