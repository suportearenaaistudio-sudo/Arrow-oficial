import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, Maximize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import PomodoroMiniBar from '@/components/pomodoro/PomodoroMiniBar';
import TimeBlockGantt from '@/components/time-blocks/TimeBlockGantt';

export default function FocusDashboardCard() {
  const { theme } = useTheme();
  const {
    isSessionOpen,
    status,
    activeBlockId,
    remainingSecs,
    totalSecs,
    focusSessionsToday,
    dailyPomodoroGoal,
    setActiveBlockId,
    setTask,
  } = useFocusTimer();

  const {
    blocks,
    selectedId,
    dayProgress,
    totalPlannedMin,
    totalFilledMin,
    visibleSpanMin,
    viewStartMin,
    canPan,
    setViewStartMin,
    setSelectedId,
  } = useTimeBlocks();

  const liveFillMin =
    isSessionOpen && status === 'active' && totalSecs > 0
      ? (totalSecs - remainingSecs) / 60
      : 0;

  const effectiveSelected = selectedId ?? activeBlockId;

  function handleSelect(id: string) {
    setSelectedId(id);
    setActiveBlockId(id);
    const block = blocks.find((b) => b.id === id);
    const firstTask = block?.tasks?.[0];
    if (firstTask) setTask(firstTask.id, firstTask.title);
  }

  const plannedLabel =
    totalPlannedMin >= 60
      ? `${Math.floor(totalPlannedMin / 60)}h${totalPlannedMin % 60 ? `${totalPlannedMin % 60}m` : ''}`
      : `${totalPlannedMin}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="arrow-card focus-dashboard-widget p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--arrow-text-primary)' }}>
          <CalendarClock className="w-4 h-4" style={{ color: theme.accent }} />
          Foco do dia
        </h3>
        <Link
          to="/pomodoro"
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg hover:opacity-80"
          style={{ color: theme.accent, background: 'var(--arrow-accent-light)' }}
        >
          <Maximize2 className="w-3 h-3" />
          Expandir
        </Link>
      </div>

      <PomodoroMiniBar />

      <p className="text-[10px] tabular-nums" style={{ color: 'var(--arrow-text-muted)' }}>
        {focusSessionsToday}/{dailyPomodoroGoal} pomodoros · {dayProgress}% do dia · {totalFilledMin} min de {plannedLabel}
      </p>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--arrow-text-secondary)' }}>
            Time Blocks
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: theme.accent }}>
            {dayProgress}%
          </span>
        </div>
        <TimeBlockGantt
          blocks={blocks}
          selectedId={effectiveSelected}
          activeBlockId={activeBlockId}
          liveFillMin={liveFillMin}
          onSelect={handleSelect}
          visibleSpanMin={visibleSpanMin}
          viewStartMin={viewStartMin}
          onViewStartChange={canPan ? setViewStartMin : undefined}
          canPan={canPan}
          compact
        />
      </div>

      <Link
        to="/pomodoro"
        className="block text-center text-[10px] font-medium py-1 hover:opacity-70 transition-opacity"
        style={{ color: theme.accent }}
      >
        Planejar blocos →
      </Link>
    </motion.div>
  );
}
