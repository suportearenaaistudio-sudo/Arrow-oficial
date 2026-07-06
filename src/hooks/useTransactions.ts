import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Transaction } from '@/types/arrow';

export function useTransactions(filters?: { startDate?: string; endDate?: string }) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const query = useQuery({
    queryKey: ['transactions', profile?.id, filters],
    queryFn: () => desktopAPI.db.transactions.list(filters) as Promise<Transaction[]>,
    enabled: !!profile,
    retry: false,
  });

  const transactions = query.data || [];
  const receitas = transactions.filter(t => t.type === 'receita');
  const despesas = transactions.filter(t => t.type === 'despesa');
  const saldo = receitas.reduce((s, t) => s + t.amount, 0) - despesas.reduce((s, t) => s + t.amount, 0);

  const createTransaction = useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      return desktopAPI.db.transactions.create(tx) as Promise<Transaction>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transação registrada!');
    },
    onError: () => showError('Erro ao registrar transação'),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.db.transactions.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess('Transação excluída');
    },
    onError: () => showError('Erro ao excluir transação'),
  });

  return {
    transactions, receitas, despesas, saldo,
    isLoading: query.isLoading,
    createTransaction, deleteTransaction,
  };
}
