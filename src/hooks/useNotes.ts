import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Note } from '@/types/arrow';

export function useNotes() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const query = useQuery({
    queryKey: ['notes', profile?.id],
    queryFn: () => desktopAPI.notes.list() as Promise<Note[]>,
    enabled: !!profile,
    retry: false,
  });

  const createNote = useMutation({
    mutationFn: async (note: Partial<Note> & { folder?: string }) => {
      return desktopAPI.notes.create(note) as Promise<Note>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showSuccess('Nota criada!');
    },
    onError: () => showError('Erro ao criar nota'),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string; folder?: string }) => {
      await desktopAPI.notes.update({ id, ...updates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
    onError: () => showError('Erro ao atualizar nota'),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.notes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showSuccess('Nota excluída');
    },
    onError: () => showError('Erro ao excluir nota'),
  });

  return { notes: query.data || [], isLoading: query.isLoading, createNote, updateNote, deleteNote };
}
