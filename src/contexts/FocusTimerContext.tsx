import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncTaskOnPomodoroComplete, syncTaskOnPomodoroStart } from '@/lib/task-pomodoro';

const STORAGE_KEY = 'arrow-focus-timer';
const PREFS_KEY = 'arrow-pomodoro-prefs';
const DEFAULT_DURATION_MIN = 25;

interface PomodoroPrefs {
  soundEnabled: boolean;
  taskId: string | null;
  taskTitle: string | null;
  durationMin: number;
  plannedSessions: number;
}

function loadPrefs(): PomodoroPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        soundEnabled: true,
        taskId: null,
        taskTitle: null,
        durationMin: DEFAULT_DURATION_MIN,
        plannedSessions: 1,
      };
    }
    const p = JSON.parse(raw) as Partial<PomodoroPrefs>;
    return {
      soundEnabled: p.soundEnabled !== false,
      taskId: p.taskId ?? null,
      taskTitle: p.taskTitle ?? null,
      durationMin: typeof p.durationMin === 'number' ? p.durationMin : DEFAULT_DURATION_MIN,
      plannedSessions: typeof p.plannedSessions === 'number' ? p.plannedSessions : 1,
    };
  } catch {
    return {
      soundEnabled: true,
      taskId: null,
      taskTitle: null,
      durationMin: DEFAULT_DURATION_MIN,
      plannedSessions: 1,
    };
  }
}

function savePrefs(prefs: PomodoroPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export type FocusTimerStatus = 'idle' | 'active' | 'completed';

export interface FocusTimerState {
  status: FocusTimerStatus;
  taskId: string | null;
  taskTitle: string | null;
  durationMin: number;
  plannedSessions: number;
  completedSessions: number;
  totalSecs: number;
  remainingSecs: number;
  running: boolean;
}

interface PersistedTimer extends FocusTimerState {
  endAt: number | null;
}

const IDLE_STATE: FocusTimerState = (() => {
  const prefs = loadPrefs();
  return {
    status: 'idle',
    taskId: prefs.taskId,
    taskTitle: prefs.taskTitle,
    durationMin: prefs.durationMin,
    plannedSessions: prefs.plannedSessions,
    completedSessions: 0,
    totalSecs: 0,
    remainingSecs: 0,
    running: false,
  };
})();

function playTimerDoneSound() {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + dur);
    };

    const t = ctx.currentTime;
    playTone(880, t, 0.15);
    playTone(1174, t + 0.18, 0.2);
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    // audio unavailable
  }
}

function loadPersisted(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimer;
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedTimer) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearPersisted() {
  localStorage.removeItem(STORAGE_KEY);
}

function hydrateFromStorage(): { state: FocusTimerState; endAt: number | null } {
  const saved = loadPersisted();
  if (!saved || saved.status === 'idle') {
    return { state: IDLE_STATE, endAt: null };
  }

  if (saved.running && saved.endAt) {
    const remainingSecs = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
    if (remainingSecs <= 0) {
      return {
        state: {
          ...saved,
          remainingSecs: 0,
          running: false,
          status: 'completed',
          completedSessions: saved.completedSessions + 1,
        },
        endAt: null,
      };
    }
    return {
      state: { ...saved, remainingSecs, running: true },
      endAt: saved.endAt,
    };
  }

  return { state: saved, endAt: null };
}

interface FocusTimerContextType extends FocusTimerState {
  isSessionOpen: boolean;
  currentSessionNumber: number;
  soundEnabled: boolean;
  setTask: (id: string | null, title: string | null) => void;
  setDuration: (min: number) => void;
  setPlannedSessions: (n: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  startSession: () => void;
  startNextSession: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  reset: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initial = hydrateFromStorage();
  const [state, setState] = useState<FocusTimerState>(initial.state);
  const [soundEnabled, setSoundEnabledState] = useState(() => loadPrefs().soundEnabled);
  const endAtRef = useRef<number | null>(initial.endAt);
  const completingRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  const promoteTaskOnFocus = useCallback(
    (taskId: string | null) => {
      if (!taskId) return;
      syncTaskOnPomodoroStart(taskId)
        .then(invalidateTasks)
        .catch(() => {});
    },
    [invalidateTasks],
  );

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const saveIdlePrefs = useCallback((partial: Partial<PomodoroPrefs>) => {
    const current = loadPrefs();
    savePrefs({ ...current, ...partial });
  }, []);

  const persist = useCallback((next: FocusTimerState, endAt: number | null) => {
    endAtRef.current = endAt;
    if (next.status === 'idle') {
      clearPersisted();
      return;
    }
    savePersisted({ ...next, endAt });
  }, []);

  const completeSession = useCallback(
    async (prev: FocusTimerState) => {
      if (completingRef.current) return;
      completingRef.current = true;

      if (soundEnabledRef.current) {
        playTimerDoneSound();
      }
      toast.success('Sessão Pomodoro concluída!', {
        duration: 4000,
        description: prev.taskTitle
          ? `"${prev.taskTitle}" — sessão ${prev.completedSessions + 1} finalizada`
          : `Sessão ${prev.completedSessions + 1} finalizada`,
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro concluído!', {
          body: prev.taskTitle || 'Sessão de foco finalizada.',
        });
      }

      const newCompleted = prev.completedSessions + 1;

      if (prev.taskId) {
        try {
          await syncTaskOnPomodoroComplete(prev.taskId, prev.durationMin);
          invalidateTasks();
        } catch {
          // vault may be closed
        }
      }

      const next: FocusTimerState = {
        ...prev,
        completedSessions: newCompleted,
        remainingSecs: 0,
        running: false,
        status: 'completed',
      };
      persist(next, null);
      setState(next);

      setTimeout(() => {
        completingRef.current = false;
      }, 500);
    },
    [persist, invalidateTasks],
  );

  // Tick while running
  useEffect(() => {
    if (!state.running || state.status !== 'active') return;

    const tick = () => {
      const endAt = endAtRef.current;
      if (!endAt) return;

      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remaining <= 0) {
        setState((prev) => {
          if (prev.status === 'active') completeSession(prev);
          return prev;
        });
        return;
      }

      setState((prev) => {
        if (prev.remainingSecs === remaining) return prev;
        const next = { ...prev, remainingSecs: remaining };
        savePersisted({ ...next, endAt });
        return next;
      });
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state.running, state.status, completeSession]);

  const setTask = useCallback(
    (id: string | null, title: string | null) => {
      setState((prev) => {
        const next = { ...prev, taskId: id || null, taskTitle: title || null };
        if (prev.status !== 'idle') persist(next, endAtRef.current);
        else saveIdlePrefs({ taskId: next.taskId, taskTitle: next.taskTitle });
        return next;
      });
      promoteTaskOnFocus(id);
    },
    [persist, saveIdlePrefs, promoteTaskOnFocus],
  );

  const setDuration = useCallback(
    (min: number) => {
      const clamped = Math.min(120, Math.max(5, Math.round(min)));
      setState((prev) => {
        const next = { ...prev, durationMin: clamped };
        if (prev.status !== 'idle') persist(next, endAtRef.current);
        else saveIdlePrefs({ durationMin: clamped });
        return next;
      });
    },
    [persist, saveIdlePrefs],
  );

  const setPlannedSessions = useCallback(
    (n: number) => {
      const clamped = Math.min(8, Math.max(1, Math.round(n)));
      setState((prev) => {
        const next = { ...prev, plannedSessions: clamped };
        if (prev.status !== 'idle') persist(next, endAtRef.current);
        else saveIdlePrefs({ plannedSessions: clamped });
        return next;
      });
    },
    [persist, saveIdlePrefs],
  );

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    saveIdlePrefs({ soundEnabled: enabled });
  }, [saveIdlePrefs]);

  const startSession = useCallback(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setState((prev) => {
      promoteTaskOnFocus(prev.taskId);
      const totalSecs = prev.durationMin * 60;
      const endAt = Date.now() + totalSecs * 1000;
      const next: FocusTimerState = {
        ...prev,
        status: 'active',
        totalSecs,
        remainingSecs: totalSecs,
        running: true,
        completedSessions: prev.status === 'idle' ? 0 : prev.completedSessions,
      };
      persist(next, endAt);
      return next;
    });
  }, [persist, promoteTaskOnFocus]);

  const startNextSession = useCallback(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setState((prev) => {
      promoteTaskOnFocus(prev.taskId);
      const totalSecs = prev.durationMin * 60;
      const endAt = Date.now() + totalSecs * 1000;
      const next: FocusTimerState = {
        ...prev,
        status: 'active',
        totalSecs,
        remainingSecs: totalSecs,
        running: true,
      };
      persist(next, endAt);
      return next;
    });
  }, [persist, promoteTaskOnFocus]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.running) return prev;
      const next = { ...prev, running: false };
      persist(next, null);
      return next;
    });
  }, [persist]);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.running || prev.status !== 'active') return prev;
      const endAt = Date.now() + prev.remainingSecs * 1000;
      const next = { ...prev, running: true };
      persist(next, endAt);
      return next;
    });
  }, [persist]);

  const togglePause = useCallback(() => {
    if (state.running) pause();
    else resume();
  }, [state.running, pause, resume]);

  const reset = useCallback(() => {
    completingRef.current = false;
    endAtRef.current = null;
    clearPersisted();
    const prefs = loadPrefs();
    setState({
      status: 'idle',
      taskId: prefs.taskId,
      taskTitle: prefs.taskTitle,
      durationMin: prefs.durationMin,
      plannedSessions: prefs.plannedSessions,
      completedSessions: 0,
      totalSecs: 0,
      remainingSecs: 0,
      running: false,
    });
  }, []);

  const isSessionOpen = state.status !== 'idle';
  const currentSessionNumber =
    state.status === 'completed'
      ? state.completedSessions
      : state.completedSessions + 1;

  return (
    <FocusTimerContext.Provider
      value={{
        ...state,
        isSessionOpen,
        currentSessionNumber,
        soundEnabled,
        setTask,
        setDuration,
        setPlannedSessions,
        setSoundEnabled,
        startSession,
        startNextSession,
        pause,
        resume,
        togglePause,
        reset,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider');
  return ctx;
}
