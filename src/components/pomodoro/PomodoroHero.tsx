import { useState } from 'react';
import { Coffee, Eye, Play, Pause, RotateCcw, Settings, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import PomodoroRing from '@/components/pomodoro/PomodoroRing';
import PomodoroSettings from '@/components/pomodoro/PomodoroSettings';
import PomodoroTaskPicker from '@/components/pomodoro/PomodoroTaskPicker';
import PomodoroFocusNoteDialog from '@/components/pomodoro/PomodoroFocusNoteDialog';
import ProgressRing from '@/components/ui/ProgressRing';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

const MODE_LABELS = {
  focus: 'FOCO',
  short_break: 'PAUSA CURTA',
  long_break: 'PAUSA LONGA',
} as const;

interface PomodoroHeroProps {
  variant?: 'full' | 'compact';
}

export default function PomodoroHero({ variant = 'full' }: PomodoroHeroProps) {
  const isCompact = variant === 'compact';
  const ringSize = isCompact ? 180 : 280;

  const {
    status,
    sessionMode,
    durationMin,
    remainingSecs,
    totalSecs,
    running,
    isSessionOpen,
    focusSessionsToday,
    focusMinutesToday,
    breaksToday,
    dailyPomodoroGoal,
    sessionsUntilLongBreak,
    timerMode,
    pauseCount,
    awaitingBreak,
    presets,
    startSession,
    startNextSession,
    startBreak,
    skipBreak,
    togglePause,
    reset,
    applyPreset,
  } = useFocusTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('behavior');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const pct = totalSecs > 0 ? ((totalSecs - remainingSecs) / totalSecs) * 100 : 0;
  const isBreak = sessionMode === 'short_break' || sessionMode === 'long_break';
  const isActive = status === 'active' && running;
  const goalPct = dailyPomodoroGoal > 0 ? (focusSessionsToday / dailyPomodoroGoal) * 100 : 0;
  const sessionDots = sessionsUntilLongBreak;

  function handleReset() {
    const ok = reset();
    if (!ok) setConfirmReset(true);
  }

  function handleSkip() {
    if (timerMode === 'strict') {
      setConfirmSkip(true);
    } else {
      skipBreak();
    }
  }

  function handleMainAction() {
    if (!isSessionOpen || (status === 'idle' && !running)) {
      startSession();
      return;
    }
    if (status === 'completed') {
      if (awaitingBreak) {
        startBreak();
      } else {
        startNextSession();
      }
      return;
    }
    if (status === 'active' && remainingSecs <= 0) {
      startNextSession();
      return;
    }
    togglePause();
  }

  const mainLabel = (() => {
    if (!isSessionOpen || status === 'idle') return 'START';
    if (status === 'completed') {
      if (awaitingBreak) return 'INICIAR PAUSA';
      return 'START';
    }
    if (status === 'active' && remainingSecs <= 0) return 'START';
    if (running) {
      return timerMode === 'strict' && sessionMode === 'focus'
        ? `PAUSE (${pauseCount}/${2})`
        : 'PAUSE';
    }
    return 'CONTINUAR';
  })();

  const displayTime =
    status === 'completed' && !running
      ? isBreak
        ? fmtTime(0)
        : fmtTime(0)
      : fmtTime(remainingSecs || durationMin * 60);

  const ModeIcon = isBreak ? Coffee : Eye;

  const goalReached = focusSessionsToday >= dailyPomodoroGoal && dailyPomodoroGoal > 0;

  return (
    <div className={`arrow-card pomodoro-hero ${isCompact ? 'p-5' : 'p-8'}${goalReached ? ' pomodoro-goal-reached' : ''}`}>
      {!isCompact && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {timerMode === 'strict' && (
              <span
                className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
              >
                <Shield className="w-3 h-3" />
                ESTRITO
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => { setSettingsTab('behavior'); setSettingsOpen(true); }}
              className="flex items-center gap-1.5 text-[10px] tabular-nums rounded-lg px-2 py-1 transition-opacity hover:opacity-80"
              style={{ color: 'var(--arrow-text-muted)', background: 'var(--arrow-bg-elevated)' }}
              title="Configurar meta diária"
            >
              <ProgressRing progress={goalPct} size={28} strokeWidth={3} color="var(--arrow-accent)">
                <span className="text-[7px] font-bold">{focusSessionsToday}</span>
              </ProgressRing>
              <span>{focusSessionsToday}/{dailyPomodoroGoal} hoje</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] tabular-nums" style={{ color: 'var(--arrow-text-muted)' }}>
              <span>{focusMinutesToday} min focados</span>
              <span>·</span>
              <span>{breaksToday} pausas</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <ModeIcon
          className={`mb-2 ${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`}
          style={{ color: isBreak ? '#22c55e' : 'var(--arrow-accent)' }}
        />

        <PomodoroRing
          progress={pct}
          size={ringSize}
          active={isSessionOpen && status !== 'idle'}
          isBreak={isBreak && isSessionOpen}
        >
          <span
            className={`font-black tabular-nums font-mono ${isCompact ? 'text-3xl' : 'text-5xl'}`}
            style={{ color: 'var(--arrow-text-primary)' }}
          >
            {isSessionOpen ? displayTime : fmtTime(durationMin * 60)}
          </span>
          {(isSessionOpen || isBreak) && (
            <span
              className="text-[10px] font-semibold tracking-widest mt-1"
              style={{ color: isBreak ? '#22c55e' : 'var(--arrow-text-muted)' }}
            >
              {MODE_LABELS[sessionMode]}
            </span>
          )}
        </PomodoroRing>

        <div className="flex items-center gap-1.5 mt-4">
          {Array.from({ length: sessionDots }).map((_, i) => {
            const filledInCycle =
              focusSessionsToday % sessionDots === 0 && focusSessionsToday > 0
                ? sessionDots
                : focusSessionsToday % sessionDots;
            return (
            <div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: isCompact ? 16 : 24,
                background: i < filledInCycle ? 'var(--arrow-accent)' : 'rgba(128,128,128,0.2)',
              }}
            />
            );
          })}
        </div>

        {!isCompact && (
          <div className="w-full max-w-sm mt-4">
            <PomodoroTaskPicker expanded={false} disabled={isActive && sessionMode === 'focus'} />
          </div>
        )}

        {!isCompact && !isSessionOpen && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {presets.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium"
                style={{
                  background: 'var(--arrow-bg-elevated)',
                  color: 'var(--arrow-text-secondary)',
                  border: '1px solid var(--arrow-border)',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-3 mt-6 ${isCompact ? 'w-full justify-center' : ''}`}>
          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl transition-colors hover:bg-muted"
            style={{ color: 'var(--arrow-text-muted)' }}
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleMainAction}
            className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all hover:opacity-90 ${
              isCompact ? 'px-6 py-2.5 text-xs' : ''
            }`}
            style={{
              background: isActive ? 'var(--arrow-bg-elevated)' : 'rgba(128,128,128,0.15)',
              color: 'var(--arrow-text-primary)',
              border: '1px solid var(--arrow-border)',
              minWidth: isCompact ? 120 : 160,
            }}
          >
            {running ? (
              <span className="flex items-center justify-center gap-2">
                <Pause className="w-4 h-4" />
                {mainLabel}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                {mainLabel}
              </span>
            )}
          </button>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-xl transition-colors hover:bg-muted"
              style={{ color: 'var(--arrow-text-muted)' }}
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {awaitingBreak && status === 'completed' && !isCompact && (
          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--arrow-text-muted)' }}
          >
            Pular pausa →
          </button>
        )}

        {isCompact && (
          <p className="text-[10px] mt-2 tabular-nums" style={{ color: 'var(--arrow-text-muted)' }}>
            {focusSessionsToday}/{dailyPomodoroGoal} pomodoros
          </p>
        )}
      </div>

      <PomodoroSettings open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsTab} />
      <PomodoroFocusNoteDialog />

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Modo estrito: reiniciar durante uma sessão ativa descarta o progresso atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { reset(true); setConfirmReset(false); }}>
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSkip} onOpenChange={setConfirmSkip}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pular pausa?</AlertDialogTitle>
            <AlertDialogDescription>
              Modo estrito: pular a pausa pode reduzir a recuperação entre sessões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { skipBreak(); setConfirmSkip(false); }}>
              Pular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
