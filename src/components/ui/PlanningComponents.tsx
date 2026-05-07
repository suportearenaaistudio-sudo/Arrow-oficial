import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Link, X, ChevronDown, ChevronRight, Flame, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import type { Task, TaskPriority } from '@/types/arrow';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  baixa: '#6b7280', media: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444',
};

// ── Task row ────────────────────────────────────────────────────────────────
export function WeekTaskRow({ task }: { task: Task }) {
  const { theme } = useTheme();
  const { updateTask } = useTasks();
  const done = task.status === 'concluida';

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <button
        onClick={() => updateTask.mutate({
          id: task.id,
          status: done ? 'a_fazer' : 'concluida',
          completion_date: done ? undefined : new Date().toISOString().split('T')[0],
        })}
        className="flex-shrink-0 transition-transform hover:scale-110"
      >
        {done
          ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
          : <Circle className="w-4 h-4" style={{ color: theme.textMuted }} />
        }
      </button>
      <span className="text-sm flex-1" style={{
        color: done ? theme.textMuted : theme.textPrimary,
        textDecoration: done ? 'line-through' : 'none',
        opacity: done ? 0.6 : 1,
      }}>
        {task.title}
      </span>
      {task.priority !== 'baixa' && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: PRIORITY_COLORS[task.priority] }} />
      )}
      {task.estimated_hours && (
        <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted }}>
          {task.estimated_hours}h
        </span>
      )}
    </div>
  );
}

// ── Goal Group ───────────────────────────────────────────────────────────────
export function GoalGroup({
  goalId, goalTitle, tasks, cycleId, weekNumber,
}: {
  goalId: string | null; goalTitle: string; tasks: Task[];
  cycleId: string; weekNumber: number;
}) {
  const { theme, isDark } = useTheme();
  const { createTask, linkTask, tasks: allTasks } = useTasks();
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('media');
  const [newHours, setNewHours] = useState('');

  const done = tasks.filter(t => t.status === 'concluida').length;
  const score = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : null;

  // tasks not yet linked to this week/cycle
  const linkable = allTasks.filter(t =>
    !(t.cycle_id === cycleId && t.week_number === weekNumber) &&
    t.status !== 'concluida'
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createTask.mutate({
      title: newTitle, priority: newPriority,
      status: 'a_fazer', important: false, actual_hours: 0,
      progress_percentage: 0, tags: [], subtasks: [], comments: [], attachments: [],
      cycle_id: cycleId, week_number: weekNumber,
      goal_id: goalId ?? undefined,
      estimated_hours: newHours ? Number(newHours) : undefined,
    } as any, {
      onSuccess: () => { setNewTitle(''); setNewHours(''); setShowAdd(false); }
    });
  }

  return (
    <div className="arrow-card overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 text-left hover:opacity-80 transition-opacity">
        {open ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />}
        <span className="text-sm font-semibold flex-1" style={{ color: theme.textPrimary }}>{goalTitle}</span>
        {score !== null && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: score >= 85 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444',
              background: score >= 85 ? 'rgba(34,197,94,0.12)' : score >= 70 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)',
            }}>
            {done}/{tasks.length}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-3 space-y-0.5">
              {tasks.map(t => <WeekTaskRow key={t.id} task={t} />)}

              {tasks.length === 0 && (
                <p className="text-xs py-2 text-center" style={{ color: theme.textMuted }}>
                  Nenhuma tarefa esta semana
                </p>
              )}

              {/* Add new task */}
              {showAdd ? (
                <form onSubmit={handleCreate} className="mt-2 space-y-2">
                  <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="Título da tarefa..."
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textPrimary, border: `1px solid ${theme.border}` }} />
                  <div className="flex gap-2">
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value as TaskPriority)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                    <input type="number" min={0.5} max={24} step={0.5} value={newHours}
                      onChange={e => setNewHours(e.target.value)}
                      placeholder="Horas"
                      className="w-20 px-2 py-1.5 rounded-lg text-xs focus:outline-none"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textPrimary, border: `1px solid ${theme.border}` }} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAdd(false)}
                      className="flex-1 py-1.5 rounded-lg text-xs" style={{ color: theme.textMuted }}>
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: theme.accent, color: isDark ? '#000' : '#fff' }}>
                      Adicionar
                    </button>
                  </div>
                </form>
              ) : showLink ? (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {linkable.length === 0
                    ? <p className="text-xs text-center py-2" style={{ color: theme.textMuted }}>Nenhuma tarefa disponível</p>
                    : linkable.map(t => (
                      <button key={t.id} onClick={() => {
                        linkTask.mutate({ id: t.id, cycle_id: cycleId, week_number: weekNumber, goal_id: goalId ?? undefined });
                        setShowLink(false);
                      }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:opacity-70"
                        style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.textPrimary }}>
                        {t.title}
                      </button>
                    ))}
                  <button onClick={() => setShowLink(false)}
                    className="w-full py-1 text-xs" style={{ color: theme.textMuted }}>
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <button onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: theme.accent, background: theme.accentLight }}>
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                  <button onClick={() => setShowLink(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: theme.textMuted, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                    <Link className="w-3 h-3" /> Vincular
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
