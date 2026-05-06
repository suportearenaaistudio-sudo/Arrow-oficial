import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { Note } from '@/types/arrow';

export function useNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const query = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Note[];
    },
    enabled: !!user,
    retry: false,
  });

  const createNote = useMutation({
    mutationFn: async (note: Partial<Note>) => {
      const { data, error } = await supabase.from('notes').insert({ ...note, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showSuccess('Nota criada!');
    },
    onError: () => showError('Erro ao criar nota'),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { error } = await supabase.from('notes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
    onError: () => showError('Erro ao atualizar nota'),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showSuccess('Nota excluída');
    },
    onError: () => showError('Erro ao excluir nota'),
  });

  return { notes: query.data || [], isLoading: query.isLoading, createNote, updateNote, deleteNote };
}
