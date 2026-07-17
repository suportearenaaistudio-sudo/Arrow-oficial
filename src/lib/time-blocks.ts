import type { PlannedTimeBlock, TimelinePeriod } from '@/types/time-blocks';
import {
  DAY_END_MIN,
  DAY_START_MIN,
  NIGHT_END_MIN,
  NIGHT_START_MIN,
  TIMELINE_END_MIN,
  TIMELINE_PERIOD_MIN,
  TIMELINE_START_MIN,
} from '@/types/time-blocks';

const STORAGE_PREFIX = 'arrow-time-blocks';

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function timeStrToMin(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function nowMin(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function blockDurationMin(block: PlannedTimeBlock): number {
  return Math.max(1, block.endMin - block.startMin);
}

export function blockFillPercent(block: PlannedTimeBlock, liveExtraMin = 0): number {
  const total = blockDurationMin(block);
  const filled = Math.min(total, block.filledMin + liveExtraMin);
  return Math.round((filled / total) * 100);
}

function minToPeriodOffset(min: number, period: TimelinePeriod): number {
  if (period === 'day') {
    return min - DAY_START_MIN;
  }
  if (min >= NIGHT_START_MIN) return min - NIGHT_START_MIN;
  return 24 * 60 - NIGHT_START_MIN + min;
}

export function blockOverlapsPeriod(block: PlannedTimeBlock, period: TimelinePeriod): boolean {
  if (period === 'day') {
    return block.startMin < DAY_END_MIN && block.endMin > DAY_START_MIN;
  }
  return block.startMin < NIGHT_END_MIN || block.endMin > NIGHT_START_MIN;
}

export function clipBlockToPeriod(
  block: PlannedTimeBlock,
  period: TimelinePeriod,
): { startOffset: number; endOffset: number } | null {
  if (!blockOverlapsPeriod(block, period)) return null;

  if (period === 'day') {
    const start = Math.max(block.startMin, DAY_START_MIN);
    const end = Math.min(block.endMin, DAY_END_MIN);
    if (end <= start) return null;
    return { startOffset: start - DAY_START_MIN, endOffset: end - DAY_START_MIN };
  }

  const eveningStart = Math.max(block.startMin, NIGHT_START_MIN);
  const eveningEnd = Math.min(block.endMin, 24 * 60);
  if (eveningEnd > eveningStart) {
    return {
      startOffset: minToPeriodOffset(eveningStart, 'night'),
      endOffset: minToPeriodOffset(eveningEnd, 'night'),
    };
  }

  const morningStart = Math.max(block.startMin, 0);
  const morningEnd = Math.min(block.endMin, NIGHT_END_MIN);
  if (morningEnd > morningStart) {
    return {
      startOffset: minToPeriodOffset(morningStart, 'night'),
      endOffset: minToPeriodOffset(morningEnd, 'night'),
    };
  }

  return null;
}

export function blockLeftPercent(block: PlannedTimeBlock, period: TimelinePeriod = 'day'): number {
  const clipped = clipBlockToPeriod(block, period);
  if (!clipped) return 0;
  return (clipped.startOffset / TIMELINE_PERIOD_MIN) * 100;
}

export function blockWidthPercent(block: PlannedTimeBlock, period: TimelinePeriod = 'day'): number {
  const clipped = clipBlockToPeriod(block, period);
  if (!clipped) return 0;
  return ((clipped.endOffset - clipped.startOffset) / TIMELINE_PERIOD_MIN) * 100;
}

export function nowLeftPercent(d = new Date(), period: TimelinePeriod = 'day'): number | null {
  const min = nowMin(d);
  if (period === 'day') {
    if (min < DAY_START_MIN || min >= DAY_END_MIN) return null;
    return ((min - DAY_START_MIN) / TIMELINE_PERIOD_MIN) * 100;
  }
  if (min >= NIGHT_START_MIN || min < NIGHT_END_MIN) {
    return (minToPeriodOffset(min, 'night') / TIMELINE_PERIOD_MIN) * 100;
  }
  return null;
}

export function findBlockAtTime(
  blocks: PlannedTimeBlock[],
  min: number,
  taskId?: string | null,
): PlannedTimeBlock | null {
  const byTime = blocks.filter((b) => min >= b.startMin && min < b.endMin);
  if (taskId) {
    const match = byTime.find((b) => b.taskId === taskId);
    if (match) return match;
  }
  return byTime[0] ?? null;
}

export function loadBlocksForDate(date: string): PlannedTimeBlock[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}-${date}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlannedTimeBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBlocksForDate(date: string, blocks: PlannedTimeBlock[]) {
  localStorage.setItem(`${STORAGE_PREFIX}-${date}`, JSON.stringify(blocks));
}

export function createBlock(
  partial: Omit<PlannedTimeBlock, 'id' | 'filledMin'> & { filledMin?: number },
): PlannedTimeBlock {
  return {
    ...partial,
    id: crypto.randomUUID(),
    filledMin: partial.filledMin ?? 0,
  };
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

export function blocksOverlap(
  a: { startMin: number; endMin: number },
  b: { startMin: number; endMin: number },
): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function detectOverlap(
  blocks: PlannedTimeBlock[],
  startMin: number,
  endMin: number,
  excludeId?: string,
): PlannedTimeBlock | null {
  return (
    blocks.find(
      (b) => b.id !== excludeId && blocksOverlap(b, { startMin, endMin }),
    ) ?? null
  );
}

export function blockProgressPercent(block: PlannedTimeBlock, liveExtraMin = 0): number {
  return blockFillPercent(block, liveExtraMin);
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
  let startMin = source.endMin;
  let endMin = startMin + duration;

  if (endMin > TIMELINE_END_MIN) {
    startMin = Math.max(TIMELINE_START_MIN, source.startMin - duration);
    endMin = source.startMin;
  }

  const overlap = detectOverlap(blocks, startMin, endMin);
  if (overlap) return null;

  const copy = createBlock({
    ...source,
    date,
    startMin,
    endMin,
    label: `${source.label} (cópia)`,
    filledMin: 0,
  });

  const next = [...blocks, copy].sort((a, b) => a.startMin - b.startMin);
  saveBlocksForDate(date, next);
  return copy;
}

export function updateBlock(
  date: string,
  blockId: string,
  patch: Partial<Pick<PlannedTimeBlock, 'startMin' | 'endMin' | 'label' | 'type' | 'taskId' | 'taskTitle' | 'filledMin'>>,
): PlannedTimeBlock[] | null {
  const blocks = loadBlocksForDate(date);
  const existing = blocks.find((b) => b.id === blockId);
  if (!existing) return null;

  const nextBlock = { ...existing, ...patch };
  if (nextBlock.endMin <= nextBlock.startMin) return null;

  const overlap = detectOverlap(blocks, nextBlock.startMin, nextBlock.endMin, blockId);
  if (overlap) return null;

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
  const now = nowMin();
  let cursor = Math.max(TIMELINE_START_MIN, now);

  for (const block of sorted) {
    if (cursor + durationMin <= block.startMin) {
      return { startMin: cursor, endMin: cursor + durationMin };
    }
    cursor = Math.max(cursor, block.endMin);
  }

  if (cursor + durationMin <= TIMELINE_END_MIN) {
    return { startMin: cursor, endMin: cursor + durationMin };
  }
  return null;
}
