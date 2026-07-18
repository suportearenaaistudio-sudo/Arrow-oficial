export type TimeBlockType = 'focus' | 'estrategico' | 'buffer' | 'escape';

export interface TimeBlockTaskRef {
  id: string;
  title: string;
}

export interface PlannedTimeBlock {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  tasks: TimeBlockTaskRef[];
  label: string;
  type: TimeBlockType;
  /** Cor visual da barra na timeline */
  color: string;
  filledMin: number;
  /** @deprecated migrado para tasks[] */
  taskId?: string | null;
  /** @deprecated migrado para tasks[] */
  taskTitle?: string | null;
}

export const TIME_BLOCK_META: Record<
  TimeBlockType,
  { label: string; color: string; bg: string; description: string }
> = {
  focus: {
    label: 'Foco',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.22)',
    description: 'Trabalho profundo e execução de tarefas.',
  },
  estrategico: {
    label: 'Estratégico',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.22)',
    description: 'Planejamento, revisão de metas, priorização e reflexão.',
  },
  buffer: {
    label: 'Buffer',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.25)',
    description: 'Tempo reservado para imprevistos e transições.',
  },
  escape: {
    label: 'Escape',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.22)',
    description: 'Pausas, descanso e atividades de recuperação.',
  },
};

/** Paleta para escolha na criação do bloco */
export const BLOCK_COLOR_PRESETS = [
  { color: '#3b82f6', label: 'Azul' },
  { color: '#6366f1', label: 'Índigo' },
  { color: '#8b5cf6', label: 'Roxo' },
  { color: '#a855f7', label: 'Violeta' },
  { color: '#ec4899', label: 'Rosa' },
  { color: '#f59e0b', label: 'Dourado' },
  { color: '#eab308', label: 'Amarelo' },
  { color: '#22c55e', label: 'Verde' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#ef4444', label: 'Vermelho' },
] as const;

/** Âncora do dia: 06:00 */
export const TIMELINE_ANCHOR_MIN = 6 * 60;
/** Janela contínua 06:00 → 06:00 (24h) */
export const TIMELINE_SPAN_MIN = 24 * 60;
export const TIMELINE_END_MIN = TIMELINE_ANCHOR_MIN + TIMELINE_SPAN_MIN;

/** Compat legado */
export const TIMELINE_START_MIN = TIMELINE_ANCHOR_MIN;
export const DAY_START_MIN = TIMELINE_ANCHOR_MIN;
export const DAY_END_MIN = 18 * 60;
export const NIGHT_START_MIN = 18 * 60;
export const NIGHT_END_MIN = 6 * 60;
export const TIMELINE_PERIOD_MIN = 12 * 60;

export type TimelineScale = '6h' | '12h' | '24h';

/** Janela visível na timeline (horas) — slider contínuo 6–24 */
export const MIN_VISIBLE_HOURS = 6;
export const MAX_VISIBLE_HOURS = 24;
export const DEFAULT_VISIBLE_HOURS = 6;

/** @deprecated use MIN/MAX_VISIBLE_HOURS */
export const SCALE_VISIBLE_MIN: Record<TimelineScale, number> = {
  '6h': 6 * 60,
  '12h': 12 * 60,
  '24h': 24 * 60,
};

export const FULL_DAY_WINDOW = {
  label: '06:00 → 06:00',
  startMin: TIMELINE_ANCHOR_MIN,
  endMin: TIMELINE_END_MIN,
  hourMarks: [6, 9, 12, 15, 18, 21, 0, 3] as const,
  endHourMark: 6,
};

/** @deprecated use FULL_DAY_WINDOW */
export type TimelinePeriod = 'day' | 'night';
export const TIMELINE_WINDOWS = {
  fullDay: FULL_DAY_WINDOW,
  day: FULL_DAY_WINDOW,
  night: FULL_DAY_WINDOW,
};
