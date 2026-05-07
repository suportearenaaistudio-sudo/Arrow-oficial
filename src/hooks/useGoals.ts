import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { Goal } from '@/types/arrow';

export function useGoals(filters?: { category?: string; status?: string; search?: string; cycleId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const goalsQuery = useQuery({
    queryKey: ['goals', user?.id, filters],
    queryFn: async () => {
      let query = supabase.from('goals').select('*').order('updated_at', { ascending: false });
      if (filters?.category) query = query.eq('category', filters.category as any);
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.cycleId) query = query.eq('cycle_id', filters.cycleId);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
    enabled: !!user,
    retry: false,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: Partial<Goal>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('Meta criada com sucesso!');
    },
    onError: () => showError('Erro ao criar meta'),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase.from('goals').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => showError('Erro ao atualizar meta'),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
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
