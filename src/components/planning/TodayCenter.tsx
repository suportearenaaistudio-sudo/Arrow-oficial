import { useMemo, useState } from 'react';
import { Check, Circle, Clock3, Plus, Play, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDailyPlan } from '@/hooks/useDailyPlan';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { suggestNextFreeSlot, todayKey } from '@/lib/time-blocks';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { desktopAPI } from '@/lib/desktop-api';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import TaskQuickCreate from '@/components/planning/TaskQuickCreate';
import type { Task } from '@/types/arrow';

function dueScore(task: Task, today: string) {
  if (task.due_date && task.due_date < today) return 0;
  if (task.due_date === today) return 1;
  if (task.priority === 'urgente') return 2;
  if (task.priority === 'alta') return 3;
  return 4;
}

export default function TodayCenter() {
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86_400_000));
  const navigate = useNavigate();
  const { activeCycle } = useCycles();
  const { tasks, moveTask, updateTask } = useTasks();
  const { habits, toggleHabitDay } = useHabits();
  const { sessions } = useWorkouts();
  const { taskIds, plan, setTasks, setMit, setEnergy } = useDailyPlan(today);
  const { taskIds: yesterdayTaskIds } = useDailyPlan(yesterday);
  const { setTask, isSessionOpen, taskId: focusedTaskId, reset } = useFocusTimer();
  const { blocks, addBlock } = useTimeBlocks(today);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [yesterdayReviewed, setYesterdayReviewed] = useState(false);
  const selected = useMemo(() => taskIds.map((id) => tasks.find((task) => task.id === id)).filter(Boolean) as Task[], [taskIds, tasks]);
  const unfinishedYesterday = useMemo(() => yesterdayTaskIds.map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => !!task && task.status !== 'concluida'), [tasks, yesterdayTaskIds]);
  const suggestions = useMemo(() => tasks.filter((task) => task.status !== 'concluida' && !taskIds.includes(task.id))
    .sort((a, b) => dueScore(a, today) - dueScore(b, today)).slice(0, 6), [taskIds, tasks, today]);
  const mit = tasks.find((task) => task.id === plan?.mit_task_id);
  const todayHabits = habits.filter((habit) => {
    if (habit.frequency_type === 'diario') return true;
    if (habit.frequency_type === 'dias_especificos') return habit.days_of_week.includes(String(new Date().getDay()));
    return true;
  });
  const todayWorkout = sessions?.filter((session) => session.date === today && session.status !== 'feito') ?? [];

  const addTask = (id: string) => setTasks([...taskIds, id]);
  const removeTask = (id: string) => {
    setTasks(taskIds.filter((taskId) => taskId !== id));
    if (plan?.mit_task_id === id) setMit(null);
  };
  const moveToTomorrow = (task: Task) => {
    const tomorrow = todayKey(new Date(Date.now() + 86_400_000));
    updateTask.mutate({ id: task.id, due_date: tomorrow });
    removeTask(task.id);
    toast.success('Tarefa movida para amanhã');
  };
  const startFocus = (task: Task) => { setTask(task.id, task.title); navigate('/pomodoro'); };
  const allocateBlock = (task: Task) => {
    const slot = suggestNextFreeSlot(blocks, 50);
    if (!slot) return toast.error('Não há uma janela livre de 50 minutos hoje.');
    addBlock({ ...slot, tasks: [{ id: task.id, title: task.title }], label: task.title, type: 'focus' });
    toast.success('Bloco de foco criado para esta tarefa.');
  };
  const toggleTask = async (task: Task) => {
    if (task.status === 'concluida') return moveTask.mutate({ id: task.id, status: 'a_fazer' });
    if (isSessionOpen && focusedTaskId === task.id && !window.confirm('Há um Pomodoro ativo para esta tarefa. Encerrar o foco e concluir a tarefa?')) return;
    if (isSessionOpen && focusedTaskId === task.id) reset(true);
    await new Promise<void>((resolve, reject) => moveTask.mutate({ id: task.id, status: 'concluida' }, { onSuccess: () => resolve(), onError: reject }));
    await Promise.all(blocks.filter((block) => block.tasks.some((ref) => ref.id === task.id)).map((block) =>
      desktopAPI.db.timeBlocks.update({ id: block.id, filledMin: Math.max(1, block.endMin - block.startMin) }),
    ));
  };

  return <section className="space-y-4">
    <div className="flex items-end justify-between gap-4">
      <div><h2 className="text-lg font-bold" style={{ color: 'var(--arrow-text-primary)' }}>Hoje</h2>
        <p className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>Escolha pouco, execute bem e revise no fim do dia.</p></div>
      <div className="flex gap-2">
        <button onClick={() => { setCreateOpen((open) => !open); setPickerOpen(false); }} className="arrow-btn-primary text-xs flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Nova tarefa</button>
        <button onClick={() => { setPickerOpen((open) => !open); setCreateOpen(false); }} className="arrow-btn-secondary text-xs">Escolher existente</button>
      </div>
    </div>

    {createOpen && <TaskQuickCreate
      title="Nova tarefa para Hoje"
      defaultDate={today}
      cycleId={activeCycle?.id}
      weekNumber={activeCycle ? getCurrentWeek(activeCycle) : undefined}
      onCreated={(task) => {
        setTasks([...taskIds, task.id]);
        setCreateOpen(false);
      }}
    />}

    <div className="arrow-card p-3 flex items-center justify-between gap-3"><span className="text-sm font-medium">Energia disponível</span><div className="flex gap-1">{(['baixa', 'normal', 'alta'] as const).map((energy) => <button key={energy} onClick={() => setEnergy(energy)} className="text-xs px-2 py-1 rounded-lg capitalize" style={{ background: plan?.energy_level === energy ? 'var(--arrow-accent-light)' : 'transparent', color: plan?.energy_level === energy ? 'var(--arrow-accent)' : 'var(--arrow-text-muted)' }}>{energy}</button>)}</div></div>

    {pickerOpen && <div className="arrow-card p-3 space-y-2">
      <p className="arrow-label">Sugestões para hoje</p>
      {suggestions.length ? suggestions.map((task) => <button key={task.id} onClick={() => { addTask(task.id); setPickerOpen(false); }} className="w-full text-left p-2 rounded-lg hover:bg-black/5 text-sm flex justify-between gap-3">
        <span>{task.title}</span><span className="text-xs text-orange-500">{task.due_date && task.due_date < today ? 'Atrasada' : task.priority}</span>
      </button>) : <p className="text-xs text-gray-500">Nenhuma sugestão pendente.</p>}
    </div>}

    {unfinishedYesterday.length > 0 && !yesterdayReviewed && <div className="arrow-card p-3 border-amber-200 bg-amber-50/50">
      <p className="text-sm font-medium text-amber-800">Revisão de ontem: {unfinishedYesterday.length} tarefa(s) ficou(ram) pendente(s).</p>
      <div className="flex gap-2 mt-2"><button onClick={() => { setTasks([...taskIds, ...unfinishedYesterday.map((task) => task.id)]); setYesterdayReviewed(true); }} className="text-xs px-2 py-1 rounded bg-amber-500 text-white">Trazer para Hoje</button>
        <button onClick={() => setYesterdayReviewed(true)} className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800">Manter no plano semanal</button></div>
    </div>}

    <div className="arrow-card p-4" style={{ borderColor: mit ? 'var(--arrow-accent)' : undefined }}>
      <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} /><span className="text-sm font-semibold">MIT — tarefa mais importante</span></div>
      {mit ? <div className="flex justify-between items-center gap-3"><button className="text-left text-sm font-medium" onClick={() => startFocus(mit)}>{mit.title}</button><button onClick={() => setMit(null)} aria-label="Remover MIT"><X className="w-4 h-4" /></button></div>
        : selected.length ? <div className="flex flex-wrap gap-2">{selected.filter((task) => task.status !== 'concluida').map((task) => <button key={task.id} onClick={() => setMit(task.id, task.title)} className="text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-700">Definir “{task.title}”</button>)}</div>
        : <p className="text-xs text-gray-500">Selecione uma tarefa para definir seu foco principal.</p>}
    </div>

    <div className="arrow-card divide-y divide-gray-100">
      <div className="p-4 flex justify-between"><div><h3 className="font-semibold text-sm">Plano de execução</h3><p className="text-xs text-gray-500 mt-0.5">A ordem abaixo é a sua ordem do dia.</p></div><button onClick={() => navigate('/pomodoro')} className="text-xs text-orange-600 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Blocos & foco</button></div>
      {selected.length ? selected.map((task) => <div key={task.id} className="p-3 flex items-center gap-3">
        <button onClick={() => void toggleTask(task)} aria-label="Alternar conclusão"><Check className={`w-5 h-5 ${task.status === 'concluida' ? 'text-green-500' : 'text-gray-300'}`} /></button>
        <button onClick={() => navigate('/tasks')} className={`flex-1 text-left text-sm ${task.status === 'concluida' ? 'line-through text-gray-400' : ''}`}>{task.title}</button>
        {task.status !== 'concluida' && <><button onClick={() => allocateBlock(task)} className="p-1.5 text-blue-600" title="Alocar bloco"><Clock3 className="w-4 h-4" /></button><button onClick={() => startFocus(task)} className="p-1.5 text-orange-600" title="Iniciar foco"><Play className="w-4 h-4" /></button></>}
        {task.status !== 'concluida' && <button onClick={() => moveToTomorrow(task)} className="text-[10px] text-gray-500" title="Mover para amanhã">Amanhã</button>}
        <button onClick={() => removeTask(task.id)} className="p-1 text-gray-400" title="Voltar ao plano semanal"><X className="w-4 h-4" /></button>
      </div>) : <div className="p-6 text-center text-sm text-gray-500">Comece selecionando até três tarefas importantes.</div>}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="arrow-card p-4"><h3 className="font-semibold text-sm mb-3">Hábitos de hoje</h3>{todayHabits.slice(0, 4).map((habit) => {
        const done = habit.completion_history?.some((entry) => entry.date === today && entry.completed);
        return <button key={habit.id} onClick={() => toggleHabitDay.mutate({ habit, date: today })} className="w-full flex items-center gap-2 py-1.5 text-left text-sm"><Circle className={`w-4 h-4 ${done ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />{habit.title}</button>;
      })}{!todayHabits.length && <p className="text-xs text-gray-500">Nenhum hábito ativo.</p>}</div>
      <div className="arrow-card p-4"><h3 className="font-semibold text-sm mb-2">Treino</h3>{todayWorkout.length ? <button onClick={() => navigate('/workouts')} className="text-sm text-orange-600">{todayWorkout.length} sessão(ões) pendente(s) hoje</button> : <p className="text-xs text-gray-500">Nenhum treino pendente hoje.</p>}</div>
    </div>
  </section>;
}
