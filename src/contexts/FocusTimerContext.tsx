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
import { todayKey } from '@/lib/time-blocks';
import { desktopAPI } from '@/lib/desktop-api';
import {
  countCompletedFocusToday,
  countFocusMinutesToday,
  countBreaksToday,
  createSessionLog,
  logSession,
  updateSessionNote,
} from '@/lib/pomodoro-sessions';
import { getAllPresets } from '@/lib/pomodoro-presets';
import type { AmbientSound, PomodoroPreset, SessionMode, TimerMode } from '@/types/pomodoro';
import { useAmbientSound } from '@/hooks/useAmbientSound';

const STORAGE_KEY = 'arrow-focus-timer';
const PREFS_KEY = 'arrow-pomodoro-prefs';
const DEFAULT_DURATION_MIN = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;

export const DURATION_PRESETS = [15, 25, 45, 50, 90] as const;
const MAX_STRICT_PAUSES = 2;

interface PomodoroPrefs {
  soundEnabled: boolean;
  taskId: string | null;
  taskTitle: string | null;
  durationMin: number;
  plannedSessions: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsUntilLongBreak: number;
  activeBlockId: string | null;
  sessionMode: SessionMode;
  autoStartBreak: boolean;
  dailyPomodoroGoal: number;
  timerMode: TimerMode;
  ambientSound: AmbientSound;
  ambientVolume: number;
  focusSessionsTodayDate: string;
  focusSessionsToday: number;
  activePresetId: string | null;
}

function loadPrefs(): PomodoroPrefs {
  const defaults: PomodoroPrefs = {
    soundEnabled: true,
    taskId: null,
    taskTitle: null,
    durationMin: DEFAULT_DURATION_MIN,
    plannedSessions: 1,
    shortBreakMin: DEFAULT_SHORT_BREAK,
    longBreakMin: DEFAULT_LONG_BREAK,
    sessionsUntilLongBreak: 4,
    activeBlockId: null,
    sessionMode: 'focus',
    autoStartBreak: false,
    dailyPomodoroGoal: 8,
    timerMode: 'gentle',
    ambientSound: 'none',
    ambientVolume: 0.5,
    focusSessionsTodayDate: todayKey(),
    focusSessionsToday: 0,
    activePresetId: null,
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    const p = JSON.parse(raw) as Partial<PomodoroPrefs>;
    const today = todayKey();
    const focusSessionsToday =
      p.focusSessionsTodayDate === today
        ? (p.focusSessionsToday ?? countCompletedFocusToday())
        : countCompletedFocusToday();
    return {
      soundEnabled: p.soundEnabled !== false,
      taskId: p.taskId ?? null,
      taskTitle: p.taskTitle ?? null,
      durationMin: typeof p.durationMin === 'number' ? p.durationMin : DEFAULT_DURATION_MIN,
      plannedSessions: typeof p.plannedSessions === 'number' ? p.plannedSessions : 1,
      shortBreakMin: typeof p.shortBreakMin === 'number' ? p.shortBreakMin : DEFAULT_SHORT_BREAK,
      longBreakMin: typeof p.longBreakMin === 'number' ? p.longBreakMin : DEFAULT_LONG_BREAK,
      sessionsUntilLongBreak:
        typeof p.sessionsUntilLongBreak === 'number' ? p.sessionsUntilLongBreak : 4,
      activeBlockId: p.activeBlockId ?? null,
      sessionMode: p.sessionMode ?? 'focus',
      autoStartBreak: p.autoStartBreak === true,
      dailyPomodoroGoal: typeof p.dailyPomodoroGoal === 'number' ? p.dailyPomodoroGoal : 8,
      timerMode: p.timerMode === 'strict' ? 'strict' : 'gentle',
      ambientSound: (p.ambientSound as AmbientSound) ?? 'none',
      ambientVolume: typeof p.ambientVolume === 'number' ? p.ambientVolume : 0.5,
      focusSessionsTodayDate: today,
      focusSessionsToday,
      activePresetId: p.activePresetId ?? null,
    };
  } catch {
    return defaults;
  }
}

function savePrefs(prefs: PomodoroPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export type FocusTimerStatus = 'idle' | 'active' | 'completed';

export interface FocusTimerState {
  status: FocusTimerStatus;
  sessionMode: SessionMode;
  taskId: string | null;
  taskTitle: string | null;
  durationMin: number;
  plannedSessions: number;
  completedSessions: number;
  totalSecs: number;
  remainingSecs: number;
  running: boolean;
  activeBlockId: string | null;
  pauseCount: number;
  awaitingBreak: boolean;
}

interface PersistedTimer extends FocusTimerState {
  endAt: number | null;
  sessionStartedAt: string | null;
}

const IDLE_STATE: FocusTimerState = (() => {
  const prefs = loadPrefs();
  return {
    status: 'idle',
    sessionMode: 'focus',
    taskId: prefs.taskId,
    taskTitle: prefs.taskTitle,
    durationMin: prefs.durationMin,
    plannedSessions: prefs.plannedSessions,
    completedSessions: 0,
    totalSecs: 0,
    remainingSecs: 0,
    running: false,
    activeBlockId: prefs.activeBlockId,
    pauseCount: 0,
    awaitingBreak: false,
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

function hydrateFromStorage(): {
  state: FocusTimerState;
  endAt: number | null;
  sessionStartedAt: string | null;
  pendingCompletion: boolean;
} {
  const saved = loadPersisted();
  if (!saved || saved.status === 'idle') {
    return { state: IDLE_STATE, endAt: null, sessionStartedAt: null, pendingCompletion: false };
  }

  const normalized: FocusTimerState = {
    ...saved,
    sessionMode: saved.sessionMode ?? 'focus',
    activeBlockId: saved.activeBlockId ?? null,
    pauseCount: saved.pauseCount ?? 0,
    awaitingBreak: saved.awaitingBreak ?? false,
  };

  if (saved.running && saved.endAt) {
    const remainingSecs = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
    if (remainingSecs <= 0) {
      return {
        state: {
          ...normalized,
          remainingSecs: 0,
          running: false,
          status: 'active',
        },
        endAt: null,
        sessionStartedAt: saved.sessionStartedAt,
        pendingCompletion: true,
      };
    }
    return {
      state: { ...normalized, remainingSecs, running: true },
      endAt: saved.endAt,
      sessionStartedAt: saved.sessionStartedAt,
      pendingCompletion: false,
    };
  }

  return { state: normalized, endAt: null, sessionStartedAt: saved.sessionStartedAt, pendingCompletion: false };
}

interface FocusTimerContextType extends FocusTimerState {
  isSessionOpen: boolean;
  currentSessionNumber: number;
  soundEnabled: boolean;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsUntilLongBreak: number;
  autoStartBreak: boolean;
  dailyPomodoroGoal: number;
  focusSessionsToday: number;
  focusMinutesToday: number;
  breaksToday: number;
  activePresetId: string | null;
  timerMode: TimerMode;
  ambientSound: AmbientSound;
  ambientVolume: number;
  presets: PomodoroPreset[];
  setTask: (id: string | null, title: string | null) => void;
  setDuration: (min: number) => void;
  setPlannedSessions: (n: number) => void;
  setShortBreakMin: (min: number) => void;
  setLongBreakMin: (min: number) => void;
  setSessionsUntilLongBreak: (n: number) => void;
  setActiveBlockId: (id: string | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAutoStartBreak: (v: boolean) => void;
  setDailyPomodoroGoal: (n: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setAmbientSound: (sound: AmbientSound) => void;
  setAmbientVolume: (v: number) => void;
  applyPreset: (preset: PomodoroPreset) => void;
  refreshPresets: () => void;
  startSession: () => void;
  startNextSession: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  pause: () => boolean;
  resume: () => void;
  togglePause: () => void;
  reset: (force?: boolean) => boolean;
  resetCycle: () => void;
  addManualPomodoro: () => void;
  pendingFocusNoteId: string | null;
  submitFocusNote: (note: string) => void;
  dismissFocusNote: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initial = hydrateFromStorage();
  const [state, setState] = useState<FocusTimerState>(initial.state);
  const prefs = loadPrefs();
  const [soundEnabled, setSoundEnabledState] = useState(() => prefs.soundEnabled);
  const [shortBreakMin, setShortBreakMinState] = useState(() => prefs.shortBreakMin);
  const [longBreakMin, setLongBreakMinState] = useState(() => prefs.longBreakMin);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreakState] = useState(
    () => prefs.sessionsUntilLongBreak,
  );
  const [autoStartBreak, setAutoStartBreakState] = useState(() => prefs.autoStartBreak);
  const [dailyPomodoroGoal, setDailyPomodoroGoalState] = useState(() => prefs.dailyPomodoroGoal);
  const [focusSessionsToday, setFocusSessionsToday] = useState(() => prefs.focusSessionsToday);
  const [focusMinutesToday, setFocusMinutesToday] = useState(() => countFocusMinutesToday());
  const [breaksToday, setBreaksToday] = useState(() => countBreaksToday());
  const [activePresetId, setActivePresetIdState] = useState<string | null>(() => prefs.activePresetId);
  const [pendingFocusNoteId, setPendingFocusNoteId] = useState<string | null>(null);
  const [timerMode, setTimerModeState] = useState<TimerMode>(() => prefs.timerMode);
  const [ambientSound, setAmbientSoundState] = useState<AmbientSound>(() => prefs.ambientSound);
  const [ambientVolume, setAmbientVolumeState] = useState(() => prefs.ambientVolume);
  const [presets, setPresets] = useState(() => getAllPresets());

  const endAtRef = useRef<number | null>(initial.endAt);
  const sessionStartedAtRef = useRef<string | null>(initial.sessionStartedAt);
  const processedOnHydrateRef = useRef(false);
  const stateRef = useRef(initial.state);
  const skipBreakRef = useRef<() => void>(() => {});
  const completingRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  const timerModeRef = useRef(timerMode);
  const autoStartBreakRef = useRef(autoStartBreak);
  const focusSessionsTodayRef = useRef(focusSessionsToday);
  const dailyGoalRef = useRef(dailyPomodoroGoal);
  const shortBreakRef = useRef(shortBreakMin);
  const longBreakRef = useRef(longBreakMin);
  const sessionsUntilLongRef = useRef(sessionsUntilLongBreak);

  const ambientPlaying =
    state.running && state.status === 'active' && state.sessionMode === 'focus';

  useAmbientSound(ambientSound, ambientVolume, ambientPlaying);

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

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { timerModeRef.current = timerMode; }, [timerMode]);
  useEffect(() => { autoStartBreakRef.current = autoStartBreak; }, [autoStartBreak]);
  useEffect(() => { focusSessionsTodayRef.current = focusSessionsToday; }, [focusSessionsToday]);
  useEffect(() => { dailyGoalRef.current = dailyPomodoroGoal; }, [dailyPomodoroGoal]);
  useEffect(() => { shortBreakRef.current = shortBreakMin; }, [shortBreakMin]);
  useEffect(() => { longBreakRef.current = longBreakMin; }, [longBreakMin]);
  useEffect(() => { sessionsUntilLongRef.current = sessionsUntilLongBreak; }, [sessionsUntilLongBreak]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const refreshTodayStats = useCallback(() => {
    setFocusMinutesToday(countFocusMinutesToday());
    setBreaksToday(countBreaksToday());
    const today = todayKey();
    const current = loadPrefs();
    if (current.focusSessionsTodayDate === today) {
      setFocusSessionsToday(current.focusSessionsToday);
    } else {
      const count = countCompletedFocusToday();
      setFocusSessionsToday(count);
    }
  }, []);

  useEffect(() => {
    const onUpdate = () => refreshTodayStats();
    window.addEventListener('arrow-pomodoro-sessions-updated', onUpdate);
    return () => window.removeEventListener('arrow-pomodoro-sessions-updated', onUpdate);
  }, [refreshTodayStats]);

  const saveIdlePrefs = useCallback((partial: Partial<PomodoroPrefs>) => {
    const current = loadPrefs();
    savePrefs({ ...current, ...partial });
  }, []);

  useEffect(() => {
    const syncDayCounter = () => {
      const today = todayKey();
      const current = loadPrefs();
      if (current.focusSessionsTodayDate !== today) {
        const count = countCompletedFocusToday();
        setFocusSessionsToday(count);
        saveIdlePrefs({ focusSessionsToday: count, focusSessionsTodayDate: today });
      }
    };
    syncDayCounter();
    const interval = setInterval(syncDayCounter, 60_000);
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const midnightTimer = setTimeout(syncDayCounter, msUntilMidnight + 200);
    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [saveIdlePrefs]);

  const persist = useCallback((next: FocusTimerState, endAt: number | null) => {
    endAtRef.current = endAt;
    if (next.status === 'idle') {
      clearPersisted();
      return;
    }
    savePersisted({
      ...next,
      endAt,
      sessionStartedAt: sessionStartedAtRef.current,
    });
  }, []);

  const incrementFocusToday = useCallback(() => {
    const today = todayKey();
    const current = loadPrefs();
    const count =
      current.focusSessionsTodayDate === today
        ? current.focusSessionsToday + 1
        : 1;
    setFocusSessionsToday(count);
    saveIdlePrefs({ focusSessionsToday: count, focusSessionsTodayDate: today });
    return count;
  }, [saveIdlePrefs]);

  const startTimerInternal = useCallback(
    (mode: SessionMode, durationMin: number, prev: FocusTimerState) => {
      const totalSecs = durationMin * 60;
      const endAt = Date.now() + totalSecs * 1000;
      sessionStartedAtRef.current = new Date().toISOString();
      const next: FocusTimerState = {
        ...prev,
        sessionMode: mode,
        status: 'active',
        durationMin,
        totalSecs,
        remainingSecs: totalSecs,
        running: true,
        pauseCount: 0,
        awaitingBreak: false,
      };
      persist(next, endAt);
      return next;
    },
    [persist],
  );

  const handleFocusComplete = useCallback(
    async (prev: FocusTimerState) => {
      const startedAt = sessionStartedAtRef.current
        ? new Date(sessionStartedAtRef.current)
        : new Date();

      const logged = logSession(
        createSessionLog('focus', prev.durationMin, startedAt, {
          taskId: prev.taskId,
          taskTitle: prev.taskTitle,
          blockId: prev.activeBlockId,
          completed: true,
        }),
      );
      setPendingFocusNoteId(logged.id);
      refreshTodayStats();

      const newFocusCount = incrementFocusToday();

      if (prev.taskId) {
        try {
          await syncTaskOnPomodoroComplete(prev.taskId, prev.durationMin);
          invalidateTasks();
        } catch {
          // vault may be closed
        }
      }

      if (prev.activeBlockId) {
        try {
          const blocks = await desktopAPI.db.timeBlocks.list(todayKey()) as Array<{
            id: string; startMin: number; endMin: number; filledMin: number;
          }>;
          const block = blocks.find((item) => item.id === prev.activeBlockId);
          if (block) {
            await desktopAPI.db.timeBlocks.update({
              id: block.id,
              filledMin: Math.min(Math.max(1, block.endMin - block.startMin), block.filledMin + prev.durationMin),
            });
          }
        } catch {
          // Timer completion must remain resilient if the vault is unavailable.
        }
        window.dispatchEvent(
          new CustomEvent('arrow-time-blocks-updated', { detail: { date: todayKey() } }),
        );
      }

      const newCompleted = prev.completedSessions + 1;
      const nextBreak =
        newFocusCount % sessionsUntilLongRef.current === 0 ? 'long_break' : 'short_break';

      const next: FocusTimerState = {
        ...prev,
        completedSessions: newCompleted,
        remainingSecs: 0,
        running: false,
        status: 'completed',
        awaitingBreak: true,
        sessionMode: 'focus',
      };
      persist(next, null);
      setState(next);

      if (newFocusCount >= dailyGoalRef.current) {
        toast.success('Meta diária atingida!', {
          description: `${newFocusCount} pomodoros hoje. Parabéns!`,
          duration: 5000,
        });
      }

      if (autoStartBreakRef.current) {
        setTimeout(() => {
          setState((s) => {
            if (s.status !== 'completed' || !s.awaitingBreak) return s;
            const breakMin =
              nextBreak === 'long_break' ? longBreakRef.current : shortBreakRef.current;
            promoteTaskOnFocus(s.taskId);
            return startTimerInternal(nextBreak, breakMin, {
              ...s,
              sessionMode: nextBreak,
              awaitingBreak: false,
            });
          });
        }, 800);
      } else {
        toast.success('Sessão de foco concluída!', {
          duration: 6000,
          description: prev.taskTitle
            ? `"${prev.taskTitle}" — sessão ${newCompleted} finalizada`
            : `Sessão ${newCompleted} finalizada`,
          action: {
            label: 'Iniciar pausa',
            onClick: () => {
              setState((s) => {
                const breakMin =
                  nextBreak === 'long_break' ? longBreakRef.current : shortBreakRef.current;
                return startTimerInternal(nextBreak, breakMin, {
                  ...s,
                  awaitingBreak: false,
                });
              });
            },
          },
          cancel: {
            label: 'Pular',
            onClick: () => skipBreakRef.current(),
          },
        });
      }
    },
    [incrementFocusToday, invalidateTasks, persist, promoteTaskOnFocus, refreshTodayStats, startTimerInternal],
  );

  const handleBreakComplete = useCallback(
    (prev: FocusTimerState) => {
      const startedAt = sessionStartedAtRef.current
        ? new Date(sessionStartedAtRef.current)
        : new Date();

      logSession(
        createSessionLog(prev.sessionMode, prev.durationMin, startedAt, {
          taskId: prev.taskId,
          taskTitle: prev.taskTitle,
          blockId: prev.activeBlockId,
          completed: true,
        }),
      );
      refreshTodayStats();

      sessionStartedAtRef.current = null;
      const prefsNow = loadPrefs();
      const next: FocusTimerState = {
        ...prev,
        status: 'idle',
        remainingSecs: prefsNow.durationMin * 60,
        totalSecs: 0,
        running: false,
        awaitingBreak: false,
        sessionMode: 'focus',
        durationMin: prefsNow.durationMin,
        pauseCount: 0,
      };
      persist(next, null);
      setState(next);

      toast.success('Pausa concluída', {
        description: 'Pronto para a próxima sessão de foco.',
        duration: 5000,
        action: {
          label: 'Iniciar foco',
          onClick: () => {
            setState((s) => startTimerInternal('focus', prefsNow.durationMin, s));
          },
        },
      });
    },
    [persist, refreshTodayStats, startTimerInternal],
  );

  const completeSession = useCallback(
    async (prev: FocusTimerState) => {
      if (completingRef.current) return;
      completingRef.current = true;

      if (soundEnabledRef.current) {
        playTimerDoneSound();
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const label =
          prev.sessionMode === 'focus'
            ? 'Pomodoro concluído!'
            : 'Pausa concluída!';
        new Notification(label, {
          body: prev.taskTitle || 'Sessão finalizada.',
        });
      }

      try {
        if (prev.sessionMode === 'focus') {
          await handleFocusComplete(prev);
        } else {
          handleBreakComplete(prev);
        }
      } finally {
        setTimeout(() => {
          completingRef.current = false;
        }, 500);
      }
    },
    [handleFocusComplete, handleBreakComplete],
  );

  useEffect(() => {
    if (!state.running || state.status !== 'active') return;

    const tick = () => {
      const endAt = endAtRef.current;
      if (!endAt) return;

      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remaining <= 0) {
        endAtRef.current = null;
        const current = stateRef.current;
        if (current.status !== 'active' || completingRef.current) return;

        const snapshot = { ...current, remainingSecs: 0, running: false };
        setState(snapshot);
        persist(snapshot, null);
        completeSession(snapshot);
        return;
      }

      setState((prev) => {
        if (prev.remainingSecs === remaining) return prev;
        const next = { ...prev, remainingSecs: remaining };
        savePersisted({ ...next, endAt, sessionStartedAt: sessionStartedAtRef.current });
        return next;
      });
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state.running, state.status, completeSession, persist]);

  useEffect(() => {
    if (!initial.pendingCompletion || processedOnHydrateRef.current) return;
    processedOnHydrateRef.current = true;
    completeSession(initial.state);
  }, [initial.pendingCompletion, initial.state, completeSession]);

  const refreshPresets = useCallback(() => {
    setPresets(getAllPresets());
  }, []);

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

  const setSessionsUntilLongBreak = useCallback(
    (n: number) => {
      const clamped = Math.min(8, Math.max(2, Math.round(n)));
      setSessionsUntilLongBreakState(clamped);
      saveIdlePrefs({ sessionsUntilLongBreak: clamped });
    },
    [saveIdlePrefs],
  );

  const setShortBreakMin = useCallback(
    (min: number) => {
      const clamped = Math.min(30, Math.max(3, Math.round(min)));
      setShortBreakMinState(clamped);
      saveIdlePrefs({ shortBreakMin: clamped });
    },
    [saveIdlePrefs],
  );

  const setLongBreakMin = useCallback(
    (min: number) => {
      const clamped = Math.min(45, Math.max(5, Math.round(min)));
      setLongBreakMinState(clamped);
      saveIdlePrefs({ longBreakMin: clamped });
    },
    [saveIdlePrefs],
  );

  const setActiveBlockId = useCallback(
    (id: string | null) => {
      setState((prev) => {
        const next = { ...prev, activeBlockId: id };
        if (prev.status !== 'idle') persist(next, endAtRef.current);
        else saveIdlePrefs({ activeBlockId: id });
        return next;
      });
    },
    [persist, saveIdlePrefs],
  );

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    saveIdlePrefs({ soundEnabled: enabled });
  }, [saveIdlePrefs]);

  const setAutoStartBreak = useCallback((v: boolean) => {
    setAutoStartBreakState(v);
    saveIdlePrefs({ autoStartBreak: v });
  }, [saveIdlePrefs]);

  const setDailyPomodoroGoal = useCallback((n: number) => {
    const clamped = Math.min(20, Math.max(1, Math.round(n)));
    setDailyPomodoroGoalState(clamped);
    saveIdlePrefs({ dailyPomodoroGoal: clamped });
  }, [saveIdlePrefs]);

  const setTimerMode = useCallback((mode: TimerMode) => {
    setTimerModeState(mode);
    saveIdlePrefs({ timerMode: mode });
  }, [saveIdlePrefs]);

  const setAmbientSound = useCallback((sound: AmbientSound) => {
    setAmbientSoundState(sound);
    saveIdlePrefs({ ambientSound: sound });
  }, [saveIdlePrefs]);

  const setAmbientVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setAmbientVolumeState(clamped);
    saveIdlePrefs({ ambientVolume: clamped });
  }, [saveIdlePrefs]);

  const applyPreset = useCallback(
    (preset: PomodoroPreset) => {
      setDuration(preset.durationMin);
      setShortBreakMin(preset.shortBreakMin);
      setLongBreakMin(preset.longBreakMin);
      setSessionsUntilLongBreak(preset.sessionsUntilLongBreak);
      setActivePresetIdState(preset.id);
      saveIdlePrefs({ activePresetId: preset.id });
      toast.success(`Preset "${preset.name}" aplicado`);
    },
    [setDuration, setShortBreakMin, setLongBreakMin, setSessionsUntilLongBreak, saveIdlePrefs],
  );

  const startSession = useCallback(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setState((prev) => {
      promoteTaskOnFocus(prev.taskId);
      const p = loadPrefs();
      const activeBlockId = prev.activeBlockId ?? p.activeBlockId;
      const next = startTimerInternal('focus', prev.durationMin, {
        ...prev,
        completedSessions: prev.status === 'idle' ? 0 : prev.completedSessions,
        activeBlockId,
      });
      if (activeBlockId) saveIdlePrefs({ activeBlockId });
      return next;
    });
  }, [promoteTaskOnFocus, saveIdlePrefs, startTimerInternal]);

  const startNextSession = useCallback(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setState((prev) => {
      promoteTaskOnFocus(prev.taskId);
      return startTimerInternal('focus', prev.durationMin, prev);
    });
  }, [promoteTaskOnFocus, startTimerInternal]);

  const startBreak = useCallback(() => {
    setState((prev) => {
      const count = focusSessionsTodayRef.current;
      const nextBreak =
        count > 0 && count % sessionsUntilLongRef.current === 0
          ? 'long_break'
          : 'short_break';
      const breakMin = nextBreak === 'long_break' ? longBreakRef.current : shortBreakRef.current;
      return startTimerInternal(nextBreak, breakMin, { ...prev, awaitingBreak: false });
    });
  }, [startTimerInternal]);

  const skipBreak = useCallback(() => {
    setState((prev) => {
      const prefsNow = loadPrefs();
      const next: FocusTimerState = {
        ...prev,
        status: 'idle',
        sessionMode: 'focus',
        remainingSecs: 0,
        totalSecs: 0,
        running: false,
        awaitingBreak: false,
        durationMin: prefsNow.durationMin,
        pauseCount: 0,
      };
      persist(next, null);
      return next;
    });
  }, [persist]);

  skipBreakRef.current = skipBreak;

  const pause = useCallback((): boolean => {
    let blocked = false;
    setState((prev) => {
      if (!prev.running) return prev;
      if (
        timerModeRef.current === 'strict' &&
        prev.sessionMode === 'focus' &&
        prev.pauseCount >= MAX_STRICT_PAUSES
      ) {
        blocked = true;
        toast.error('Modo estrito: limite de pausas atingido (2/2)');
        return prev;
      }
      const next = {
        ...prev,
        running: false,
        pauseCount: prev.sessionMode === 'focus' ? prev.pauseCount + 1 : prev.pauseCount,
      };
      persist(next, null);
      return next;
    });
    return !blocked;
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

  const reset = useCallback(
    (force = false): boolean => {
      const current = stateRef.current;
      if (!force && timerModeRef.current === 'strict' && current.status === 'active') {
        return false;
      }

      if (current.status === 'active' && sessionStartedAtRef.current) {
        const elapsedMin = Math.max(
          1,
          Math.round((current.totalSecs - current.remainingSecs) / 60),
        );
        logSession(
          createSessionLog(current.sessionMode, elapsedMin, new Date(sessionStartedAtRef.current), {
            taskId: current.taskId,
            taskTitle: current.taskTitle,
            blockId: current.activeBlockId,
            completed: false,
          }),
        );
      }

      completingRef.current = false;
      endAtRef.current = null;
      sessionStartedAtRef.current = null;
      clearPersisted();
      const p = loadPrefs();
      setState({
        status: 'idle',
        sessionMode: 'focus',
        taskId: p.taskId,
        taskTitle: p.taskTitle,
        durationMin: p.durationMin,
        plannedSessions: p.plannedSessions,
        completedSessions: 0,
        totalSecs: 0,
        remainingSecs: 0,
        running: false,
        activeBlockId: p.activeBlockId,
        pauseCount: 0,
        awaitingBreak: false,
      });
      return true;
    },
    [],
  );

  const resetCycle = useCallback(() => {
    reset(true);
    setFocusSessionsToday(0);
    saveIdlePrefs({ focusSessionsToday: 0, focusSessionsTodayDate: todayKey() });
    refreshTodayStats();
  }, [reset, saveIdlePrefs, refreshTodayStats]);

  const addManualPomodoro = useCallback(() => {
    const p = loadPrefs();
    logSession(
      createSessionLog('focus', p.durationMin, new Date(), {
        taskId: p.taskId,
        taskTitle: p.taskTitle,
        blockId: p.activeBlockId,
        completed: true,
        manual: true,
      }),
    );
    incrementFocusToday();
    refreshTodayStats();
    toast.success('+1 pomodoro registrado manualmente');
  }, [incrementFocusToday, refreshTodayStats]);

  const submitFocusNote = useCallback((note: string) => {
    if (pendingFocusNoteId) updateSessionNote(pendingFocusNoteId, note);
    setPendingFocusNoteId(null);
  }, [pendingFocusNoteId]);

  const dismissFocusNote = useCallback(() => {
    setPendingFocusNoteId(null);
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
        shortBreakMin,
        longBreakMin,
        sessionsUntilLongBreak,
        autoStartBreak,
        dailyPomodoroGoal,
        focusSessionsToday,
        focusMinutesToday,
        breaksToday,
        activePresetId,
        timerMode,
        ambientSound,
        ambientVolume,
        presets,
        setTask,
        setDuration,
        setPlannedSessions,
        setShortBreakMin,
        setLongBreakMin,
        setSessionsUntilLongBreak,
        setActiveBlockId,
        setSoundEnabled,
        setAutoStartBreak,
        setDailyPomodoroGoal,
        setTimerMode,
        setAmbientSound,
        setAmbientVolume,
        applyPreset,
        refreshPresets,
        startSession,
        startNextSession,
        startBreak,
        skipBreak,
        pause,
        resume,
        togglePause,
        reset,
        resetCycle,
        addManualPomodoro,
        pendingFocusNoteId,
        submitFocusNote,
        dismissFocusNote,
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
