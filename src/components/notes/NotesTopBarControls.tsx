import { Plus, Network, FileText, Search, FolderPlus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotesChrome } from '@/contexts/NotesChromeContext';

export default function NotesTopBarControls() {
  const { theme } = useTheme();
  const { mode, onNewNote, onNewFolder, onOpenGraph, onOpenEditor, onQuickSwitcher } =
    useNotesChrome();

  return (
    <div className="flex items-center justify-center gap-2 w-full">
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: theme.border }}>
        <button
          type="button"
          onClick={onOpenEditor}
          className="px-2.5 py-1 text-[11px] flex items-center gap-1 h-7"
          style={{
            background: mode === 'editor' ? theme.accent : 'transparent',
            color: mode === 'editor' ? theme.accentForeground : theme.textSecondary,
          }}
        >
          <FileText className="w-3 h-3" /> Editor
        </button>
        <button
          type="button"
          onClick={onOpenGraph}
          className="px-2.5 py-1 text-[11px] flex items-center gap-1 h-7"
          style={{
            background: mode === 'graph' ? theme.accent : 'transparent',
            color: mode === 'graph' ? theme.accentForeground : theme.textSecondary,
          }}
        >
          <Network className="w-3 h-3" /> Graph
        </button>
      </div>
      <button
        type="button"
        onClick={onQuickSwitcher}
        className="h-7 px-2.5 rounded-lg text-[11px] flex items-center gap-1 border"
        style={{ borderColor: theme.border, color: theme.textSecondary }}
      >
        <Search className="w-3 h-3" /> ⌘O
      </button>
      <button
        type="button"
        onClick={onNewFolder}
        className="h-7 px-2.5 rounded-lg text-[11px] flex items-center gap-1 border"
        style={{ borderColor: theme.border, color: theme.textSecondary }}
        title="Nova pasta"
      >
        <FolderPlus className="w-3 h-3" /> Pasta
      </button>
      <button
        type="button"
        onClick={onNewNote}
        className="h-7 px-2.5 rounded-lg text-[11px] flex items-center gap-1"
        style={{ background: theme.accent, color: theme.accentForeground }}
      >
        <Plus className="w-3 h-3" /> Nova Nota
      </button>
    </div>
  );
}
