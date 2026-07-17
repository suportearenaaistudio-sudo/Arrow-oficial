import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlannedTimeBlock, TimelinePeriod } from '@/types/time-blocks';
import { TIME_BLOCK_META, TIMELINE_WINDOWS } from '@/types/time-blocks';
import {
  blockFillPercent,
  blockLeftPercent,
  blockOverlapsPeriod,
  blockWidthPercent,
  minToTimeStr,
  nowLeftPercent,
} from '@/lib/time-blocks';

interface TimeBlockGanttProps {
  blocks: PlannedTimeBlock[];
  selectedId: string | null;
  activeBlockId?: string | null;
  liveFillMin?: number;
  onSelect: (id: string) => void;
  period: TimelinePeriod;
  compact?: boolean;
}

const PCT_COL_W = 44;
const PERIOD_SPAN = 12 * 60;

function blockInitial(block: PlannedTimeBlock): string {
  if (block.label?.trim()) return block.label.trim().charAt(0).toUpperCase();
  if (block.taskTitle?.trim()) return block.taskTitle.trim().charAt(0).toUpperCase();
  return 'B';
}

function hourMarkLeft(h: number, period: TimelinePeriod, startMin: number): number {
  const min = h * 60;
  if (period === 'day') {
    return ((min - startMin) / PERIOD_SPAN) * 100;
  }
  if (h >= 18) return ((min - 18 * 60) / PERIOD_SPAN) * 100;
  return ((min + 24 * 60 - 18 * 60) / PERIOD_SPAN) * 100;
}

export default function TimeBlockGantt({
  blocks,
  selectedId,
  activeBlockId,
  liveFillMin = 0,
  onSelect,
  period,
  compact = false,
}: TimeBlockGanttProps) {
  const window = TIMELINE_WINDOWS[period];
  const visibleBlocks = useMemo(
    () => blocks.filter((b) => blockOverlapsPeriod(b, period)),
    [blocks, period],
  );
  const nowPct = useMemo(() => nowLeftPercent(undefined, period), [blocks.length, period]);
  const rowH = compact ? 38 : 52;
  const SIDEBAR_W = compact ? 80 : 132;

  return (
    <div className="space-y-1.5">
      <p
        className="text-[10px] font-semibold tracking-wide px-0.5"
        style={{ color: 'var(--arrow-text-muted)' }}
      >
        {window.label}
      </p>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
      >
        <motion.div className="flex border-b" style={{ borderColor: 'var(--arrow-border)' }} layout>
          <div style={{ width: SIDEBAR_W }} className="flex-shrink-0 px-2 py-1.5">
            <span className="text-[9px] font-medium" style={{ color: 'var(--arrow-text-muted)' }}>
              Bloco
            </span>
          </div>
          <div className="flex-1 relative h-6" style={{ marginRight: PCT_COL_W }}>
            {window.hourMarks.filter((_, i) => (compact ? i % 2 === 0 : true)).map((h) => (
              <span
                key={`${period}-${h}`}
                className="absolute text-[8px] tabular-nums -translate-x-1/2 top-1"
                style={{
                  left: `${hourMarkLeft(h, period, window.startMin)}%`,
                  color: 'var(--arrow-text-muted)',
                }}
              >
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>
          <div style={{ width: PCT_COL_W }} className="flex-shrink-0" />
        </motion.div>

        {visibleBlocks.length === 0 ? (
          <p className="text-[11px] text-center py-5" style={{ color: 'var(--arrow-text-muted)' }}>
            Nenhum bloco neste período
          </p>
        ) : (
          visibleBlocks.map((block) => {
            const meta = TIME_BLOCK_META[block.type];
            const isSelected = selectedId === block.id || activeBlockId === block.id;
            const extra = activeBlockId === block.id ? liveFillMin : 0;
            const fill = blockFillPercent(block, extra);
            const left = blockLeftPercent(block, period);
            const width = blockWidthPercent(block, period);

            return (
              <motion.div
                key={`${period}-${block.id}`}
                className="flex items-center border-b last:border-b-0 relative"
                style={{ borderColor: 'var(--arrow-border)', minHeight: rowH }}
                layout
              >
                <motion.div
                  className="flex items-center gap-2 px-2 flex-shrink-0 min-w-0"
                  style={{ width: SIDEBAR_W }}
                  layout
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {blockInitial(block)}
                  </span>
                  {!compact && (
                    <span
                      className="text-[10px] font-medium truncate"
                      style={{ color: 'var(--arrow-text-primary)' }}
                    >
                      {block.label}
                    </span>
                  )}
                </motion.div>

                <div
                  className="flex-1 relative py-1.5 pr-1"
                  style={{ height: rowH - 10, marginRight: PCT_COL_W }}
                >
                  {window.hourMarks.map((h) => (
                    <div
                      key={`${period}-grid-${h}`}
                      className="absolute top-0 bottom-0 border-l border-dashed opacity-10 pointer-events-none"
                      style={{
                        left: `${hourMarkLeft(h, period, window.startMin)}%`,
                        borderColor: 'var(--arrow-text-muted)',
                      }}
                    />
                  ))}

                  {nowPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 rounded-full z-20 pointer-events-none"
                      style={{ left: `${nowPct}%`, background: '#ef4444' }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelect(block.id)}
                    className="absolute top-0 bottom-0 rounded-full overflow-hidden transition-all hover:brightness-110"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 3)}%`,
                      background: meta.bg,
                      border: `2px solid ${isSelected ? meta.color : 'transparent'}`,
                      boxShadow: isSelected ? `0 0 10px ${meta.color}44` : 'none',
                    }}
                    title={`${block.label} · ${fill}%`}
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      initial={false}
                      animate={{ width: `${fill}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{ background: meta.color, opacity: 0.9 }}
                    />
                    {!compact && (
                      <span
                        className="relative z-10 block px-2 text-[9px] font-medium truncate leading-[34px]"
                        style={{ color: fill > 40 ? '#fff' : meta.color }}
                      >
                        {block.taskTitle || block.label}
                      </span>
                    )}
                  </button>
                </div>

                <div
                  className="flex-shrink-0 flex items-center justify-end pr-2"
                  style={{ width: PCT_COL_W }}
                >
                  <span
                    className={`font-black tabular-nums leading-none ${compact ? 'text-xs' : 'text-sm'}`}
                    style={{
                      color: meta.color,
                      background: 'var(--arrow-bg-elevated)',
                      padding: '2px 5px',
                      borderRadius: 4,
                    }}
                  >
                    {fill}%
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {!compact && (
        <div
          className="flex justify-between px-1"
          style={{ marginLeft: SIDEBAR_W, marginRight: PCT_COL_W }}
        >
          {window.hourMarks.map((h) => (
            <span
              key={`${period}-foot-${h}`}
              className="text-[9px] tabular-nums"
              style={{ color: 'var(--arrow-text-muted)' }}
            >
              {minToTimeStr(h * 60)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
