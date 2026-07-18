import { useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PlannedTimeBlock } from '@/types/time-blocks';
import { FULL_DAY_WINDOW, TIMELINE_SPAN_MIN } from '@/types/time-blocks';
import {
  blockBarColors,
  blockFillPercent,
  blockLeftPercent,
  blockWidthPercent,
  clampViewStart,
  minuteMarkLeft,
  minToTimeStr,
  nowLeftPercent,
  resolveBlockColor,
  visibleTimeMarks,
} from '@/lib/time-blocks';

interface TimeBlockGanttProps {
  blocks: PlannedTimeBlock[];
  selectedId: string | null;
  activeBlockId?: string | null;
  liveFillMin?: number;
  onSelect: (id: string) => void;
  visibleSpanMin: number;
  viewStartMin: number;
  onViewStartChange?: (start: number) => void;
  canPan?: boolean;
  compact?: boolean;
}

const ROW_H = 44;
const ROW_GAP = 10;
const PILL_H = 38;
const SIDEBAR_W = 40;

function blockInitial(block: PlannedTimeBlock): string {
  const ch = block.label?.trim().charAt(0);
  return ch ? ch.toUpperCase() : 'B';
}

function RowIcon({
  letter,
  fillColor,
  compact,
}: {
  letter: string;
  fillColor: string;
  compact?: boolean;
}) {
  const size = compact ? 22 : 28;
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: compact ? 9 : 11,
        background: `${fillColor}22`,
        color: fillColor,
        border: `1.5px solid ${fillColor}`,
      }}
    >
      {letter}
    </span>
  );
}

function TimeBlockRow({
  block,
  selectedId,
  activeBlockId,
  liveFillMin,
  viewStartMin,
  visibleSpanMin,
  onSelect,
  compact,
}: {
  block: PlannedTimeBlock;
  selectedId: string | null;
  activeBlockId?: string | null;
  liveFillMin: number;
  viewStartMin: number;
  visibleSpanMin: number;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const fillColor = resolveBlockColor(block);
  const colors = blockBarColors(fillColor);
  const isSelected = selectedId === block.id || activeBlockId === block.id;
  const extra = activeBlockId === block.id ? liveFillMin : 0;
  const fill = blockFillPercent(block, extra);
  const left = blockLeftPercent(block, viewStartMin, visibleSpanMin);
  const width = blockWidthPercent(block, viewStartMin, visibleSpanMin);
  const initial = blockInitial(block);
  const displayName = block.label?.trim() || 'Bloco';
  const pillH = compact ? 28 : PILL_H;
  const rowH = compact ? 34 : ROW_H;

  return (
    <div className="flex items-center gap-2" style={{ height: rowH }}>
      <div
        className="flex items-center justify-center shrink-0 pointer-events-none"
        style={{ width: compact ? 32 : SIDEBAR_W }}
      >
        <RowIcon letter={initial} fillColor={fillColor} compact={compact} />
      </div>

      <div className="flex-1 relative min-w-0" style={{ height: rowH }}>
      <button
        type="button"
        data-block="true"
        onClick={() => onSelect(block.id)}
        className="absolute z-10 transition-shadow hover:brightness-[1.02]"
        style={{
          left: `${left}%`,
          width: `${Math.max(width, 1.5)}%`,
          minWidth: 44,
          top: (rowH - pillH) / 2,
          height: pillH,
          borderRadius: 9999,
          background: colors.track,
          boxShadow: isSelected
            ? `0 0 0 2px #fff, 0 0 0 4px ${fillColor}, 0 4px 14px ${fillColor}44`
            : '0 1px 3px rgba(15,23,42,0.08)',
        }}
        title={`${displayName} · ${minToTimeStr(block.startMin)} – ${minToTimeStr(block.endMin)} · ${fill}%`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden flex items-center"
          initial={false}
          animate={{ width: `${Math.max(fill, fill > 0 ? 8 : 0)}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ background: colors.fill, minWidth: fill > 0 ? 36 : 0 }}
        >
          {fill > 0 && (
            <div className="flex items-center justify-between w-full min-w-0 px-3 gap-2">
              {!compact && fill >= 22 && (
                <span className="text-white text-xs font-semibold truncate drop-shadow-sm">{displayName}</span>
              )}
              {fill >= 18 && (
                <span
                  className={`font-black tabular-nums text-white shrink-0 drop-shadow-sm ml-auto ${
                    compact ? 'text-sm' : 'text-base'
                  }`}
                >
                  {fill}%
                </span>
              )}
            </div>
          )}
        </motion.div>

        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
          {fill === 0 && !compact && (
            <span className="text-xs font-semibold truncate" style={{ color: fillColor }}>
              {displayName}
            </span>
          )}
          {fill > 0 && fill < 22 && !compact && (
            <span className="text-xs font-semibold truncate" style={{ color: fillColor }}>
              {displayName}
            </span>
          )}
        </div>
      </button>
      </div>
    </div>
  );
}

export default function TimeBlockGantt({
  blocks,
  selectedId,
  activeBlockId,
  liveFillMin = 0,
  onSelect,
  visibleSpanMin,
  viewStartMin,
  onViewStartChange,
  canPan = true,
  compact = false,
}: TimeBlockGanttProps) {
  const panRef = useRef({ active: false, startX: 0, startView: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const rowH = compact ? 34 : ROW_H;
  const bodyHeight =
    blocks.length === 0 ? 0 : blocks.length * rowH + Math.max(0, blocks.length - 1) * ROW_GAP;
  const panEnabled = canPan && visibleSpanMin < TIMELINE_SPAN_MIN && !!onViewStartChange;
  const sidebarW = compact ? 32 : SIDEBAR_W;

  const timeMarks = useMemo(
    () => visibleTimeMarks(viewStartMin, visibleSpanMin),
    [viewStartMin, visibleSpanMin],
  );

  const nowPct = useMemo(
    () => nowLeftPercent(viewStartMin, visibleSpanMin),
    [viewStartMin, visibleSpanMin, blocks.length],
  );

  const panByPixels = useCallback(
    (deltaX: number, chartWidth: number) => {
      if (!onViewStartChange || chartWidth <= 0) return;
      const deltaMin = (deltaX / chartWidth) * visibleSpanMin;
      onViewStartChange(clampViewStart(viewStartMin + deltaMin, visibleSpanMin));
    },
    [onViewStartChange, viewStartMin, visibleSpanMin],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!panEnabled || !chartRef.current) return;
      const deltaX = e.deltaX;
      if (Math.abs(deltaX) < 0.5) return;
      e.preventDefault();
      const chartWidth = chartRef.current.clientWidth;
      panByPixels(deltaX * 0.4, chartWidth);
    },
    [panEnabled, panByPixels],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panEnabled) return;
      if ((e.target as HTMLElement).closest('button[data-block]')) return;
      panRef.current = { active: true, startX: e.clientX, startView: viewStartMin };
      chartRef.current?.setPointerCapture(e.pointerId);
      chartRef.current?.style.setProperty('cursor', 'grabbing');
    },
    [panEnabled, viewStartMin],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!panRef.current.active || !chartRef.current || !onViewStartChange) return;
      const chartWidth = chartRef.current.clientWidth;
      const deltaX = e.clientX - panRef.current.startX;
      const deltaMin = (deltaX / chartWidth) * visibleSpanMin;
      onViewStartChange(clampViewStart(panRef.current.startView + deltaMin, visibleSpanMin));
    },
    [onViewStartChange, visibleSpanMin],
  );

  const endPan = useCallback(
    (e: React.PointerEvent) => {
      panRef.current.active = false;
      chartRef.current?.releasePointerCapture(e.pointerId);
      if (chartRef.current) chartRef.current.style.cursor = panEnabled ? 'grab' : '';
    },
    [panEnabled],
  );

  return (
    <div className="space-y-2">
      <p
        className="text-[10px] font-medium tracking-wide px-0.5"
        style={{ color: 'var(--arrow-text-muted)' }}
      >
        {FULL_DAY_WINDOW.label}
        {panEnabled && <span className="ml-2 opacity-60">· scroll ou arraste para navegar</span>}
      </p>

      <div
        ref={chartRef}
        className="rounded-2xl overflow-hidden select-none"
        style={{
          background: 'color-mix(in srgb, var(--arrow-bg-elevated) 82%, #cbd5e1)',
          border: '1px solid color-mix(in srgb, var(--arrow-border) 60%, transparent)',
          cursor: panEnabled ? 'grab' : 'default',
          touchAction: panEnabled ? 'none' : 'auto',
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
      >
        <div
          className="flex border-b shrink-0"
          style={{ borderColor: 'rgba(148,163,184,0.35)' }}
        >
          <div style={{ width: sidebarW }} className="shrink-0" />
          <div className="flex-1 relative h-9 min-w-0">
          {timeMarks.map((min) => {
            const left = minuteMarkLeft(min, viewStartMin, visibleSpanMin);
            if (left < -1 || left > 101) return null;
            const h = Math.floor((((min % (24 * 60)) + 24 * 60) % (24 * 60)) / 60);
            return (
              <span
                key={`head-${min}`}
                className="absolute top-2 text-[11px] font-semibold tabular-nums -translate-x-1/2 pointer-events-none"
                style={{ left: `${left}%`, color: 'var(--arrow-text-muted)' }}
              >
                {String(h).padStart(2, '0')}
              </span>
            );
          })}
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: 'var(--arrow-text-muted)' }}>
            Nenhum bloco planejado
          </p>
        ) : (
          <div className="relative py-3 pr-1 pl-0" style={{ minHeight: bodyHeight + 24 }}>
            <div
              className="absolute top-0 bottom-0 right-1 pointer-events-none"
              style={{ left: sidebarW + 8 }}
            >
              {timeMarks.map((min) => {
                const left = minuteMarkLeft(min, viewStartMin, visibleSpanMin);
                if (left < 0 || left > 100) return null;
                return (
                  <div
                    key={`grid-${min}`}
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: `${left}%`, background: 'rgba(148,163,184,0.35)' }}
                  />
                );
              })}

              {nowPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 z-30"
                  style={{ left: `${nowPct}%`, background: '#ef4444', opacity: 0.85 }}
                />
              )}
            </div>

            <div className="relative z-10 flex flex-col" style={{ gap: ROW_GAP }}>
              {blocks.map((block) => (
                <TimeBlockRow
                  key={block.id}
                  block={block}
                  selectedId={selectedId}
                  activeBlockId={activeBlockId}
                  liveFillMin={liveFillMin}
                  viewStartMin={viewStartMin}
                  visibleSpanMin={visibleSpanMin}
                  onSelect={onSelect}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
