import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import PomodoroTaskPicker from '@/components/pomodoro/PomodoroTaskPicker';

const SESSION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface PomodoroPanelProps {
  variant?: 'compact' | 'full';
}

export default function PomodoroPanel({ variant = 'compact' }: PomodoroPanelProps) {
  const { theme, isDark } = useTheme();
  const isFull = variant === 'full';

  const {
    status,
    durationMin,
    plannedSessions,
    completedSessions,
    remainingSecs,
    totalSecs,
    running,
    currentSessionNumber,
    isSessionOpen,
    soundEnabled,
    setDuration,
    setPlannedSessions,
    setSoundEnabled,
    startSession,
    startNextSession,
    togglePause,
    reset,
  } = useFocusTimer();

  const [durationInput, setDurationInput] = useState(String(durationMin));

  useEffect(() => {
    setDurationInput(String(durationMin));
  }, [durationMin]);

  const pct = totalSecs > 0 ? ((totalSecs - remainingSecs) / totalSecs) * 100 : 0;
  const circumference = 2 * Math.PI * (isFull ? 68 : 52);
  const dashOffset = circumference * (1 - pct / 100);
  const allDone = status === 'completed' && completedSessions >= plannedSessions;
  const sessionLocked = status === 'active' && running;

  function handleDurationBlur() {
    const n = parseInt(durationInput, 10);
    if (Number.isFinite(n)) {
      setDuration(n);
      setDurationInput(String(Math.min(120, Math.max(5, n))));
    } else {
      setDurationInput(String(durationMin));
    }
  }

  const ringSize = isFull ? 'w-44 h-44' : 'w-32 h-32';
  const timeSize = isFull ? 'text-4xl' : 'text-3xl';

  return (
    <div className={`arrow-card ${isFull ? 'p-8' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`font-semibold flex items-center gap-1.5 ${isFull ? 'text-lg' : 'text-sm'}`} style={{ color: theme.textPrimary }}>
          <Timer className={isFull ? 'w-5 h-5' : 'w-4 h-4'} style={{ color: theme.accent }} />
          Pomodoro
        </p>
        {isSessionOpen && (
          <button
            type="button"
            onClick={reset}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: theme.textMuted }}
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task picker — always visible before/during session */}
      <div className="mb-4">
        <PomodoroTaskPicker expanded={isFull} disabled={sessionLocked} />
      </div>

      {isSessionOpen ? (
        <>
          <p className="text-center text-[11px] mb-3 font-medium" style={{ color: theme.textSecondary }}>
            {status === 'completed'
              ? allDone
                ? `Todas as ${plannedSessions} sessões concluídas`
                : `Sessão ${completedSessions} de ${plannedSessions} concluída`
              : `Sessão ${currentSessionNumber} de ${plannedSessions}`}
          </p>

          <div className="flex items-center justify-center my-4">
            <div className={`relative ${ringSize}`}>
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={theme.accent} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={status === 'completed' ? 0 : dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${timeSize} font-black tabular-nums`} style={{ color: theme.accent }}>
                  {status === 'completed' ? '00:00' : fmtTime(remainingSecs)}
                </span>
                <span className="text-[10px]" style={{ color: theme.textMuted }}>
                  {status === 'completed' ? 'concluída' : running ? 'em andamento' : 'pausado'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {status === 'completed' ? (
              !allDone && (
                <button
                  type="button"
                  onClick={startNextSession}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    color: isDark ? '#0B0B0B' : '#fff',
                  }}
                >
                  <Play className="w-4 h-4" />
                  Iniciar próxima sessão
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={togglePause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
                style={{ background: theme.accent, color: isDark ? '#0B0B0B' : '#fff' }}
              >
                {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Continuar</>}
              </button>
            )}
          </div>

          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${status === 'completed' ? 100 : pct}%` }}
              transition={{ duration: 0.5 }}
              style={{ background: theme.accent }}
            />
          </div>
        </>
      ) : (
        <>
          <div className={`flex flex-wrap items-center gap-3 mb-4 ${isFull ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: theme.textMuted }}>Duração</label>
              <input
                type="number"
                min={5}
                max={120}
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                onBlur={handleDurationBlur}
                className="w-14 px-2 py-1.5 rounded-lg text-xs text-center focus:outline-none"
                style={{
                  background: 'var(--arrow-bg-card)',
                  border: '1px solid var(--arrow-border)',
                  color: theme.textPrimary,
                }}
              />
              <span className="text-xs" style={{ color: theme.textMuted }}>min</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs" style={{ color: theme.textMuted }}>Sessões</span>
              {(isFull ? SESSION_OPTIONS : SESSION_OPTIONS.slice(0, 5)).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPlannedSessions(n)}
                  className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: plannedSessions === n ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    color: plannedSessions === n ? (isDark ? '#0B0B0B' : '#fff') : theme.textSecondary,
                    border: `1px solid ${plannedSessions === n ? theme.accent : 'var(--arrow-border)'}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {isFull && (
            <div
              className="flex items-center justify-between p-3 rounded-xl mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--arrow-border)' }}
            >
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4" style={{ color: theme.accent }} /> : <VolumeX className="w-4 h-4" style={{ color: theme.textMuted }} />}
                <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Som ao concluir</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: soundEnabled ? theme.accent : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)') }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: soundEnabled ? '1.25rem' : '0.125rem' }}
                />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={startSession}
            className={`w-full flex items-center justify-center gap-2 rounded-xl font-medium text-sm transition-all hover:opacity-90 ${isFull ? 'py-3.5 text-base' : 'py-3'}`}
            style={{
              background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
              color: isDark ? '#0B0B0B' : '#fff',
            }}
          >
            <Play className="w-4 h-4" />
            Iniciar sessão
          </button>
        </>
      )}
    </div>
  );
}
