import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Edit2,
  Play,
  CheckSquare,
  Trash2,
  Star,
  Target,
  Timer,
  Flag,
} from 'lucide-react';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { getPomodoroCount } from '@/lib/task-pomodoro';
import { getEisenhowerQuadrantInfo, getEisenhowerQuadrant, normalizeDateKey } from '@/lib/task-views';
import type { Task, TaskStatus } from '@/types/arrow';

const statusLabel: Record<TaskStatus, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  revisao: 'Revisão',
  concluida: 'Concluída',
};

const priorityLabel: Record<Task['priority'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

interface TaskDetailPanelProps {
  task: Task | null;
  goalTitle?: string;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}

export function TaskDetailPanel({
  task,
  goalTitle,
  open,
  onClose,
  onEdit,
  onDelete,
  onMove,
}: TaskDetailPanelProps) {
  const navigate = useNavigate();
  const { setTask, startSession, status: timerStatus } = useFocusTimer();

  if (!task) return null;

  const pomodoros = getPomodoroCount(task.tags);
  const eisenhower = getEisenhowerQuadrantInfo(getEisenhowerQuadrant(task));
  const dueKey = normalizeDateKey(task.due_date);
  const progress =
    task.estimated_hours && task.estimated_hours > 0
      ? Math.min(100, Math.round(((task.actual_hours ?? 0) / task.estimated_hours) * 100))
      : null;

  function handlePomodoro() {
    setTask(task!.id, task!.title);
    if (timerStatus === 'idle' || timerStatus === 'completed') startSession();
    onClose();
    navigate('/pomodoro');
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar painel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col border-l border-white/10 bg-[var(--arrow-bg-elevated)] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
              <div className="min-w-0">
                <p className="arrow-label">{statusLabel[task.status]}</p>
                <h2 className="text-lg font-bold text-foreground mt-1 leading-snug">
                  {task.important && (
                    <Star className="w-4 h-4 inline mr-1 text-amber-400 fill-amber-400" />
                  )}
                  {task.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {task.description && (
                <section>
                  <p className="arrow-label mb-1.5">Descrição</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                </section>
              )}

              <section className={`arrow-card border p-3 ${eisenhower.statClass}`}>
                <p className="arrow-label">Matriz de Eisenhower</p>
                <p className="text-sm font-semibold text-foreground mt-1">{eisenhower.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{eisenhower.subtitle}</p>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <InfoItem icon={Flag} label="Prioridade" value={priorityLabel[task.priority]} />
                <InfoItem
                  icon={Star}
                  label="Importante"
                  value={task.important ? 'Sim' : 'Não'}
                />
                {goalTitle && <InfoItem icon={Target} label="Meta" value={goalTitle} className="col-span-2" />}
                {dueKey && (
                  <InfoItem
                    icon={Timer}
                    label="Vencimento"
                    value={new Date(dueKey + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                    className="col-span-2"
                  />
                )}
                {pomodoros > 0 && (
                  <InfoItem icon={Play} label="Pomodoros" value={`${pomodoros} sessões`} />
                )}
                {(task.actual_hours ?? 0) > 0 && (
                  <InfoItem
                    icon={Timer}
                    label="Tempo real"
                    value={`${task.actual_hours!.toFixed(1)}h`}
                  />
                )}
                {task.estimated_hours != null && task.estimated_hours > 0 && (
                  <InfoItem
                    icon={Timer}
                    label="Estimado"
                    value={`${task.estimated_hours}h`}
                    className="col-span-2"
                  />
                )}
              </section>

              {progress !== null && (
                <section>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="p-5 border-t border-white/10 space-y-2">
              {task.status !== 'concluida' && (
                <button
                  type="button"
                  onClick={handlePomodoro}
                  className="w-full arrow-btn-primary flex items-center justify-center gap-2 py-2.5"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Pomodoro
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { onEdit(task); onClose(); }}
                  className="arrow-btn-secondary flex items-center justify-center gap-1.5 py-2 text-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                {task.status !== 'concluida' ? (
                  <button
                    type="button"
                    onClick={() => { onMove(task.id, 'concluida'); onClose(); }}
                    className="arrow-btn-secondary flex items-center justify-center gap-1.5 py-2 text-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Concluir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { onDelete(task.id); onClose(); }}
                    className="arrow-btn-secondary flex items-center justify-center gap-1.5 py-2 text-sm text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                )}
              </div>
              {task.status !== 'concluida' && (
                <button
                  type="button"
                  onClick={() => { onDelete(task.id); onClose(); }}
                  className="w-full text-xs text-red-400 hover:text-red-300 py-1"
                >
                  Excluir tarefa
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: typeof Flag;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white/5 border border-white/10 p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
