import { useNavigate } from 'react-router-dom';
import { Pause, Play, Target, Timer } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusTimer } from '@/contexts/FocusTimerContext';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function FocusTimerPill() {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const {
    isSessionOpen,
    status,
    taskTitle,
    remainingSecs,
    running,
    currentSessionNumber,
    plannedSessions,
    togglePause,
  } = useFocusTimer();

  if (!isSessionOpen) return null;

  const label = taskTitle
    ? taskTitle.length > 18
      ? `${taskTitle.slice(0, 18)}…`
      : taskTitle
    : 'Foco';

  const timeLabel = status === 'completed' ? '00:00' : fmtTime(remainingSecs);

  return (
    <button
      type="button"
      onClick={() => navigate('/pomodoro')}
      className="flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-full text-[11px] font-medium transition-colors duration-150 flex-shrink-0 max-w-[220px]"
      style={{
        background: theme.accentLight,
        border: `1px solid ${theme.accent}50`,
        color: theme.textPrimary,
      }}
      title="Ir para Pomodoro"
    >
      <Timer className="w-3.5 h-3.5 flex-shrink-0" style={{ color: theme.accent }} />
      {taskTitle && <Target className="w-3 h-3 flex-shrink-0 hidden sm:block" style={{ color: theme.accent }} />}
      <span className="truncate hidden sm:inline" style={{ color: theme.textSecondary }}>
        {label}
      </span>
      <span className="tabular-nums font-semibold" style={{ color: theme.accent }}>
        {timeLabel}
      </span>
      <span className="text-[9px] hidden md:inline" style={{ color: theme.textMuted }}>
        {status === 'completed' ? '✓' : `${currentSessionNumber}/${plannedSessions}`}
      </span>
      {status === 'active' && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            togglePause();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              togglePause();
            }
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
          title={running ? 'Pausar' : 'Continuar'}
        >
          {running ? (
            <Pause className="w-3 h-3" style={{ color: theme.accent }} />
          ) : (
            <Play className="w-3 h-3" style={{ color: theme.accent }} />
          )}
        </span>
      )}
    </button>
  );
}
