import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Pencil } from 'lucide-react';
import type { AIConversation } from '@/lib/ai-types';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConversationSidebarProps {
  conversations: AIConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  loading?: boolean;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}: ConversationSidebarProps) {
  const { theme, isDark } = useTheme();
  const [renameTarget, setRenameTarget] = useState<AIConversation | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openRename(conv: AIConversation) {
    setRenameTarget(conv);
    setRenameTitle(conv.title);
  }

  function handleRenameConfirm() {
    if (!renameTarget) return;
    const title = renameTitle.trim();
    if (!title) return;
    onRename(renameTarget.id, title);
    setRenameTarget(null);
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    onDelete(deleteId);
    setDeleteId(null);
  }

  return (
    <>
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r pr-2"
        style={{ borderColor: 'var(--arrow-border)' }}
      >
        <button
          onClick={onNew}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-3 transition-opacity disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            color: isDark ? '#0B0B0B' : 'white',
          }}
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => {
            const active = conv.id === activeId;
            return (
              <div
                key={conv.id}
                className="group flex items-center gap-1 rounded-xl transition-colors"
                style={{
                  background: active ? 'var(--arrow-accent-light)' : 'transparent',
                }}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left text-sm min-w-0"
                  style={{
                    color: active ? 'var(--arrow-accent)' : 'var(--arrow-text-secondary)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRename(conv);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity hover:bg-white/5"
                  style={{ color: 'var(--arrow-text-muted)' }}
                  title="Renomear"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity mr-1 hover:bg-red-500/10"
                  style={{ color: '#ef4444' }}
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear conversa</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
            }}
            maxLength={80}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--arrow-bg-card)',
              border: '1px solid var(--arrow-border)',
              color: 'var(--arrow-text-primary)',
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ color: 'var(--arrow-text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!renameTitle.trim()}
              onClick={handleRenameConfirm}
              className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                color: isDark ? '#0B0B0B' : 'white',
              }}
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A conversa e todas as mensagens serão removidas permanentemente do seu vault local.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
