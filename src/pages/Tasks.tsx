import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, Grid2x2, CalendarDays } from 'lucide-react';
import { usePageContextMenu } from '@/contexts/DesktopContextMenuContext';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { TaskKanban } from '@/components/tasks/TaskKanban';
import { EisenhowerMatrix } from '@/components/tasks/EisenhowerMatrix';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import {
  getEisenhowerQuadrantFromFlags,
  getEisenhowerQuadrantInfo,
  normalizeDateKey,
} from '@/lib/task-views';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import type { Task, TaskStatus, TaskPriority } from '@/types/arrow';

type TaskView = 'kanban' | 'eisenhower' | 'calendar';

const views: { id: TaskView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'eisenhower', label: 'Eisenhower', icon: Grid2x2 },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
];

interface TaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  important: boolean;
  goal_id: string;
  estimated_hours: string;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-transparent';

const emptyForm: TaskForm = {
  title: '',
  description: '',
  priority: 'media',
  due_date: '',
  important: false,
  goal_id: '',
  estimated_hours: '',
};

export default function Tasks() {
  const navigate = useNavigate();
  const { setTask, startSession, status: timerStatus, taskId: activeTaskId } = useFocusTimer();
  const { tasks, byStatus, isLoading, createTask, moveTask, deleteTask, updateTask } = useTasks();
  const { goals } = useGoals({ status: 'ativo' });
  const [view, setView] = useState<TaskView>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);

  const goalMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of goals) map.set(g.id, g.title);
    return map;
  }, [goals]);

  const activeGoals = goals.filter((g) => g.status === 'ativo');

  const eisenhowerPreview = getEisenhowerQuadrantInfo(
    getEisenhowerQuadrantFromFlags(form.important, form.priority),
  );

  const viewingTask = viewingTaskId
    ? tasks.find((t) => t.id === viewingTaskId) ?? null
    : null;

  function resetForm() {
    setEditingTask(null);
    setForm(emptyForm);
  }

  usePageContextMenu(
    () => [
      {
        id: 'new-task',
        label: 'Nova tarefa',
        icon: Plus,
        onClick: () => {
          resetForm();
          setFormOpen(true);
        },
      },
      {
        id: 'view-kanban',
        label: 'Ver Kanban',
        icon: LayoutGrid,
        onClick: () => setView('kanban'),
      },
      {
        id: 'view-eisenhower',
        label: 'Ver Eisenhower',
        icon: Grid2x2,
        onClick: () => setView('eisenhower'),
      },
      {
        id: 'view-calendar',
        label: 'Ver calendário',
        icon: CalendarDays,
        onClick: () => setView('calendar'),
      },
    ],
    [view],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      due_date: form.due_date ? normalizeDateKey(form.due_date) ?? form.due_date : undefined,
      important: form.important,
      goal_id: form.goal_id || undefined,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
    };

    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, ...payload, goal_id: form.goal_id || null },
        { onSuccess: () => { setFormOpen(false); resetForm(); } },
      );
    } else {
      createTask.mutate(payload, {
        onSuccess: () => { setFormOpen(false); resetForm(); },
      });
    }
  }

  function handleView(task: Task) {
    setViewingTaskId(task.id);
    setDetailOpen(true);
  }

  function handlePomodoro(task: Task) {
    setTask(task.id, task.title);
    if (timerStatus === 'idle' || timerStatus === 'completed') startSession();
    navigate('/pomodoro');
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: normalizeDateKey(task.due_date) || '',
      important: task.important,
      goal_id: task.goal_id || '',
      estimated_hours: task.estimated_hours ? String(task.estimated_hours) : '',
    });
    setFormOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="arrow-spinner" />
      </div>
    );
  }

  const openCount = tasks.filter((t) => t.status !== 'concluida').length;
  const doneCount = byStatus.concluida?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Gerenciador de Tarefas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {openCount} abertas · {doneCount} concluídas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/5 border border-white/10">
            {views.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/8'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <Dialog
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <button type="button" className="arrow-btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nova Tarefa
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="arrow-label block mb-1.5">Título</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={inputClass}
                    placeholder="O que precisa fazer?"
                  />
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${inputClass} resize-none h-20`}
                  />
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Meta vinculada</label>
                  <select
                    value={form.goal_id}
                    onChange={(e) => setForm((f) => ({ ...f, goal_id: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Nenhuma meta</option>
                    {activeGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="arrow-label block mb-1.5">Prioridade</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                      className={inputClass}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="arrow-label block mb-1.5">Vencimento</label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Aparece no calendário quando preenchido
                    </p>
                  </div>
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Horas estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimated_hours}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_hours: e.target.value }))}
                    className={inputClass}
                    placeholder="Ex: 2"
                  />
                </div>

                <div className={`rounded-xl border p-3 ${eisenhowerPreview.statClass}`}>
                  <p className="arrow-label mb-2">Matriz de Eisenhower</p>
                  <label className="flex items-start gap-2 text-sm cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={form.important}
                      onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
                      className="rounded mt-0.5"
                    />
                    <span>
                      <span className="font-medium text-foreground">Importante</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Impacta suas metas principais — eixo vertical da matriz
                      </span>
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">Urgência</span> vem da prioridade:
                    alta e urgente = urgente; baixa e média = não urgente.
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    Quadrante: {eisenhowerPreview.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{eisenhowerPreview.subtitle}</p>
                </div>
                <button type="submit" className="w-full arrow-btn-primary">
                  {editingTask ? 'Salvar' : 'Criar Tarefa'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {view === 'kanban' && (
        <TaskKanban
          tasks={tasks}
          byStatus={byStatus}
          goalMap={goalMap}
          activeTaskId={activeTaskId}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          onMove={(id, status) => moveTask.mutate({ id, status })}
          onPomodoro={handlePomodoro}
        />
      )}

      {view === 'eisenhower' && (
        <EisenhowerMatrix tasks={tasks} goalMap={goalMap} onView={handleView} />
      )}

      {view === 'calendar' && (
        <TaskCalendar tasks={tasks} goalMap={goalMap} onView={handleView} />
      )}

      <TaskDetailPanel
        task={viewingTask}
        goalTitle={viewingTask?.goal_id ? goalMap.get(viewingTask.goal_id) : undefined}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setViewingTaskId(null); }}
        onEdit={handleEdit}
        onDelete={setDeleteId}
        onMove={(id, status) => moveTask.mutate({ id, status })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteTask.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
