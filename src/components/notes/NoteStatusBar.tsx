import { useTheme } from '@/contexts/ThemeContext';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface NoteStatusBarProps {
  backlinkCount: number;
  wordCount: number;
  charCount: number;
  saveStatus: SaveStatus;
  onBacklinksClick: () => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function noteStats(content: string, title: string) {
  const full = `${title}\n${content}`;
  return {
    words: countWords(full),
    chars: full.length,
  };
}

export default function NoteStatusBar({
  backlinkCount,
  wordCount,
  charCount,
  saveStatus,
  onBacklinksClick,
}: NoteStatusBarProps) {
  const { theme } = useTheme();

  const saveLabel =
    saveStatus === 'saving' ? 'Salvando…' :
    saveStatus === 'saved' ? 'Salvo' :
    saveStatus === 'error' ? 'Erro ao salvar' : null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-1.5 border-t text-[10px] shrink-0 tabular-nums"
      style={{ borderColor: theme.border, color: theme.textMuted }}
    >
      <span className="opacity-70">Digite / para linkar uma nota</span>
      <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBacklinksClick}
        className="hover:underline"
        style={{ color: theme.textMuted }}
      >
        {backlinkCount} {backlinkCount === 1 ? 'link inverso' : 'links inversos'}
      </button>
      <span>{wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}</span>
      <span>{charCount} {charCount === 1 ? 'caractere' : 'caracteres'}</span>
      {saveLabel && (
        <span style={{ color: saveStatus === 'error' ? '#ef4444' : theme.accent }}>
          {saveLabel}
        </span>
      )}
      </div>
    </div>
  );
}
