import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { useTheme } from '@/contexts/ThemeContext';
import { preprocessWikilinks, isWikilinkHref } from '@/lib/notes/wikilinks';
import type { Note } from '@/types/arrow';

interface NotePreviewProps {
  content: string;
  notes: Note[];
  onWikilinkClick: (title: string) => void;
  borderless?: boolean;
}

export default function NotePreview({ content, notes, onWikilinkClick, borderless = false }: NotePreviewProps) {
  const { theme } = useTheme();
  const processed = useMemo(() => preprocessWikilinks(content || ''), [content]);

  const titleSet = useMemo(
    () => new Set(notes.map((n) => n.title.toLowerCase())),
    [notes],
  );

  const components: Components = useMemo(
    () => ({
      a: ({ href, children }) => {
        const title = isWikilinkHref(href);
        if (title) {
          const exists = [...titleSet].some(
            (t) => t === title.toLowerCase(),
          );
          return (
            <button
              type="button"
              onClick={() => onWikilinkClick(title)}
              className="underline font-medium"
              style={{
                color: exists ? theme.accent : '#ef4444',
                textDecorationStyle: exists ? 'solid' : 'dashed',
              }}
            >
              {children}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>
            {children}
          </a>
        );
      },
      h1: ({ children }) => (
        <h1 className="text-xl font-bold mb-3 mt-1" style={{ color: theme.textPrimary }}>{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-semibold mb-2 mt-3" style={{ color: theme.textPrimary }}>{children}</h2>
      ),
      p: ({ children }) => (
        <p className="text-sm mb-2 leading-relaxed" style={{ color: theme.textSecondary }}>{children}</p>
      ),
      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-sm">{children}</ul>,
      code: ({ children }) => (
        <code className="px-1 py-0.5 rounded text-xs" style={{ background: theme.accentLight }}>{children}</code>
      ),
      pre: ({ children }) => (
        <pre className="p-3 rounded-xl text-xs overflow-x-auto mb-2" style={{ background: theme.accentLight }}>
          {children}
        </pre>
      ),
    }),
    [theme, titleSet, onWikilinkClick],
  );

  return (
    <div
      className={borderless ? 'min-h-0' : 'h-full min-h-0 overflow-y-auto rounded-xl border p-4'}
      style={borderless ? undefined : { borderColor: theme.border, background: 'var(--arrow-bg-elevated)' }}
    >
      {content?.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {processed}
        </ReactMarkdown>
      ) : (
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Preview aparecerá aqui…
        </p>
      )}
    </div>
  );
}
