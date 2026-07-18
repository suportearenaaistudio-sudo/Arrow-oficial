import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlannedTimeBlock, TimeBlockType } from '@/types/time-blocks';
import { DEFAULT_VISIBLE_HOURS } from '@/types/time-blocks';
import {
  addFillToBlock,
  blockFillPercent,
  clampViewStart,
  clampVisibleHours,
  createBlock,
  defaultViewStart,
  duplicateBlock as duplicateBlockLib,
  findBlockAtTime,
  loadBlocksForDate,
  markBlockComplete,
  nowMin,
  saveBlocksForDate,
  todayKey,
  updateBlock as updateBlockLib,
} from '@/lib/time-blocks';

export function useTimeBlocks(date?: string) {
  const day = date ?? todayKey();
  const [blocks, setBlocks] = useState<PlannedTimeBlock[]>(() => loadBlocksForDate(day));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [visibleSpanHours, setVisibleSpanHoursState] = useState(DEFAULT_VISIBLE_HOURS);
  const visibleSpanMin = visibleSpanHours * 60;
  const [viewStartMin, setViewStartMin] = useState(() =>
    defaultViewStart(DEFAULT_VISIBLE_HOURS * 60),
  );

  useEffect(() => {
    setBlocks(loadBlocksForDate(day));
  }, [day]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || detail.date === day) {
        setBlocks(loadBlocksForDate(day));
      }
    };
    window.addEventListener('arrow-time-blocks-updated', onUpdate);
    return () => window.removeEventListener('arrow-time-blocks-updated', onUpdate);
  }, [day]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const setVisibleSpanHours = useCallback((hours: number) => {
    const h = clampVisibleHours(hours);
    setVisibleSpanHoursState(h);
    setViewStartMin((prev) => clampViewStart(prev, h * 60));
  }, []);

  const setViewStart = useCallback(
    (start: number) => {
      setViewStartMin(clampViewStart(start, visibleSpanMin));
    },
    [visibleSpanMin],
  );

  const persist = useCallback(
    (next: PlannedTimeBlock[]) => {
      saveBlocksForDate(day, next);
      setBlocks(next);
      window.dispatchEvent(new CustomEvent('arrow-time-blocks-updated', { detail: { date: day } }));
    },
    [day],
  );

  const addBlock = useCallback(
    (input: {
      startMin: number;
      endMin: number;
      tasks?: PlannedTimeBlock['tasks'];
      taskId?: string | null;
      taskTitle?: string | null;
      label?: string;
      type?: TimeBlockType;
      color?: string;
    }) => {
      const block = createBlock({
        date: day,
        startMin: input.startMin,
        endMin: input.endMin,
        tasks: input.tasks,
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        label: input.label?.trim() || input.taskTitle || 'Bloco de foco',
        type: input.type ?? 'focus',
        color: input.color,
      });
      persist([...blocks, block]);
      setSelectedId(block.id);
      return block;
    },
    [blocks, day, persist],
  );

  const removeBlock = useCallback(
    (id: string) => {
      persist(blocks.filter((b) => b.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [blocks, persist, selectedId],
  );

  const updateBlock = useCallback(
    (
      blockId: string,
      patch: Partial<Pick<PlannedTimeBlock, 'startMin' | 'endMin' | 'label' | 'type' | 'tasks' | 'color'>>,
    ) => {
      const next = updateBlockLib(day, blockId, patch);
      if (!next) return false;
      setBlocks(next);
      window.dispatchEvent(new CustomEvent('arrow-time-blocks-updated', { detail: { date: day } }));
      return true;
    },
    [day],
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const copy = duplicateBlockLib(day, blockId);
      if (copy) {
        setBlocks(loadBlocksForDate(day));
        setSelectedId(copy.id);
        window.dispatchEvent(new CustomEvent('arrow-time-blocks-updated', { detail: { date: day } }));
      }
      return copy;
    },
    [day],
  );

  const markComplete = useCallback(
    (blockId: string) => {
      const next = markBlockComplete(day, blockId);
      setBlocks(next);
      window.dispatchEvent(new CustomEvent('arrow-time-blocks-updated', { detail: { date: day } }));
    },
    [day],
  );

  const addFill = useCallback(
    (blockId: string, minutes: number) => {
      const next = addFillToBlock(day, blockId, minutes);
      setBlocks(next);
    },
    [day],
  );

  const currentBlock = useMemo(() => {
    void tick;
    return findBlockAtTime(blocks, nowMin());
  }, [blocks, tick]);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedId) ?? null,
    [blocks, selectedId],
  );

  const totalPlannedMin = useMemo(
    () => blocks.reduce((acc, b) => acc + (b.endMin - b.startMin), 0),
    [blocks],
  );

  const totalFilledMin = useMemo(
    () => blocks.reduce((acc, b) => acc + b.filledMin, 0),
    [blocks],
  );

  const dayProgress = totalPlannedMin > 0 ? Math.round((totalFilledMin / totalPlannedMin) * 100) : 0;

  const canPan = visibleSpanHours < 24;

  return {
    day,
    blocks,
    selectedId,
    selectedBlock,
    currentBlock,
    dayProgress,
    totalPlannedMin,
    totalFilledMin,
    visibleSpanHours,
    visibleSpanMin,
    viewStartMin,
    canPan,
    setVisibleSpanHours,
    setViewStartMin: setViewStart,
    setSelectedId,
    addBlock,
    removeBlock,
    updateBlock,
    duplicateBlock,
    markComplete,
    addFill,
    blockFillPercent,
    reload: () => setBlocks(loadBlocksForDate(day)),
  };
}
