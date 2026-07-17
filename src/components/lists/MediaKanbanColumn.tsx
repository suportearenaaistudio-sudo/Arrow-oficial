import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, MoreHorizontal, Crown, Eye, Bookmark, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { MediaListItem, MediaItemStatus } from '@/types/arrow';
import type { ListTheme } from '@/lib/list-themes';
import { STATUS_META } from '@/lib/list-themes';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_ICONS: Record<MediaItemStatus, typeof Crown> = {
  top: Crown,
  visto: Eye,
  a_ver: Bookmark,
};

interface MediaKanbanColumnProps {
  status: MediaItemStatus;
  items: MediaListItem[];
  theme: ListTheme;
  onAdd: (data: { title: string; subtitle: string; rating?: number }) => void;
  onMove: (id: string, status: MediaItemStatus, rank?: number) => void;
  onDelete: (id: string) => void;
}

function MediaItemCard({
  item,
  accent,
  rank,
  onMove,
  onDelete,
}: {
  item: MediaListItem;
  accent: string;
  rank?: number;
  onMove: (id: string, status: MediaItemStatus, rank?: number) => void;
  onDelete: (id: string) => void;
}) {
  const { theme, isDark } = useTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl p-3 transition-shadow hover:shadow-sm"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {rank !== undefined && (
            <div className="flex items-center gap-1 mb-1">
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                style={{ background: `${accent}22`, color: accent }}
              >
                #{rank}
              </span>
              {rank === 1 && <Crown className="w-3 h-3" style={{ color: accent }} />}
            </div>
          )}
          <h4 className="font-semibold text-[13px] leading-snug" style={{ color: theme.textPrimary }}>
            {item.title}
          </h4>
          {item.subtitle && (
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: theme.textMuted }}>
              {item.subtitle}
            </p>
          )}
          {item.rating != null && item.rating > 0 && (
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-2.5 h-2.5"
                  fill={i < Math.round(item.rating!) ? accent : 'none'}
                  style={{ color: i < Math.round(item.rating!) ? accent : theme.textMuted }}
                />
              ))}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(['top', 'visto', 'a_ver'] as MediaItemStatus[])
              .filter(s => s !== item.status)
              .map(s => (
                <DropdownMenuItem key={s} onClick={() => onMove(item.id, s)}>
                  Mover para {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-500">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

function InlineAddForm({
  status,
  listTheme,
  onAdd,
  onCancel,
}: {
  status: MediaItemStatus;
  listTheme: ListTheme;
  onAdd: (data: { title: string; subtitle: string; rating?: number }) => void;
  onCancel: () => void;
}) {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [rating, setRating] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), subtitle: subtitle.trim(), rating: rating || undefined });
    setTitle('');
    setSubtitle('');
    setRating(0);
    onCancel();
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="rounded-xl p-3 space-y-2"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${listTheme.accent}44`,
      }}
    >
      <input
        required
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          color: theme.textPrimary,
          border: `1px solid ${theme.border}`,
        }}
      />
      <input
        value={subtitle}
        onChange={e => setSubtitle(e.target.value)}
        placeholder={listTheme.subtitlePlaceholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          color: theme.textPrimary,
          border: `1px solid ${theme.border}`,
        }}
      />
      {status === 'top' && (
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: theme.textMuted }}>Nota</span>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs font-semibold w-6" style={{ color: listTheme.accent }}>
            {rating || '—'}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: listTheme.gradient }}
        >
          Adicionar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs"
          style={{ color: theme.textMuted }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.form>
  );
}

export default function MediaKanbanColumn({
  status,
  items,
  theme: listTheme,
  onAdd,
  onMove,
  onDelete,
}: MediaKanbanColumnProps) {
  const { theme, isDark } = useTheme();
  const [adding, setAdding] = useState(false);
  const StatusIcon = STATUS_ICONS[status];
  const meta = STATUS_META[status];

  const columnBg =
    status === 'top' ? listTheme.columnTop
    : status === 'visto' ? listTheme.columnVisto
    : listTheme.columnAVer;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden min-h-[360px]"
      style={{
        background: columnBg,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${listTheme.accent}22` }}
        >
          <StatusIcon className="w-3.5 h-3.5" style={{ color: listTheme.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
            {meta.label}
          </h3>
          <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
            {meta.description}
          </p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${listTheme.accent}18`, color: listTheme.accent }}
        >
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {items.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <listTheme.icon className="w-8 h-8 mb-2" style={{ color: listTheme.accent }} />
            <p className="text-xs text-center" style={{ color: theme.textMuted }}>
              Nenhum item em {meta.label}
            </p>
          </div>
        )}
        {items.map((item, i) => (
          <MediaItemCard
            key={item.id}
            item={item}
            accent={listTheme.accent}
            rank={status === 'top' ? i + 1 : undefined}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}

        <AnimatePresence>
          {adding && (
            <InlineAddForm
              status={status}
              listTheme={listTheme}
              onAdd={onAdd}
              onCancel={() => setAdding(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Add button */}
      {!adding && (
        <div className="p-3 pt-0">
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{
              color: listTheme.accent,
              border: `1px dashed ${listTheme.accent}55`,
              background: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${listTheme.accent}11`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar em {meta.label}
          </button>
        </div>
      )}
    </div>
  );
}
