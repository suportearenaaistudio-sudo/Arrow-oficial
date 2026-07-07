import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import {
  buildTasksByDate,
  getCalendarGrid,
  toDateKey,
  WEEKDAY_LABELS,
} from '@/lib/task-views';
import type { Task, TaskStatus } from '@/types/arrow';

const statusDot: Record<TaskStatus, string> = {
  a_fazer: 'bg-orange-400',
  em_andamento: 'bg-blue-400',
  revisao: 'bg-purple-400',
  concluida: 'bg-green-400',
};

const statusLabel: Record<TaskStatus, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  revisao: 'Revisão',
  concluida: 'Concluída',
};

interface TaskCalendarProps {
  tasks: Task[];
  goalMap: Map<string, string>;
  onView: (task: Task) => void;
}

export function TaskCalendar({ tasks, goalMap, onView }: TaskCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(() => toDateKey(new Date()));

  const tasksByDate = useMemo(() => buildTasksByDate(tasks), [tasks]);
  const tasksWithDue = tasks.filter((t) => t.due_date);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = getCalendarGrid(year, month);
  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedTasks = selectedDay ? tasksByDate.get(selectedDay) ?? [] : [];
  const todayKey = toDateKey(new Date());

  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 arrow-card border p-4 stat-card-blue">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="arrow-label">Calendário</p>
            <h3 className="text-lg font-bold text-foreground capitalize">{monthLabel}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tasksWithDue.length} tarefa{tasksWithDue.length !== 1 ? 's' : ''} com vencimento
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelectedDay(toDateKey(now));
              }}
              className="text-xs px-2.5 h-8 rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const key = toDateKey(date);
            const dayTasks = tasksByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-colors border min-h-[52px] ${
                  isSelected
                    ? 'bg-white/15 border-white/25 ring-1 ring-white/20'
                    : 'border-transparent hover:bg-white/8 hover:border-white/10'
                }`}
              >
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                    isToday ? 'bg-orange-500 text-black' : 'text-foreground'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-auto pb-0.5 px-0.5">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[t.status]}`}
                        title={t.title}
                      />
                    ))}
                    {dayTasks.length > 4 && (
                      <span className="text-[9px] text-muted-foreground leading-none">
                        +{dayTasks.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="arrow-card border p-4 stat-card-purple min-h-[320px] flex flex-col">
        <div className="mb-4 pb-3 border-b border-white/10">
          <p className="arrow-label">Dia selecionado</p>
          <h3 className="text-lg font-bold text-foreground mt-1 capitalize">
            {selectedDay
              ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : 'Selecione um dia'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedTasks.length} tarefa{selectedTasks.length !== 1 ? 's' : ''} com vencimento
          </p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-10">
              Nenhuma tarefa com vencimento neste dia.
              <br />
              <span className="text-muted-foreground/40">Defina a data de vencimento ao criar a tarefa.</span>
            </p>
          ) : (
            selectedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onView(task)}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusDot[task.status]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {task.important && (
                        <Star className="w-3 h-3 inline mr-1 text-amber-400 fill-amber-400" />
                      )}
                      {task.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{statusLabel[task.status]}</p>
                    {task.goal_id && goalMap.get(task.goal_id) && (
                      <p className="text-[10px] text-purple-300 mt-0.5 truncate">
                        {goalMap.get(task.goal_id)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
