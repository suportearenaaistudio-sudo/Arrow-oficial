import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskPriority, WeeklySubgoal } from '@/types/arrow';

type Energy = 'leve' | 'media' | 'alta';

export default function TaskQuickCreate({
  title,
  defaultDate,
  cycleId,
  weekNumber,
  subgoals = [],
  onCreated,
}: {
  title: string;
  defaultDate: string;
  cycleId?: string;
  weekNumber?: number;
  subgoals?: WeeklySubgoal[];
  onCreated?: (task: Task) => void;
}) {
  const { createTask } = useTasks();
  const [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [pomodoros, setPomodoros] = useState(1);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [energy, setEnergy] = useState<Energy>('media');
  const [subgoalId, setSubgoalId] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const subgoal = subgoals.find((item) => item.id === subgoalId);
    createTask.mutate(
      {
        title: name.trim(),
        description: description.trim() || undefined,
        due_date: date || undefined,
        status: 'a_fazer',
        priority,
        important: priority === 'urgente',
        actual_hours: 0,
        progress_percentage: 0,
        tags: [],
        subtasks: [],
        comments: [],
        attachments: [],
        cycle_id: cycleId,
        week_number: weekNumber,
        goal_id: subgoal?.goal_id,
        weekly_subgoal_id: subgoal?.id,
        pomodoros_planned: Math.max(0, pomodoros),
        energy_level: energy,
      } as Partial<Task>,
      {
        onSuccess: (task) => {
          setName('');
          setDescription('');
          setPomodoros(1);
          setPriority('media');
          setEnergy('media');
          setSubgoalId('');
          setAdvanced(false);
          onCreated?.(task);
        },
      },
    );
  }

  return (
    <div className="arrow-card p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
            Preencha o essencial. O restante é opcional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdvanced((current) => !current)}
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--arrow-text-muted)' }}
        >
          {advanced ? 'Menos opções' : 'Mais opções'}
          {advanced ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-[minmax(180px,1fr)_150px_105px_auto] gap-2">
          <input
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome da tarefa"
            aria-label="Nome da tarefa"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Data da tarefa"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <label className="relative">
            <input
              type="number"
              min={0}
              max={99}
              value={pomodoros}
              onChange={(event) => setPomodoros(Number(event.target.value))}
              aria-label="Pomodoros planejados"
              className="w-full rounded-xl border px-3 py-2 pr-7 text-sm"
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              title="Pomodoros"
            >
              🍅
            </span>
          </label>
          <button
            className="arrow-btn-primary text-sm whitespace-nowrap"
            disabled={createTask.isPending}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Criar
          </button>
        </div>

        {advanced && (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t"
            style={{ borderColor: 'var(--arrow-border)' }}
          >
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrição opcional"
              aria-label="Descrição"
              className="rounded-xl border px-3 py-2 text-sm lg:col-span-2"
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              aria-label="Prioridade"
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="baixa">Prioridade baixa</option>
              <option value="media">Prioridade média</option>
              <option value="alta">Prioridade alta</option>
              <option value="urgente">Urgente</option>
            </select>
            <select
              value={energy}
              onChange={(event) => setEnergy(event.target.value as Energy)}
              aria-label="Energia necessária"
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="leve">Energia leve</option>
              <option value="media">Energia média</option>
              <option value="alta">Energia alta</option>
            </select>
            {subgoals.length > 0 && (
              <select
                value={subgoalId}
                onChange={(event) => setSubgoalId(event.target.value)}
                aria-label="Submeta"
                className="rounded-xl border px-3 py-2 text-sm lg:col-span-2"
              >
                <option value="">Sem submeta</option>
                {subgoals.map((subgoal) => (
                  <option key={subgoal.id} value={subgoal.id}>
                    {subgoal.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
