import { useMemo, useState } from 'react';
import { Calendar, Check, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useReleaseSchedules } from '@/hooks/useReleaseSchedules';
import { accentForMediaType, RELEASE_STATUS_META } from '@/lib/release-schedule-themes';
import type {
  MediaList, MediaListItem, MediaListType, ReleaseSchedule, ReleaseRecurrence,
} from '@/types/arrow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReleaseSchedulePanelProps {
  activeList: MediaList | null;
  items: MediaListItem[];
}

type FormState = {
  title: string;
  subtitle: string;
  release_date: string;
  release_time: string;
  status: ReleaseSchedule['status'];
  media_item_id: string;
  link_to_calendar: boolean;
  notes: string;
  recurrence: ReleaseRecurrence | '';
  notify_days_before: number | '';
  color: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  release_date: '',
  release_time: '',
  status: 'upcoming',
  media_item_id: '',
  link_to_calendar: false,
  notes: '',
  recurrence: '',
  notify_days_before: '',
  color: '',
};

function groupLabel(dateStr: string): 'week' | 'month' | 'later' {
  const d = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (7 - now.getDay()));
  const monthEnd = new Date(now);
  monthEnd.setDate(now.getDate() + 30);
  if (d <= weekEnd) return 'week';
  if (d <= monthEnd) return 'month';
  return 'later';
}

const GROUP_TITLES = {
  week: 'Esta semana',
  month: 'Próximos 30 dias',
  later: 'Depois',
} as const;

export default function ReleaseSchedulePanel({ activeList, items }: ReleaseSchedulePanelProps) {
  const { theme, isDark } = useTheme();
  const mediaType = (activeList?.list_type === 'custom' ? 'custom' : activeList?.list_type) as MediaListType | undefined;
  const filterType = activeList?.is_system ? mediaType : null;
  const { schedules, createSchedule, updateSchedule, deleteSchedule, markReleased } =
    useReleaseSchedules(filterType ?? undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReleaseSchedule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const accent = accentForMediaType(filterType ?? 'custom');

  const grouped = useMemo(() => {
    const groups: Record<'week' | 'month' | 'later', ReleaseSchedule[]> = {
      week: [],
      month: [],
      later: [],
    };
    for (const s of schedules) {
      groups[groupLabel(s.release_date)].push(s);
    }
    return groups;
  }, [schedules]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      release_date: new Date().toISOString().slice(0, 10),
      media_item_id: '',
    });
    setDialogOpen(true);
  }

  function openEdit(s: ReleaseSchedule) {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? '',
      release_date: s.release_date,
      release_time: s.release_time ?? '',
      status: s.status,
      media_item_id: s.media_item_id ?? '',
      link_to_calendar: s.link_to_calendar,
      notes: s.notes ?? '',
      recurrence: s.recurrence ?? '',
      notify_days_before: s.notify_days_before ?? '',
      color: s.color ?? '',
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filterType || !activeList) return;
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      media_type: filterType,
      release_date: form.release_date,
      release_time: form.release_time || undefined,
      status: form.status,
      media_list_id: activeList.id,
      media_item_id: form.media_item_id || undefined,
      link_to_calendar: form.link_to_calendar,
      notes: form.notes.trim() || undefined,
      recurrence: form.recurrence || undefined,
      notify_days_before: form.notify_days_before === '' ? undefined : Number(form.notify_days_before),
      color: form.color || undefined,
    };
    if (editing) {
      updateSchedule.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createSchedule.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  if (!activeList?.is_system) {
    return (
      <div className="arrow-card p-4 text-center">
        <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: theme.textMuted }} />
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Cronogramas disponíveis nas listas padrão
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-1 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>
          Cronogramas
        </h3>
        <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
          {LIST_LABEL(filterType ?? 'custom')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {(['week', 'month', 'later'] as const).map((key) => {
          const list = grouped[key];
          if (list.length === 0) return null;
          return (
            <div key={key}>
              <p className="text-[10px] font-semibold mb-2 px-1" style={{ color: theme.textMuted }}>
                {GROUP_TITLES[key]}
              </p>
              <div className="space-y-2">
                {list.map((s) => {
                  const statusMeta = RELEASE_STATUS_META[s.status];
                  const itemAccent = s.color || accent;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl p-3 group"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
                        borderLeft: `3px solid ${itemAccent}`,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        borderLeftWidth: 3,
                        borderLeftColor: itemAccent,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold truncate" style={{ color: theme.textPrimary }}>
                            {s.title}
                          </h4>
                          {s.subtitle && (
                            <p className="text-[11px] truncate" style={{ color: theme.textMuted }}>
                              {s.subtitle}
                            </p>
                          )}
                          <p className="text-[10px] mt-1 tabular-nums" style={{ color: theme.textSecondary }}>
                            {formatDate(s.release_date)}
                            {s.release_time ? ` · ${s.release_time}` : ''}
                          </p>
                          <span
                            className="inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: `${statusMeta.color}22`, color: statusMeta.color }}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md opacity-60 group-hover:opacity-100">
                              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            {s.status !== 'released' && (
                              <DropdownMenuItem onClick={() => markReleased.mutate(s.id)}>
                                <Check className="w-3.5 h-3.5 mr-2" /> Marcar lançado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteSchedule.mutate(s.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {schedules.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: theme.textMuted }}>
            Nenhum lançamento agendado
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
        style={{ color: accent, border: `1px dashed ${accent}55` }}
      >
        <Plus className="w-3.5 h-3.5" /> Novo lançamento
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título"
              className="w-full px-3 py-2 rounded-xl border text-sm"
            />
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Subtítulo (opcional)"
              className="w-full px-3 py-2 rounded-xl border text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={form.release_date}
                onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
                className="px-3 py-2 rounded-xl border text-sm"
              />
              <input
                type="time"
                value={form.release_time}
                onChange={(e) => setForm((f) => ({ ...f, release_time: e.target.value }))}
                className="px-3 py-2 rounded-xl border text-sm"
              />
            </div>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReleaseSchedule['status'] }))}
              className="w-full px-3 py-2 rounded-xl border text-sm"
            >
              <option value="upcoming">Em breve</option>
              <option value="released">Lançado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <select
              value={form.media_item_id}
              onChange={(e) => setForm((f) => ({ ...f, media_item_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border text-sm"
            >
              <option value="">Vincular a item da lista (opcional)</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.link_to_calendar}
                onChange={(e) => setForm((f) => ({ ...f, link_to_calendar: e.target.checked }))}
              />
              Vincular ao calendário (cria tarefa com tag lancamento)
            </label>
            <select
              value={form.notify_days_before}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  notify_days_before: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border text-sm"
            >
              <option value="">Sem lembrete</option>
              <option value={1}>Lembrete 1 dia antes</option>
              <option value={3}>Lembrete 3 dias antes</option>
              <option value={7}>Lembrete 7 dias antes</option>
            </select>
            <select
              value={form.recurrence}
              onChange={(e) =>
                setForm((f) => ({ ...f, recurrence: e.target.value as ReleaseRecurrence | '' }))
              }
              className="w-full px-3 py-2 rounded-xl border text-sm"
            >
              <option value="">Sem recorrência</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notas"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
            />
            <button type="submit" className="arrow-btn-primary w-full">
              {editing ? 'Salvar' : 'Criar lançamento'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function LIST_LABEL(type: MediaListType): string {
  const labels: Record<MediaListType, string> = {
    filmes: 'Filmes',
    series: 'Séries',
    animes: 'Animes',
    animacao: 'Animação',
    jogos: 'Jogos',
    esportes: 'Esportes',
    livros: 'Livros',
    custom: 'Personalizada',
  };
  return labels[type] ?? type;
}
