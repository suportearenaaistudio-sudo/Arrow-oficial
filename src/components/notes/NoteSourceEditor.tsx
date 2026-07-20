import { useCallback, useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { useTheme } from '@/contexts/ThemeContext';
import type { Note } from '@/types/arrow';

interface NoteSourceEditorProps {
  value: string;
  onChange: (v: string) => void;
  notes: Note[];
  borderless?: boolean;
}

export default function NoteSourceEditor({
  value,
  onChange,
  notes,
  borderless = false,
}: NoteSourceEditorProps) {
  const { isDark, theme } = useTheme();

  const noteCompletion = useMemo(
    () =>
      autocompletion({
        override: [
          (context: CompletionContext) => {
            const wikilink = context.matchBefore(/\[\[[^\]]*/);
            if (wikilink) {
              const query = wikilink.text.slice(2).toLowerCase();
              const options = notes
                .filter((n) => n.title.toLowerCase().includes(query))
                .slice(0, 12)
                .map((n) => ({
                  label: n.title,
                  type: 'text' as const,
                  apply: `${n.title}]]`,
                }));
              return { from: wikilink.from + 2, options, validFor: /^[^\]]*$/ };
            }

            const slash = context.matchBefore(/(?:^|[^\[])\/[^\s\[]*/);
            if (slash) {
              const slashIdx = slash.text.lastIndexOf('/');
              const query = slash.text.slice(slashIdx + 1).toLowerCase();
              const from = slash.from + slashIdx + 1;
              const options = notes
                .filter((n) => n.title.toLowerCase().includes(query))
                .slice(0, 12)
                .map((n) => ({
                  label: n.title,
                  type: 'text' as const,
                  apply: (view: EditorView, _c: unknown, fromPos: number, toPos: number) => {
                    view.dispatch({
                      changes: { from: fromPos - 1, to: toPos, insert: `[[${n.title}]]` },
                    });
                  },
                }));
              return { from, options, validFor: /^[^\s\[]*$/ };
            }

            return null;
          },
        ],
      }),
    [notes],
  );

  const borderlessTheme = useMemo(
    () =>
      EditorView.theme({
        '&': { backgroundColor: 'transparent' },
        '.cm-content': {
          padding: '0',
          fontSize: '16px',
          lineHeight: '1.7',
          fontFamily: 'inherit',
        },
        '.cm-scroller': { overflow: 'auto', minHeight: '200px' },
        '.cm-gutters': { display: 'none' },
        '.cm-activeLine': { backgroundColor: 'transparent !important' },
        '.cm-cursor': { borderLeftColor: theme.accent },
      }),
    [theme.accent],
  );

  const extensions = useMemo(
    () => [markdown(), noteCompletion, ...(borderless ? [borderlessTheme] : [])],
    [noteCompletion, borderless, borderlessTheme],
  );

  const handleChange = useCallback((v: string) => onChange(v), [onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('arrow-notes-save'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={borderless ? 'min-h-[200px]' : 'h-full min-h-0 overflow-hidden rounded-xl border'} style={borderless ? undefined : { borderColor: 'var(--arrow-border)' }}>
      <CodeMirror
        value={value}
        height={borderless ? '200px' : '100%'}
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        onChange={handleChange}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
        }}
        className={
          borderless
            ? 'text-base [&_.cm-editor]:bg-transparent [&_.cm-editor]:outline-none'
            : 'h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:min-h-[320px]'
        }
      />
    </div>
  );
}
