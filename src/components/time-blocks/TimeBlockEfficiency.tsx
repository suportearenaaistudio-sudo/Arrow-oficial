import { useMemo } from 'react';
import type { PlannedTimeBlock } from '@/types/time-blocks';
import { TIME_BLOCK_META } from '@/types/time-blocks';
import { blockFillPercent } from '@/lib/time-blocks';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import ProgressRing from '@/components/ui/ProgressRing';

interface TimeBlockEfficiencyProps {
  blocks: PlannedTimeBlock[];
  compact?: boolean;
}

function avgFillByType(blocks: PlannedTimeBlock[], type: keyof typeof TIME_BLOCK_META): number {
  const filtered = blocks.filter((b) => b.type === type);
  if (filtered.length === 0) return 0;
  return Math.round(
    filtered.reduce((acc, b) => acc + blockFillPercent(b), 0) / filtered.length,
  );
}

function completedBlocksPct(blocks: PlannedTimeBlock[]): number {
  if (blocks.length === 0) return 0;
  const done = blocks.filter((b) => blockFillPercent(b) >= 100).length;
  return Math.round((done / blocks.length) * 100);
}

const STAT_HINTS: Record<string, string> = {
  Foco: 'Média de preenchimento dos blocos marcados como Foco (trabalho profundo).',
  Estratégico:
    'Média dos blocos de planejamento e decisão — revisão de metas, priorização, reflexão.',
  Hoje: 'Percentual do tempo planejado hoje que já foi executado.',
  Pomodoros: 'Progresso em relação à sua meta diária de pomodoros.',
  Concluídos: 'Percentual de blocos do dia marcados como 100% preenchidos.',
};

export default function TimeBlockEfficiency({ blocks, compact }: TimeBlockEfficiencyProps) {
  const { focusSessionsToday, dailyPomodoroGoal } = useFocusTimer();

  const stats = useMemo(() => {
    const totalPlanned = blocks.reduce((acc, b) => acc + (b.endMin - b.startMin), 0);
    const totalFilled = blocks.reduce((acc, b) => acc + b.filledMin, 0);
    const todayPct = totalPlanned > 0 ? Math.round((totalFilled / totalPlanned) * 100) : 0;
    const pomodoroPct =
      dailyPomodoroGoal > 0
        ? Math.round((focusSessionsToday / dailyPomodoroGoal) * 100)
        : 0;

    return [
      { label: 'Foco', value: avgFillByType(blocks, 'focus'), color: TIME_BLOCK_META.focus.color },
      {
        label: 'Estratégico',
        value: avgFillByType(blocks, 'estrategico'),
        color: TIME_BLOCK_META.estrategico.color,
      },
      { label: 'Hoje', value: todayPct, color: 'var(--arrow-accent)' },
      { label: 'Pomodoros', value: Math.min(100, pomodoroPct), color: '#eab308' },
      { label: 'Concluídos', value: completedBlocksPct(blocks), color: '#22c55e' },
    ];
  }, [blocks, focusSessionsToday, dailyPomodoroGoal]);

  if (compact) {
    return (
      <div className="flex justify-around">
        {stats.slice(2).map((s) => (
          <div key={s.label} className="text-center" title={STAT_HINTS[s.label]}>
            <ProgressRing progress={s.value} size={48} strokeWidth={4} color={s.color}>
              <span className="text-[10px] font-bold">{s.value}</span>
            </ProgressRing>
            <p className="text-[9px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--arrow-text-primary)' }}>
        Eficiência
      </h3>
      <p className="text-[10px] mb-3" style={{ color: 'var(--arrow-text-muted)' }}>
        Cada anel mostra o progresso de um tipo de bloco ou meta do dia.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center"
            title={STAT_HINTS[s.label]}
          >
            <ProgressRing progress={s.value} size={64} strokeWidth={5} color={s.color}>
              <span className="text-sm font-black tabular-nums">{s.value}</span>
            </ProgressRing>
            <p className="text-[10px] font-medium mt-2 text-center" style={{ color: s.color }}>
              {s.label}
            </p>
            <p
              className="text-[8px] text-center mt-0.5 leading-tight px-0.5"
              style={{ color: 'var(--arrow-text-muted)' }}
            >
              {s.label === 'Estratégico' && s.value === 0
                ? 'Sem blocos deste tipo hoje'
                : s.label === 'Foco' && s.value === 0
                  ? 'Sem blocos de foco hoje'
                  : s.label === 'Concluídos' && blocks.length === 0
                    ? 'Nenhum bloco hoje'
                    : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
