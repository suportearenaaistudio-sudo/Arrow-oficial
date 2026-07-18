import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Crown, Eye, Bookmark, X } from 'lucide-react';
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
  onUpdateRating?: (id: string, rating: number) => void;
}

function RatingDisplay({ rating, accent }: { rating: number; accent: string }) {
  const pct = Math.min(100, (rating / 10) * 100);
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tabular-nums" style={{ color: accent }}>
          {rating.toFixed(1)}/10
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: `${accent}22` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  );
}

function MediaItemCard({
  item,
  accent,
  rank,
  onMove,
  onDelete,
  onUpdateRating,
}: {
  item: MediaListItem;
  accent: string;
  rank?: number;
  onMove: (id: string, status: MediaItemStatus, rank?: number) => void;
  onDelete: (id: string) => void;
  onUpdateRating?: (id: string, rating: number) => void;
}) {
  const { theme, isDark } = useTheme();
  const [editingRating, setEditingRating] = useState(false);
  const [ratingDraft, setRatingDraft] = useState(item.rating ?? 0);

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
          {item.rating != null && item.rating > 0 && !editingRating && (
            <button type="button" onClick={() => setEditingRating(true)} className="w-full text-left">
              <RatingDisplay rating={item.rating} accent={accent} />
            </button>
          )}
          {editingRating && (
            <div className="mt-1.5 space-y-1">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={ratingDraft}
                onChange={(e) => setRatingDraft(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-lg text-xs"
                style={{ border: `1px solid ${theme.border}` }}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  className="text-[10px] px-2 py-0.5 rounded-md text-white"
                  style={{ background: accent }}
                  onClick={() => {
                    onUpdateRating?.(item.id, Math.min(10, Math.max(0, ratingDraft)));
                    setEditingRating(false);
                  }}
                >
                  OK
                </button>
                <button type="button" className="text-[10px] px-2 py-0.5" onClick={() => setEditingRating(false)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
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
            {onUpdateRating && (
              <DropdownMenuItem onClick={() => setEditingRating(true)}>
                Editar nota
              </DropdownMenuItem>
            )}
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
  listTheme,
  onAdd,
  onCancel,
}: {
  listTheme: ListTheme;
  onAdd: (data: { title: string; subtitle: string; rating?: number }) => void;
  onCancel: () => void;
}) {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [rating, setRating] = useState<number | ''>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      subtitle: subtitle.trim(),
      rating: rating === '' ? undefined : Number(rating),
    });
    setTitle('');
    setSubtitle('');
    setRating('');
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
      <div className="flex items-center gap-2">
        <span className="text-[11px] shrink-0" style={{ color: theme.textMuted }}>Nota (0–10)</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={rating}
          onChange={e => setRating(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="opcional"
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{ border: `1px solid ${theme.border}` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: listTheme.gradient }}
        >
          Adicionar
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: theme.textMuted }}>
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
  onUpdateRating,
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
            onUpdateRating={onUpdateRating}
          />
        ))}

        <AnimatePresence>
          {adding && (
            <InlineAddForm
              listTheme={listTheme}
              onAdd={onAdd}
              onCancel={() => setAdding(false)}
            />
          )}
        </AnimatePresence>
      </div>

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
