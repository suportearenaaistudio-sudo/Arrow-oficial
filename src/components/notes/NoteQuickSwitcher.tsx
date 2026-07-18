import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useNoteSearch } from '@/hooks/useNotes';

interface NoteQuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (noteId: string) => void;
}

export default function NoteQuickSwitcher({ open, onOpenChange, onSelect }: NoteQuickSwitcherProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useNoteSearch(query, open);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ir para nota</DialogTitle>
        </DialogHeader>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou conteúdo…"
          className="w-full px-3 py-2 rounded-xl border text-sm mb-2"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading && <p className="text-xs text-center py-4" style={{ color: theme.textMuted }}>Buscando…</p>}
          {!isLoading && results.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => { onSelect(note.id); onOpenChange(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm hover:opacity-80"
              style={{ background: 'var(--arrow-bg-elevated)' }}
            >
              <span className="font-medium" style={{ color: theme.textPrimary }}>{note.title}</span>
              {note.folder && (
                <span className="text-[10px] ml-2" style={{ color: theme.textMuted }}>{note.folder}</span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
