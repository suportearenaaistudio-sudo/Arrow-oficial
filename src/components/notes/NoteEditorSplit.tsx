import NoteSourceEditor from '@/components/notes/NoteSourceEditor';
import NotePreview from '@/components/notes/NotePreview';
import type { Note } from '@/types/arrow';

interface NoteEditorSplitProps {
  content: string;
  onContentChange: (v: string) => void;
  notes: Note[];
  onWikilinkClick: (title: string) => void;
}

export default function NoteEditorSplit({
  content,
  onContentChange,
  notes,
  onWikilinkClick,
}: NoteEditorSplitProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 h-full">
      <NoteSourceEditor value={content} onChange={onContentChange} notes={notes} />
      <NotePreview content={content} notes={notes} onWikilinkClick={onWikilinkClick} />
    </div>
  );
}
