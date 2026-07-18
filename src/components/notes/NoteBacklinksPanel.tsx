import { X, Link2, Unlink } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNoteBacklinks } from '@/hooks/useNotes';

interface NoteBacklinksPanelProps {
  noteId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenNote: (id: string) => void;
  onFollowTitle: (title: string) => void;
}

export default function NoteBacklinksPanel({
  noteId,
  open,
  onClose,
  onOpenNote,
  onFollowTitle,
}: NoteBacklinksPanelProps) {
  const { theme } = useTheme();
  const { data, isLoading } = useNoteBacklinks(noteId);

  if (!open) return null;

  const backlinks = data?.backlinks || [];
  const unresolved = data?.unresolved || [];

  return (
    <div
      className="w-[280px] flex-shrink-0 border-l flex flex-col h-full"
      style={{ borderColor: theme.border, background: theme.bg }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: theme.border }}>
        <h4 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <Link2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          Backlinks
        </h4>
        <button type="button" onClick={onClose} className="p-1 rounded" style={{ color: theme.textMuted }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!noteId ? (
          <p className="text-xs" style={{ color: theme.textMuted }}>Selecione uma nota</p>
        ) : isLoading ? (
          <div className="arrow-spinner mx-auto mt-4" />
        ) : (
          <>
            {backlinks.length === 0 ? (
              <p className="text-[10px] mb-4" style={{ color: theme.textMuted }}>
                Nenhuma nota linka para esta ainda
              </p>
            ) : (
              <ul className="space-y-1 mb-4">
                {backlinks.map((bl) => (
                  <li key={bl.source_note_id}>
                    <button
                      type="button"
                      onClick={() => onOpenNote(bl.source_note_id)}
                      className="text-xs text-left w-full truncate hover:underline"
                      style={{ color: theme.accent }}
                    >
                      {bl.source_title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {unresolved.length > 0 && (
              <>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
                  <Unlink className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  Menções não criadas
                </h4>
                <ul className="space-y-1">
                  {unresolved.map((u, i) => (
                    <li key={`${u.target_title}-${i}`}>
                      <button
                        type="button"
                        onClick={() => onFollowTitle(u.target_title)}
                        className="text-xs text-left w-full truncate"
                        style={{ color: '#ef4444' }}
                      >
                        [[{u.target_title}]]
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
