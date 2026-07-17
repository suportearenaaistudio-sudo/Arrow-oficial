import { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
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

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MODE_LABELS = {
  focus: 'FOCO',
  short_break: 'PAUSA',
  long_break: 'PAUSA LONGA',
} as const;

export default function PomodoroMiniBar() {
  const {
    status,
    sessionMode,
    durationMin,
    remainingSecs,
    totalSecs,
    running,
    isSessionOpen,
    awaitingBreak,
    startSession,
    startBreak,
    startNextSession,
    togglePause,
    reset,
  } = useFocusTimer();

  const [confirmReset, setConfirmReset] = useState(false);

  const pct = totalSecs > 0 ? ((totalSecs - remainingSecs) / totalSecs) * 100 : 0;
  const isBreak = sessionMode === 'short_break' || sessionMode === 'long_break';
  const displayTime = isSessionOpen ? fmtTime(remainingSecs) : fmtTime(durationMin * 60);

  function handleMain() {
    if (!isSessionOpen || status === 'idle') {
      startSession();
      return;
    }
    if (status === 'completed') {
      if (awaitingBreak) startBreak();
      else startNextSession();
      return;
    }
    if (status === 'active' && remainingSecs <= 0) {
      startNextSession();
      return;
    }
    togglePause();
  }

  function handleReset() {
    const ok = reset();
    if (!ok) setConfirmReset(true);
  }

  const mainLabel = !isSessionOpen
    ? 'START'
    : status === 'completed'
      ? awaitingBreak
        ? 'PAUSA'
        : 'START'
      : running
        ? 'PAUSE'
        : 'PLAY';

  return (
    <>
      <div className="flex items-center gap-3">
        <PomodoroRing
          progress={pct}
          size={56}
          active={isSessionOpen}
          isBreak={isBreak && isSessionOpen}
        >
          <span className="sr-only">{displayTime}</span>
        </PomodoroRing>

        <div className="flex-1 min-w-0">
          <p className="text-xl font-black tabular-nums font-mono leading-none" style={{ color: 'var(--arrow-text-primary)' }}>
            {displayTime}
          </p>
          {isSessionOpen && (
            <p className="text-[9px] font-semibold tracking-widest mt-0.5" style={{ color: isBreak ? '#22c55e' : 'var(--arrow-text-muted)' }}>
              {MODE_LABELS[sessionMode]}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            style={{ color: 'var(--arrow-text-muted)' }}
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleMain}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide"
            style={{
              background: 'var(--arrow-bg-elevated)',
              border: '1px solid var(--arrow-border)',
              color: 'var(--arrow-text-primary)',
            }}
          >
            {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {mainLabel}
          </button>
        </div>
      </div>

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
    </>
  );
}
