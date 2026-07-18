import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';

export function useNoteNavigation() {
  const navigate = useNavigate();
  const { resolveOrCreate } = useNotes();

  const openNote = useCallback(
    (noteId: string) => {
      navigate(`/notes/${noteId}`);
    },
    [navigate],
  );

  const openGraph = useCallback(() => {
    navigate('/notes/graph');
  }, [navigate]);

  const openEditor = useCallback(() => {
    navigate('/notes');
  }, [navigate]);

  const followWikilink = useCallback(
    async (title: string, folder?: string) => {
      const note = await resolveOrCreate.mutateAsync({ title, folder });
      openNote(note.id);
      return note;
    },
    [resolveOrCreate, openNote],
  );

  return { openNote, openGraph, openEditor, followWikilink };
}
