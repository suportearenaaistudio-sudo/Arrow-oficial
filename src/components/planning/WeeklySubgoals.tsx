import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Target, Timer } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useTasks } from '@/hooks/useTasks';
import { loadAllSessions } from '@/lib/pomodoro-sessions';
import TaskQuickCreate from '@/components/planning/TaskQuickCreate';
import type { Goal, Task, WeeklySubgoal } from '@/types/arrow';

const fieldClass = 'rounded-xl border px-3 py-2 text-sm';

export default function WeeklySubgoals({
  cycleId,
  weekNumber,
  goals,
  tasks,
}: {
  cycleId: string;
  weekNumber: number;
  goals: Goal[];
  tasks: Task[];
}) {
  const queryClient = useQueryClient();
  const { updateTask } = useTasks();
  const key = ['weekly-subgoals', cycleId, weekNumber];
  const { data: subgoals = [] } = useQuery({
    queryKey: key,
    queryFn: () =>
      desktopAPI.db.weeklySubgoals.list(cycleId, weekNumber) as Promise<WeeklySubgoal[]>,
  });
  const cycleGoals = goals.filter(
    (goal) => goal.cycle_id === cycleId && goal.status === 'ativo',
  );
  const [subgoalTitle, setSubgoalTitle] = useState('');
  const [subgoalGoalId, setSubgoalGoalId] = useState('');
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    if (!subgoalGoalId && cycleGoals[0]) setSubgoalGoalId(cycleGoals[0].id);
  }, [cycleGoals, subgoalGoalId]);

  useEffect(() => {
    const update = () => setFocusTick((value) => value + 1);
    window.addEventListener('arrow-pomodoro-sessions-updated', update);
    return () => window.removeEventListener('arrow-pomodoro-sessions-updated', update);
  }, []);

  const completedByTask = useMemo(() => {
    const result = new Map<string, number>();
    loadAllSessions()
      .filter((session) => session.completed && session.mode === 'focus' && session.taskId)
      .forEach((session) =>
        result.set(session.taskId!, (result.get(session.taskId!) ?? 0) + 1),
      );
    return result;
  }, [focusTick]);

  function completedPomodoros(task: Task) {
    return (completedByTask.get(task.id) ?? 0) + (task.legacy_pomodoros_completed ?? 0);
  }

  function createSubgoal(event: React.FormEvent) {
    event.preventDefault();
    if (!subgoalTitle.trim() || !subgoalGoalId) return;
    void desktopAPI.db.weeklySubgoals
      .create({
        cycle_id: cycleId,
        week_number: weekNumber,
        goal_id: subgoalGoalId,
        title: subgoalTitle.trim(),
      })
      .then(() => {
        setSubgoalTitle('');
        queryClient.invalidateQueries({ queryKey: key });
      });
  }

  const groups: Array<{ id: string; title: string; parent?: string; tasks: Task[] }> = [
    ...subgoals.map((subgoal) => ({
      id: subgoal.id,
      title: subgoal.title,
      parent: goals.find((goal) => goal.id === subgoal.goal_id)?.title,
      tasks: tasks.filter((task) => task.weekly_subgoal_id === subgoal.id),
    })),
    {
      id: 'unlinked',
      title: 'Tarefas gerais da semana',
      parent: 'Sem submeta',
      tasks: tasks.filter((task) => !task.weekly_subgoal_id),
    },
  ];

  return (
    <section className="space-y-4">
      <TaskQuickCreate
        title={`Nova tarefa da Semana ${weekNumber}`}
        defaultDate={new Date().toISOString().slice(0, 10)}
        cycleId={cycleId}
        weekNumber={weekNumber}
        subgoals={subgoals}
      />

      <div className="arrow-card p-4">
        <div className="flex gap-2 items-center">
          <Target className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
          <div>
            <h3 className="text-sm font-semibold">Criar submeta semanal</h3>
            <p className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>
              Opcional. Use para agrupar tarefas sob uma meta do ciclo.
            </p>
          </div>
        </div>
        <form
          onSubmit={createSubgoal}
          className="mt-3 grid sm:grid-cols-[1fr_220px_auto] gap-2"
        >
          <input
            value={subgoalTitle}
            onChange={(event) => setSubgoalTitle(event.target.value)}
            placeholder="Ex.: entregar primeira versão"
            className={fieldClass}
          />
          <select
            value={subgoalGoalId}
            onChange={(event) => setSubgoalGoalId(event.target.value)}
            className={fieldClass}
          >
            <option value="">Meta do ciclo</option>
            {cycleGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <button className="arrow-btn-secondary text-sm" disabled={!cycleGoals.length}>
            Criar submeta
          </button>
        </form>
        {!cycleGoals.length && (
          <p className="text-xs text-amber-600 mt-2">
            Crie uma meta na aba Ciclo para usar submetas. Tarefas semanais continuam disponíveis.
          </p>
        )}
      </div>

      {groups.map((group) => {
        const planned = group.tasks.reduce(
          (sum, task) => sum + (task.pomodoros_planned ?? 0),
          0,
        );
        const done = group.tasks.reduce(
          (sum, task) => sum + completedPomodoros(task),
          0,
        );
        return (
          <div key={group.id} className="arrow-card p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{group.title}</p>
                <p className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>
                  {group.parent}
                </p>
              </div>
              <span
                className="text-xs flex items-center gap-1"
                style={{ color: 'var(--arrow-accent)' }}
              >
                <Timer className="w-3.5 h-3.5" />
                {done}/{planned}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {group.tasks.map((task) => {
                const completed = task.status === 'concluida';
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2.5"
                  >
                    <button
                      onClick={() =>
                        updateTask.mutate({
                          id: task.id,
                          status: completed ? 'a_fazer' : 'concluida',
                          completion_date: completed
                            ? undefined
                            : new Date().toISOString().slice(0, 10),
                        })
                      }
                    >
                      {completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4" style={{ color: 'var(--arrow-text-muted)' }} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm truncate ${completed ? 'line-through opacity-60' : ''}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>
                        {task.due_date
                          ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR')
                          : 'Sem data'}{' '}
                        · energia {task.energy_level ?? 'média'} · prioridade {task.priority}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>
                      {completedPomodoros(task)}/{task.pomodoros_planned ?? 0} 🍅
                    </span>
                  </div>
                );
              })}
              {!group.tasks.length && (
                <p className="text-xs py-2" style={{ color: 'var(--arrow-text-muted)' }}>
                  Nenhuma tarefa neste grupo.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
