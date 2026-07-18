import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function PomodoroFocusNoteDialog() {
  const { theme } = useTheme();
  const { pendingFocusNoteId, submitFocusNote, dismissFocusNote } = useFocusTimer();
  const [note, setNote] = useState('');

  const open = !!pendingFocusNoteId;

  function handleClose() {
    setNote('');
    dismissFocusNote();
  }

  function handleSave() {
    if (note.trim()) submitFocusNote(note.trim());
    else dismissFocusNote();
    setNote('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Como foi a sessão?</DialogTitle>
        </DialogHeader>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Adicione uma nota rápida (opcional) sobre o que você fez ou aprendeu.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Ex.: Terminei o relatório, próximo passo é revisar..."
          className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs"
            style={{ color: theme.textMuted }}
          >
            Pular
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: theme.accent, color: theme.accentForeground }}
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
