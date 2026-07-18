import { Plus, Network, FileText, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface NoteToolbarProps {
  mode: 'editor' | 'graph';
  onNewNote: () => void;
  onOpenGraph: () => void;
  onOpenEditor: () => void;
  onQuickSwitcher: () => void;
}

export default function NoteToolbar({
  mode,
  onNewNote,
  onOpenGraph,
  onOpenEditor,
  onQuickSwitcher,
}: NoteToolbarProps) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b shrink-0" style={{ borderColor: theme.border }}>
      <h1 className="text-lg font-bold arrow-gradient-text">Notas</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={onOpenEditor}
            className="px-3 py-1.5 text-xs flex items-center gap-1"
            style={{
              background: mode === 'editor' ? theme.accent : 'transparent',
              color: mode === 'editor' ? theme.accentForeground : theme.textSecondary,
            }}
          >
            <FileText className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            type="button"
            onClick={onOpenGraph}
            className="px-3 py-1.5 text-xs flex items-center gap-1"
            style={{
              background: mode === 'graph' ? theme.accent : 'transparent',
              color: mode === 'graph' ? theme.accentForeground : theme.textSecondary,
            }}
          >
            <Network className="w-3.5 h-3.5" /> Graph
          </button>
        </div>
        <button
          type="button"
          onClick={onQuickSwitcher}
          className="arrow-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <Search className="w-3.5 h-3.5" /> ⌘O
        </button>
        <button
          type="button"
          onClick={onNewNote}
          className="arrow-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
          style={{ color: theme.accentForeground }}
        >
          <Plus className="w-3.5 h-3.5" /> Nova Nota
        </button>
      </div>
    </div>
  );
}
