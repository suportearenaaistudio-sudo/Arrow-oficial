import { Plus, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { Note } from '@/types/arrow';

interface NoteTabBarProps {
  tabs: string[];
  activeId: string | null;
  notes: Note[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
}

export default function NoteTabBar({
  tabs,
  activeId,
  notes,
  onSelect,
  onClose,
  onNewTab,
}: NoteTabBarProps) {
  const { theme, isDark } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 border-b overflow-x-auto shrink-0"
      style={{ borderColor: theme.border, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}
    >
      {tabs.map((id) => {
        const note = notes.find((n) => n.id === id);
        const title = note?.title || 'Sem título';
        const isActive = id === activeId;
        return (
          <div
            key={id}
            className="group flex items-center gap-1 px-2.5 py-1 rounded-t-lg text-xs shrink-0 cursor-pointer max-w-[180px]"
            style={{
              background: isActive ? theme.bg : 'transparent',
              color: isActive ? theme.textPrimary : theme.textMuted,
              borderBottom: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(id)}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
          >
            <span className="truncate">{title}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 shrink-0"
              aria-label="Fechar aba"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onNewTab}
        className="p-1 rounded-lg shrink-0 ml-0.5"
        style={{ color: theme.textMuted }}
        aria-label="Nova aba"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
