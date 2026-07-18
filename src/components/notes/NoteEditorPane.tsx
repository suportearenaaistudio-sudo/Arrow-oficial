import { useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import NoteSourceEditor from '@/components/notes/NoteSourceEditor';
import NotePreview from '@/components/notes/NotePreview';
import type { Note } from '@/types/arrow';

interface NoteEditorPaneProps {
  title: string;
  content: string;
  readingMode: boolean;
  notes: Note[];
  focusTitle?: boolean;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onWikilinkClick: (title: string) => void;
  onTitleFocused?: () => void;
}

export default function NoteEditorPane({
  title,
  content,
  readingMode,
  notes,
  focusTitle,
  onTitleChange,
  onContentChange,
  onWikilinkClick,
  onTitleFocused,
}: NoteEditorPaneProps) {
  const { theme } = useTheme();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
      onTitleFocused?.();
    }
  }, [focusTitle, onTitleFocused]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6 min-h-full">
        {readingMode ? (
          <div>
            <h1
              className="text-3xl font-bold mb-6 leading-tight"
              style={{ color: theme.textPrimary }}
            >
              {title || 'Sem título'}
            </h1>
            <NotePreview
              content={content}
              notes={notes}
              onWikilinkClick={onWikilinkClick}
              borderless
            />
          </div>
        ) : (
          <>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Sem título"
              className="w-full text-3xl font-bold mb-4 bg-transparent outline-none leading-tight"
              style={{ color: theme.textPrimary }}
            />
            <NoteSourceEditor
              value={content}
              onChange={onContentChange}
              notes={notes}
              borderless
            />
          </>
        )}
      </div>
    </div>
  );
}
