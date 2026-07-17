export type TimeBlockType = 'focus' | 'estrategico' | 'buffer' | 'escape';

export interface PlannedTimeBlock {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  taskId: string | null;
  taskTitle: string | null;
  label: string;
  type: TimeBlockType;
  /** Minutos de foco já executados neste bloco (via pomodoro). */
  filledMin: number;
}

export const TIME_BLOCK_META: Record<
  TimeBlockType,
  { label: string; color: string; bg: string; description: string }
> = {
  focus: {
    label: 'Foco',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
    description: 'Trabalho profundo e execução de tarefas.',
  },
  estrategico: {
    label: 'Estratégico',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
    description: 'Planejamento, revisão de metas, priorização e reflexão.',
  },
  buffer: {
    label: 'Buffer',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.15)',
    description: 'Tempo reservado para imprevistos e transições.',
  },
  escape: {
    label: 'Escape',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    description: 'Pausas, descanso e atividades de recuperação.',
  },
};

/** Período diurno: 06:00–18:00 (12 h) */
export const DAY_START_MIN = 6 * 60;
export const DAY_END_MIN = 18 * 60;

/** Período noturno: 18:00–06:00 (12 h, cruza meia-noite) */
export const NIGHT_START_MIN = 18 * 60;
export const NIGHT_END_MIN = 6 * 60;

export const TIMELINE_PERIOD_MIN = 12 * 60;

/** Compat: sugestão de slots e limites padrão usam o período diurno */
export const TIMELINE_START_MIN = DAY_START_MIN;
export const TIMELINE_END_MIN = DAY_END_MIN;
export const TIMELINE_SPAN_MIN = TIMELINE_PERIOD_MIN;

export type TimelinePeriod = 'day' | 'night';

export const TIMELINE_WINDOWS: Record<
  TimelinePeriod,
  { label: string; startMin: number; endMin: number; hourMarks: number[] }
> = {
  day: {
    label: '06:00 – 18:00',
    startMin: DAY_START_MIN,
    endMin: DAY_END_MIN,
    hourMarks: [6, 8, 10, 12, 14, 16, 18],
  },
  night: {
    label: '18:00 – 06:00',
    startMin: NIGHT_START_MIN,
    endMin: NIGHT_END_MIN,
    hourMarks: [18, 20, 22, 0, 2, 4, 6],
  },
};
