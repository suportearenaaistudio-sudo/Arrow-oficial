import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { ReleaseSchedule, MediaListType } from '@/types/arrow';

export function useReleaseSchedules(mediaType?: MediaListType | null) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const queryKey = ['release-schedules', profile?.id, mediaType ?? 'all'];

  const schedulesQuery = useQuery({
    queryKey,
    queryFn: () =>
      desktopAPI.db.releaseSchedules.list(mediaType ?? undefined) as Promise<ReleaseSchedule[]>,
    enabled: !!profile,
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['release-schedules'] });

  const createSchedule = useMutation({
    mutationFn: (data: Partial<ReleaseSchedule>) => desktopAPI.db.releaseSchedules.create(data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Lançamento criado');
    },
    onError: () => showError('Erro ao criar lançamento'),
  });

  const updateSchedule = useMutation({
    mutationFn: (data: Partial<ReleaseSchedule> & { id: string }) =>
      desktopAPI.db.releaseSchedules.update(data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Lançamento atualizado');
    },
    onError: () => showError('Erro ao atualizar lançamento'),
  });

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => desktopAPI.db.releaseSchedules.delete(id, true),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Lançamento excluído');
    },
    onError: () => showError('Erro ao excluir lançamento'),
  });

  const markReleased = useMutation({
    mutationFn: (id: string) => desktopAPI.db.releaseSchedules.markReleased(id),
    onSuccess: () => {
      invalidate();
      showSuccess('Marcado como lançado');
    },
    onError: () => showError('Erro ao atualizar status'),
  });

  return {
    schedules: schedulesQuery.data ?? [],
    isLoading: schedulesQuery.isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markReleased,
  };
}
