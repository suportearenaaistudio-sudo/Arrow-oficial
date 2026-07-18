import type { PlannedTimeBlock } from '@/types/time-blocks';
import {
  DEFAULT_VISIBLE_HOURS,
  MAX_VISIBLE_HOURS,
  MIN_VISIBLE_HOURS,
  TIME_BLOCK_META,
  TIMELINE_ANCHOR_MIN,
  TIMELINE_END_MIN,
} from '@/types/time-blocks';

const STORAGE_PREFIX = 'arrow-time-blocks';

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function minToTimeStr(min: number): string {
  const normalized = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function timeStrToMin(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  let min = h * 60 + m;
  if (min < TIMELINE_ANCHOR_MIN) min += 24 * 60;
  return min;
}

export function normalizeBlock(raw: PlannedTimeBlock): PlannedTimeBlock {
  const withTasks = (() => {
    if (raw.tasks?.length) return raw;
    if (raw.taskId) {
      return {
        ...raw,
        tasks: [{ id: raw.taskId, title: raw.taskTitle || '' }],
      };
    }
    return { ...raw, tasks: [] };
  })();

  return {
    ...withTasks,
    color: withTasks.color ?? TIME_BLOCK_META[withTasks.type]?.color ?? BLOCK_COLOR_PRESETS[0].color,
  };
}

export function blockTaskIds(block: PlannedTimeBlock): string[] {
  return normalizeBlock(block).tasks.map((t) => t.id);
}

export function blockTaskLabels(block: PlannedTimeBlock): string {
  const b = normalizeBlock(block);
  if (b.tasks.length === 0) return b.label;
  return b.tasks.map((t) => t.title).filter(Boolean).join(', ') || b.label;
}

export function nowMin(d = new Date()): number {
  const h = d.getHours();
  const m = d.getMinutes();
  let min = h * 60 + m;
  if (min < TIMELINE_ANCHOR_MIN) min += 24 * 60;
  return min;
}

export function blockDurationMin(block: PlannedTimeBlock): number {
  const end = block.endMin <= block.startMin ? block.endMin + 24 * 60 : block.endMin;
  return Math.max(1, end - block.startMin);
}

export function blockFillPercent(block: PlannedTimeBlock, liveExtraMin = 0): number {
  const total = blockDurationMin(block);
  const filled = Math.min(total, block.filledMin + liveExtraMin);
  return Math.round((filled / total) * 100);
}

export function clampViewStart(viewStartMin: number, visibleSpanMin: number): number {
  const maxStart = TIMELINE_END_MIN - visibleSpanMin;
  return Math.max(TIMELINE_ANCHOR_MIN, Math.min(viewStartMin, maxStart));
}

export function clampVisibleHours(hours: number): number {
  return Math.min(MAX_VISIBLE_HOURS, Math.max(MIN_VISIBLE_HOURS, hours));
}

export function defaultViewStart(
  visibleSpanMin = DEFAULT_VISIBLE_HOURS * 60,
  atMin = nowMin(),
): number {
  let start = atMin - visibleSpanMin / 2;
  return clampViewStart(start, visibleSpanMin);
}

/** Cores da barra estilo pill: faixa clara + preenchimento sólido */
export function blockBarColors(fillColor: string) {
  return { fill: fillColor, track: hexToTrackBg(fillColor) };
}

export function resolveBlockColor(block: PlannedTimeBlock): string {
  return normalizeBlock(block).color;
}

function hexToTrackBg(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 'rgba(148,163,184,0.22)';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.24)`;
}

/** Marcas de tempo visíveis na janela atual */
export function visibleTimeMarks(viewStartMin: number, visibleSpanMin: number): number[] {
  const stepMin =
    visibleSpanMin <= 8 * 60 ? 60 : visibleSpanMin <= 14 * 60 ? 120 : 180;
  const marks: number[] = [];
  let m = Math.ceil(viewStartMin / stepMin) * stepMin;
  const end = viewStartMin + visibleSpanMin;
  while (m <= end) {
    marks.push(m);
    m += stepMin;
  }
  return marks;
}

export function minuteMarkLeft(
  min: number,
  viewStartMin: number,
  visibleSpanMin: number,
): number {
  return ((min - viewStartMin) / visibleSpanMin) * 100;
}

export function blockLeftPercent(
  block: PlannedTimeBlock,
  viewStartMin: number,
  visibleSpanMin: number,
): number {
  const start = Math.max(block.startMin, viewStartMin);
  return ((start - viewStartMin) / visibleSpanMin) * 100;
}

export function blockWidthPercent(
  block: PlannedTimeBlock,
  viewStartMin: number,
  visibleSpanMin: number,
): number {
  const end = block.endMin <= block.startMin ? block.endMin + 24 * 60 : block.endMin;
  const clipStart = Math.max(block.startMin, viewStartMin);
  const clipEnd = Math.min(end, viewStartMin + visibleSpanMin);
  if (clipEnd <= clipStart) return 0;
  return ((clipEnd - clipStart) / visibleSpanMin) * 100;
}

export function nowLeftPercent(
  viewStartMin: number,
  visibleSpanMin: number,
  d = new Date(),
): number | null {
  const min = nowMin(d);
  if (min < viewStartMin || min > viewStartMin + visibleSpanMin) return null;
  return ((min - viewStartMin) / visibleSpanMin) * 100;
}

export function hourMarkLeft(
  hour: number,
  viewStartMin: number,
  visibleSpanMin: number,
): number {
  let min = hour * 60;
  if (min < TIMELINE_ANCHOR_MIN) min += 24 * 60;
  return ((min - viewStartMin) / visibleSpanMin) * 100;
}

export function assignLanes(blocks: PlannedTimeBlock[]): Map<string, number> {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const lanes = new Map<string, number>();
  const laneEnds: number[] = [];

  for (const block of sorted) {
    const end = block.endMin <= block.startMin ? block.endMin + 24 * 60 : block.endMin;
    let lane = laneEnds.findIndex((le) => le <= block.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    lanes.set(block.id, lane);
  }
  return lanes;
}

export function findBlockAtTime(
  blocks: PlannedTimeBlock[],
  min: number,
  taskId?: string | null,
): PlannedTimeBlock | null {
  const byTime = blocks.filter((b) => {
    const end = b.endMin <= b.startMin ? b.endMin + 24 * 60 : b.endMin;
    return min >= b.startMin && min < end;
  });
  if (taskId) {
    const match = byTime.find((b) => blockTaskIds(b).includes(taskId));
    if (match) return match;
  }
  return byTime[0] ?? null;
}

export function loadBlocksForDate(date: string): PlannedTimeBlock[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}-${date}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlannedTimeBlock[];
    return Array.isArray(parsed) ? parsed.map(normalizeBlock) : [];
  } catch {
    return [];
  }
}

export function saveBlocksForDate(date: string, blocks: PlannedTimeBlock[]) {
  localStorage.setItem(`${STORAGE_PREFIX}-${date}`, JSON.stringify(blocks));
}

export function createBlock(
  partial: Omit<PlannedTimeBlock, 'id' | 'filledMin' | 'tasks' | 'color'> & {
    filledMin?: number;
    tasks?: PlannedTimeBlock['tasks'];
    taskId?: string | null;
    taskTitle?: string | null;
    color?: string;
  },
): PlannedTimeBlock {
  const tasks =
    partial.tasks ??
    (partial.taskId
      ? [{ id: partial.taskId, title: partial.taskTitle || '' }]
      : []);
  const { taskId: _t, taskTitle: _tt, ...rest } = partial;
  const type = partial.type ?? 'focus';
  return normalizeBlock({
    ...rest,
    tasks,
    type,
    color: partial.color ?? TIME_BLOCK_META[type].color,
    id: crypto.randomUUID(),
    filledMin: partial.filledMin ?? 0,
  });
}

export function addFillToBlock(date: string, blockId: string, minutes: number): PlannedTimeBlock[] {
  const blocks = loadBlocksForDate(date);
  const next = blocks.map((b) => {
    if (b.id !== blockId) return b;
    const cap = blockDurationMin(b);
    return { ...b, filledMin: Math.min(cap, b.filledMin + minutes) };
  });
  saveBlocksForDate(date, next);
  return next;
}

export function resolveBlockForSession(
  date: string,
  taskId: string | null,
  activeBlockId: string | null,
  atMin = nowMin(),
): PlannedTimeBlock | null {
  const blocks = loadBlocksForDate(date);
  if (activeBlockId) {
    const picked = blocks.find((b) => b.id === activeBlockId);
    if (picked) return picked;
  }
  return findBlockAtTime(blocks, atMin, taskId);
}

export function markBlockComplete(date: string, blockId: string): PlannedTimeBlock[] {
  const blocks = loadBlocksForDate(date);
  const next = blocks.map((b) => {
    if (b.id !== blockId) return b;
    return { ...b, filledMin: blockDurationMin(b) };
  });
  saveBlocksForDate(date, next);
  return next;
}

export function duplicateBlock(date: string, blockId: string): PlannedTimeBlock | null {
  const blocks = loadBlocksForDate(date);
  const source = blocks.find((b) => b.id === blockId);
  if (!source) return null;

  const duration = blockDurationMin(source);
  let startMin = source.endMin <= source.startMin ? source.endMin + 24 * 60 : source.endMin;
  let endMin = startMin + duration;

  if (endMin > TIMELINE_END_MIN) {
    startMin = Math.max(TIMELINE_ANCHOR_MIN, source.startMin - duration);
    endMin = source.startMin;
  }

  const copy = createBlock({
    ...source,
    date,
    startMin,
    endMin,
    label: `${source.label} (cópia)`,
    filledMin: 0,
    tasks: [...normalizeBlock(source).tasks],
  });

  const next = [...blocks, copy].sort((a, b) => a.startMin - b.startMin);
  saveBlocksForDate(date, next);
  return copy;
}

export function updateBlock(
  date: string,
  blockId: string,
  patch: Partial<
    Pick<PlannedTimeBlock, 'startMin' | 'endMin' | 'label' | 'type' | 'tasks' | 'filledMin' | 'color'>
  >,
): PlannedTimeBlock[] | null {
  const blocks = loadBlocksForDate(date);
  const existing = blocks.find((b) => b.id === blockId);
  if (!existing) return null;

  const nextBlock = normalizeBlock({ ...existing, ...patch });
  const end = nextBlock.endMin <= nextBlock.startMin ? nextBlock.endMin + 24 * 60 : nextBlock.endMin;
  if (end <= nextBlock.startMin) return null;

  const next = blocks
    .map((b) => (b.id === blockId ? nextBlock : b))
    .sort((a, b) => a.startMin - b.startMin);
  saveBlocksForDate(date, next);
  return next;
}

export function suggestNextFreeSlot(
  blocks: PlannedTimeBlock[],
  durationMin = 50,
): { startMin: number; endMin: number } | null {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const cursor0 = Math.max(TIMELINE_ANCHOR_MIN, nowMin());
  let cursor = cursor0;

  for (const block of sorted) {
    const blockEnd = block.endMin <= block.startMin ? block.endMin + 24 * 60 : block.endMin;
    if (cursor + durationMin <= block.startMin) {
      return { startMin: cursor, endMin: cursor + durationMin };
    }
    cursor = Math.max(cursor, blockEnd);
  }

  if (cursor + durationMin <= TIMELINE_END_MIN) {
    return { startMin: cursor, endMin: cursor + durationMin };
  }
  return null;
}

export function detectOverlap(): null {
  return null;
}

export function blockOverlapsPeriod(block: PlannedTimeBlock): boolean {
  return block.startMin < TIMELINE_END_MIN;
}
