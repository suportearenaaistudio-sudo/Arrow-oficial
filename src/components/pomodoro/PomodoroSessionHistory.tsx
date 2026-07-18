import { useEffect, useState } from 'react';
import { Coffee, Eye } from 'lucide-react';
import { getTodaySessions } from '@/lib/pomodoro-sessions';
import type { PomodoroSessionLog } from '@/types/pomodoro';

function fmtClock(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const MODE_ICONS = {
  focus: Eye,
  short_break: Coffee,
  long_break: Coffee,
} as const;

interface PomodoroSessionHistoryProps {
  compact?: boolean;
}

const HISTORY_LIMIT = 12;

export default function PomodoroSessionHistory({ compact }: PomodoroSessionHistoryProps) {
  const [sessions, setSessions] = useState<PomodoroSessionLog[]>(() => getTodaySessions());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => setSessions(getTodaySessions());
    window.addEventListener('arrow-pomodoro-sessions-updated', refresh);
    return () => window.removeEventListener('arrow-pomodoro-sessions-updated', refresh);
  }, []);

  if (sessions.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: 'var(--arrow-text-muted)' }}>
        Nenhuma sessão registrada hoje
      </p>
    );
  }

  const limit = compact ? 3 : HISTORY_LIMIT;
  const shown = expanded ? sessions : sessions.slice(0, limit);
  const hasMore = !compact && sessions.length > limit;

  return (
    <div className="space-y-1.5">
      {shown.map((s) => {
        const Icon = MODE_ICONS[s.mode];
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.mode === 'focus' ? 'var(--arrow-accent)' : '#22c55e' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--arrow-text-primary)' }}>
                {s.taskTitle || (s.mode === 'focus' ? 'Sessão de foco' : 'Pausa')}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>
                {fmtClock(s.startedAt)} · {s.durationMin} min
                {!s.completed && ' · cancelada'}
                {s.manual && ' · manual'}
              </p>
              {s.note && (
                <p className="text-[10px] truncate mt-0.5 italic" style={{ color: 'var(--arrow-text-secondary)' }}>
                  {s.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 text-[10px] font-medium rounded-lg"
          style={{ color: 'var(--arrow-accent)' }}
        >
          {expanded ? 'Mostrar menos' : `Ver todas (${sessions.length})`}
        </button>
      )}
    </div>
  );
}
