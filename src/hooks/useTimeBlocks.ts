import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlannedTimeBlock, TimeBlockType } from '@/types/time-blocks';
import { DEFAULT_VISIBLE_HOURS } from '@/types/time-blocks';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import {
  blockFillPercent, clampViewStart, clampVisibleHours, createBlock, defaultViewStart,
  findBlockAtTime, loadBlocksForDate, nowMin, todayKey,
} from '@/lib/time-blocks';

const SCALE_STORAGE_KEY = 'arrow-timeblocks-scale';
const MIGRATION_PREFIX = 'arrow-time-blocks-vault-migrated';

function loadVisibleSpanHours(): number {
  try {
    const n = Number(localStorage.getItem(SCALE_STORAGE_KEY));
    if (!Number.isNaN(n) && n > 0) return clampVisibleHours(n);
  } catch { /* preferences are optional */ }
  return DEFAULT_VISIBLE_HOURS;
}

export function useTimeBlocks(date?: string) {
  const { profile } = useVault();
  const day = date ?? todayKey();
  const [blocks, setBlocks] = useState<PlannedTimeBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [visibleSpanHours, setVisibleSpanHoursState] = useState(loadVisibleSpanHours);
  const visibleSpanMin = visibleSpanHours * 60;
  const [viewStartMin, setViewStartMin] = useState(() => defaultViewStart(loadVisibleSpanHours() * 60));

  const reload = useCallback(async () => {
    if (!profile) return;
    const remote = await desktopAPI.db.timeBlocks.list(day) as PlannedTimeBlock[];
    const migrationKey = `${MIGRATION_PREFIX}-${profile.id}-${day}`;
    const legacy = loadBlocksForDate(day);
    if (remote.length === 0 && legacy.length > 0 && !localStorage.getItem(migrationKey)) {
      await Promise.all(legacy.map((block) => desktopAPI.db.timeBlocks.create(block)));
      localStorage.setItem(migrationKey, '1');
      localStorage.removeItem(`arrow-time-blocks-${day}`);
      const migrated = await desktopAPI.db.timeBlocks.list(day) as PlannedTimeBlock[];
      setBlocks(migrated);
      return;
    }
    setBlocks(remote);
  }, [day, profile]);

  useEffect(() => { void reload().catch(() => setBlocks([])); }, [reload]);
  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || detail.date === day) void reload();
    };
    window.addEventListener('arrow-time-blocks-updated', onUpdate);
    return () => window.removeEventListener('arrow-time-blocks-updated', onUpdate);
  }, [day, reload]);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const notify = useCallback(() => window.dispatchEvent(
    new CustomEvent('arrow-time-blocks-updated', { detail: { date: day } }),
  ), [day]);

  const setVisibleSpanHours = useCallback((hours: number) => {
    const h = clampVisibleHours(hours);
    setVisibleSpanHoursState(h); localStorage.setItem(SCALE_STORAGE_KEY, String(h));
    setViewStartMin((previous) => clampViewStart(previous, h * 60));
  }, []);
  const setViewStart = useCallback((start: number) => setViewStartMin(clampViewStart(start, visibleSpanMin)), [visibleSpanMin]);

  const addBlock = useCallback((input: {
    startMin: number; endMin: number; tasks?: PlannedTimeBlock['tasks']; taskId?: string | null;
    taskTitle?: string | null; label?: string; type?: TimeBlockType; color?: string;
  }) => {
    const block = createBlock({ date: day, startMin: input.startMin, endMin: input.endMin, tasks: input.tasks,
      taskId: input.taskId, taskTitle: input.taskTitle, label: input.label?.trim() || input.taskTitle || 'Bloco de foco',
      type: input.type ?? 'focus', color: input.color });
    setBlocks((current) => [...current, block].sort((a, b) => a.startMin - b.startMin)); setSelectedId(block.id);
    void desktopAPI.db.timeBlocks.create(block).then(notify).catch(() => void reload());
    return block;
  }, [day, notify, reload]);

  const updateBlock = useCallback((id: string, patch: Partial<Pick<PlannedTimeBlock, 'startMin' | 'endMin' | 'label' | 'type' | 'tasks' | 'filledMin' | 'color'>>) => {
    const current = blocks.find((block) => block.id === id);
    if (!current) return false;
    const next = { ...current, ...patch };
    setBlocks((all) => all.map((block) => block.id === id ? next : block).sort((a, b) => a.startMin - b.startMin));
    void desktopAPI.db.timeBlocks.update({ id, ...patch }).then(notify).catch(() => void reload());
    return true;
  }, [blocks, notify, reload]);
  const removeBlock = useCallback((id: string) => {
    setBlocks((all) => all.filter((block) => block.id !== id)); if (selectedId === id) setSelectedId(null);
    void desktopAPI.db.timeBlocks.delete(id).then(notify).catch(() => void reload());
  }, [notify, reload, selectedId]);
  const duplicateBlock = useCallback((id: string) => {
    const source = blocks.find((block) => block.id === id); if (!source) return null;
    const duration = source.endMin - source.startMin;
    return addBlock({ ...source, startMin: source.endMin, endMin: source.endMin + duration, label: `${source.label} (cópia)`, tasks: source.tasks });
  }, [addBlock, blocks]);
  const markComplete = useCallback((id: string) => {
    const block = blocks.find((item) => item.id === id); if (!block) return;
    updateBlock(id, { filledMin: Math.max(1, block.endMin - block.startMin) });
  }, [blocks, updateBlock]);
  const addFill = useCallback((id: string, minutes: number) => {
    const block = blocks.find((item) => item.id === id); if (!block) return;
    updateBlock(id, { filledMin: Math.min(Math.max(1, block.endMin - block.startMin), block.filledMin + minutes) });
  }, [blocks, updateBlock]);

  const currentBlock = useMemo(() => { void tick; return findBlockAtTime(blocks, nowMin()); }, [blocks, tick]);
  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedId) ?? null, [blocks, selectedId]);
  const totalPlannedMin = useMemo(() => blocks.reduce((sum, block) => sum + Math.max(0, block.endMin - block.startMin), 0), [blocks]);
  const totalFilledMin = useMemo(() => blocks.reduce((sum, block) => sum + block.filledMin, 0), [blocks]);

  return { day, blocks, selectedId, selectedBlock, currentBlock,
    dayProgress: totalPlannedMin ? Math.round((totalFilledMin / totalPlannedMin) * 100) : 0,
    totalPlannedMin, totalFilledMin, visibleSpanHours, visibleSpanMin, viewStartMin,
    canPan: visibleSpanHours < 24, setVisibleSpanHours, setViewStartMin: setViewStart, setSelectedId,
    addBlock, removeBlock, updateBlock, duplicateBlock, markComplete, addFill, blockFillPercent, reload };
}
