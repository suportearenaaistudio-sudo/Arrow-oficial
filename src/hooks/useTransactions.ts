import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { Transaction } from '@/types/arrow';

export function useTransactions(period?: { start: string; end: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const query = useQuery({
    queryKey: ['transactions', user?.id, period],
    queryFn: async () => {
      let q = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (period?.start) q = q.gte('date', period.start);
      if (period?.end) q = q.lte('date', period.end);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Transaction[];
    },
    enabled: !!user,
    retry: false,
  });

  const createTransaction = useMutation({
    mutationFn: async (t: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...t, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transação registrada!');
    },
    onError: () => showError('Erro ao registrar transação'),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transação excluída');
    },
    onError: () => showError('Erro ao excluir transação'),
  });

  const transactions = query.data || [];
  const receitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
  const despesas = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);

  return {
    transactions,
    isLoading: query.isLoading,
    receitas,
    despesas,
    saldo: receitas - despesas,
    createTransaction,
    deleteTransaction,
  };
}
