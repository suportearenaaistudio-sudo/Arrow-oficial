import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Note, NoteBacklinksData, NoteGraphData } from '@/types/arrow';

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['note-folders'] });
    queryClient.invalidateQueries({ queryKey: ['note-backlinks'] });
    queryClient.invalidateQueries({ queryKey: ['note-graph'] });
  };

  const createNote = useMutation({
    mutationFn: async (note: Partial<Note> & { folder?: string }) => {
      return desktopAPI.notes.create(note) as Promise<Note>;
    },
    onSuccess: () => {
      invalidateAll();
      showSuccess('Nota criada!');
    },
    onError: () => showError('Erro ao criar nota'),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string; folder?: string }) => {
      return desktopAPI.notes.update({ id, ...updates }) as Promise<Note>;
    },
    onSuccess: () => invalidateAll(),
    onError: () => showError('Erro ao atualizar nota'),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.notes.delete(id);
    },
    onSuccess: () => {
      invalidateAll();
      showSuccess('Nota excluída');
    },
    onError: () => showError('Erro ao excluir nota'),
  });

  const resolveOrCreate = useMutation({
    mutationFn: async ({ title, folder }: { title: string; folder?: string }) => {
      return desktopAPI.notes.resolveOrCreate(title, folder) as Promise<Note>;
    },
    onSuccess: () => invalidateAll(),
  });

  const rebuildIndex = useMutation({
    mutationFn: () => desktopAPI.notes.rebuildIndex(),
    onSuccess: () => invalidateAll(),
  });

  const createFolder = useMutation({
    mutationFn: async (path: string) => {
      return desktopAPI.notes.createFolder(path) as Promise<{ success: boolean; path: string }>;
    },
    onSuccess: () => {
      invalidateAll();
      showSuccess('Pasta criada!');
    },
    onError: () => showError('Erro ao criar pasta'),
  });

  return {
    notes: query.data || [],
    isLoading: query.isLoading,
    createNote,
    updateNote,
    deleteNote,
    resolveOrCreate,
    rebuildIndex,
    createFolder,
  };
}

export function useNoteFolders() {
  const { profile } = useVault();
  return useQuery({
    queryKey: ['note-folders', profile?.id],
    queryFn: () => desktopAPI.notes.listFolders(),
    enabled: !!profile,
    retry: false,
  });
}

export function useNote(noteId: string | null) {
  const { profile } = useVault();
  return useQuery({
    queryKey: ['notes', profile?.id, noteId],
    queryFn: () => desktopAPI.notes.get(noteId!) as Promise<Note>,
    enabled: !!profile && !!noteId,
    retry: false,
  });
}

export function useNoteSearch(query: string, enabled = true) {
  const { profile } = useVault();
  return useQuery({
    queryKey: ['notes-search', profile?.id, query],
    queryFn: () => desktopAPI.notes.search(query, 20) as Promise<Note[]>,
    enabled: !!profile && enabled && query.length >= 0,
    retry: false,
  });
}

export function useNoteBacklinks(noteId: string | null) {
  const { profile } = useVault();
  return useQuery({
    queryKey: ['note-backlinks', profile?.id, noteId],
    queryFn: () => desktopAPI.notes.backlinks(noteId!) as Promise<NoteBacklinksData>,
    enabled: !!profile && !!noteId,
    retry: false,
  });
}

export function useNoteGraph(focusNoteId?: string | null, tag?: string | null) {
  const { profile } = useVault();
  return useQuery({
    queryKey: ['note-graph', profile?.id, focusNoteId, tag],
    queryFn: () =>
      desktopAPI.notes.graph(focusNoteId ?? undefined, tag ?? undefined) as Promise<NoteGraphData>,
    enabled: !!profile,
    retry: false,
  });
}
