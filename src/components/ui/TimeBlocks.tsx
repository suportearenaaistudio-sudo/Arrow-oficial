import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import type { TimeBlockType } from '@/types/arrow';

const BLOCKS: {
  type: TimeBlockType; label: string; desc: string;
  emoji: string; defaultMin: number; color: string; accent: string;
}[] = [
  {
    type: 'estrategico', label: 'Bloco Estratégico', desc: 'Trabalho profundo, sem distrações',
    emoji: '🧠', defaultMin: 90, color: 'rgba(99,102,241,0.12)', accent: '#6366f1',
  },
  {
    type: 'buffer', label: 'Bloco Buffer', desc: 'E-mails, mensagens, tarefas menores',
    emoji: '📋', defaultMin: 30, color: 'rgba(234,179,8,0.12)', accent: '#eab308',
  },
  {
    type: 'escape', label: 'Bloco Escape', desc: 'Descanso, lazer, recarga total',
    emoji: '🌿', defaultMin: 60, color: 'rgba(34,197,94,0.12)', accent: '#22c55e',
  },
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface TimerState {
  blockType: TimeBlockType | null;
  taskId: string | null;
  taskTitle: string | null;
  totalSecs: number;
  remainingSecs: number;
  running: boolean;
}

const INITIAL: TimerState = {
  blockType: null, taskId: null, taskTitle: null,
  totalSecs: 0, remainingSecs: 0, running: false,
};

export default function TimeBlocks() {
  const { theme, isDark } = useTheme();
  const { activeCycle } = useCycles();
  const { getTasksByWeek, tasks } = useTasks();
  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 0;
  const weekTasks = activeCycle
    ? getTasksByWeek(activeCycle.id, currentWeek).filter(t => t.status !== 'concluida')
    : [];

  const [timer, setTimer] = useState<TimerState>(INITIAL);
  const [selectingTask, setSelectingTask] = useState(false);
  const [customMin, setCustomMin] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pct = timer.totalSecs > 0
    ? ((timer.totalSecs - timer.remainingSecs) / timer.totalSecs) * 100
    : 0;

  const blockCfg = BLOCKS.find(b => b.type === timer.blockType);

  // Tick
  useEffect(() => {
    if (timer.running && timer.remainingSecs > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t.remainingSecs <= 1) {
            clearInterval(intervalRef.current!);
            // Notification on finish
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⏱ Bloco concluído!', {
                body: `${blockCfg?.label} finalizado.`,
              });
            }
            return { ...t, remainingSecs: 0, running: false };
          }
          return { ...t, remainingSecs: t.remainingSecs - 1 };
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.running, timer.remainingSecs]);

  function startBlock(type: TimeBlockType, minutes: number) {
    if (Notification.permission === 'default') Notification.requestPermission();
    const secs = minutes * 60;
    setTimer({
      blockType: type, taskId: timer.taskId, taskTitle: timer.taskTitle,
      totalSecs: secs, remainingSecs: secs, running: true,
    });
    setCustomMin(null);
  }

  function togglePause() {
    setTimer(t => ({ ...t, running: !t.running }));
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(INITIAL);
    setSelectingTask(false);
  }

  function selectTask(id: string, title: string) {
    setTimer(t => ({ ...t, taskId: id, taskTitle: title }));
    setSelectingTask(false);
  }

  // Active timer view
  if (timer.blockType) {
    const cfg = blockCfg!;
    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference * (1 - pct / 100);

    return (
      <div className="arrow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cfg.emoji}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{cfg.label}</p>
              {timer.taskTitle && (
                <p className="text-xs truncate max-w-[180px]" style={{ color: theme.textMuted }}>
                  🎯 {timer.taskTitle}
                </p>
              )}
            </div>
          </div>
          <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: theme.textMuted }}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Circular timer */}
        <div className="flex items-center justify-center my-4">
          <div className="relative w-28 h-28">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={cfg.accent} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color: cfg.accent }}>
                {fmtTime(timer.remainingSecs)}
              </span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>
                {timer.running ? 'em andamento' : 'pausado'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={togglePause}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
            style={{ background: cfg.accent, color: '#fff' }}>
            {timer.running
              ? <><Pause className="w-4 h-4" /> Pausar</>
              : <><Play className="w-4 h-4" /> Continuar</>
            }
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full overflow-hidden"
          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <motion.div className="h-full rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
            style={{ background: cfg.accent }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: theme.textMuted }}>
          <span>0:00</span>
          <span>{Math.round(timer.totalSecs / 60)} min</span>
        </div>
      </div>
    );
  }

  // Block selection view
  return (
    <div className="arrow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>⏱ Blocos de Tempo</p>
        {weekTasks.length > 0 && (
          <button onClick={() => setSelectingTask(s => !s)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: timer.taskTitle ? theme.accent : theme.textMuted, background: timer.taskTitle ? theme.accentLight : 'transparent' }}>
            {timer.taskTitle ? `🎯 ${timer.taskTitle.slice(0, 20)}...` : '+ Vincular tarefa'}
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Task picker */}
      <AnimatePresence>
        {selectingTask && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="mb-3 overflow-hidden">
            <div className="space-y-1 max-h-32 overflow-y-auto pb-1">
              <button onClick={() => selectTask('', '')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs"
                style={{ color: theme.textMuted }}>Sem tarefa</button>
              {weekTasks.map(t => (
                <button key={t.id}
                  onClick={() => selectTask(t.id, t.title)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors hover:opacity-70"
                  style={{
                    background: timer.taskId === t.id ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    color: timer.taskId === t.id ? theme.accent : theme.textPrimary,
                  }}>
                  {timer.taskId === t.id && <Check className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block cards */}
      <div className="space-y-2">
        {BLOCKS.map(block => (
          <div key={block.type} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: block.color, border: `1px solid ${block.accent}25` }}>
            <span className="text-xl">{block.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: block.accent }}>{block.label}</p>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>{block.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Custom duration input */}
              <input
                type="number" min={5} max={240}
                value={customMin ?? block.defaultMin}
                onChange={e => setCustomMin(Number(e.target.value))}
                onClick={e => e.stopPropagation()}
                className="w-12 px-1.5 py-1 rounded-lg text-xs text-center focus:outline-none"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: theme.textPrimary, border: `1px solid ${block.accent}40` }}
              />
              <span className="text-[10px]" style={{ color: theme.textMuted }}>min</span>
              <button
                onClick={() => startBlock(block.type, customMin ?? block.defaultMin)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: block.accent, color: '#fff' }}>
                <Play className="w-3 h-3" /> Iniciar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
