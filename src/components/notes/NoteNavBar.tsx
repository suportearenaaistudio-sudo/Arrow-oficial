import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, MoreHorizontal, Pencil } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteNavBarProps {
  folder: string | null;
  title: string;
  readingMode: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onFolderClick: () => void;
  onToggleReading: () => void;
  onDelete: () => void;
  onRebuildIndex: () => void;
}

export default function NoteNavBar({
  folder,
  title,
  readingMode,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onFolderClick,
  onToggleReading,
  onDelete,
  onRebuildIndex,
}: NoteNavBarProps) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0"
      style={{ borderColor: theme.border }}
    >
      <button
        type="button"
        onClick={onGoBack}
        disabled={!canGoBack}
        className="p-1.5 rounded-lg disabled:opacity-30"
        style={{ color: theme.textMuted }}
        aria-label="Voltar"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onGoForward}
        disabled={!canGoForward}
        className="p-1.5 rounded-lg disabled:opacity-30"
        style={{ color: theme.textMuted }}
        aria-label="Avançar"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 min-w-0 flex-1 px-2 text-xs">
        {folder && (
          <>
            <button
              type="button"
              onClick={onFolderClick}
              className="truncate hover:underline"
              style={{ color: theme.textMuted }}
            >
              {folder}
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" style={{ color: theme.textMuted }} />
          </>
        )}
        <span className="truncate font-medium" style={{ color: theme.textPrimary }}>
          {title || 'Sem título'}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggleReading}
        className="p-1.5 rounded-lg"
        style={{
          background: readingMode ? theme.accentLight : 'transparent',
          color: readingMode ? theme.accent : theme.textMuted,
        }}
        title={readingMode ? 'Modo edição (⌘E)' : 'Modo leitura (⌘E)'}
        aria-label={readingMode ? 'Modo edição' : 'Modo leitura'}
      >
        {readingMode ? <Pencil className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-lg"
            style={{ color: theme.textMuted }}
            aria-label="Mais opções"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRebuildIndex}>Reindexar links</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-500">
            Excluir nota
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
