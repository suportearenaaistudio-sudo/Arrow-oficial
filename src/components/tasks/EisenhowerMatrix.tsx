import { Star, Timer } from 'lucide-react';
import { EISENHOWER_QUADRANTS, getEisenhowerQuadrant } from '@/lib/task-views';
import type { Task, TaskPriority } from '@/types/arrow';

const priorityDot: Record<TaskPriority, string> = {
  baixa: 'bg-green-400',
  media: 'bg-yellow-400',
  alta: 'bg-orange-400',
  urgente: 'bg-red-400',
};

interface EisenhowerMatrixProps {
  tasks: Task[];
  goalMap: Map<string, string>;
  onView: (task: Task) => void;
}

export function EisenhowerMatrix({ tasks, goalMap, onView }: EisenhowerMatrixProps) {
  const openTasks = tasks.filter((t) => t.status !== 'concluida');

  const grouped = EISENHOWER_QUADRANTS.map((q) => ({
    ...q,
    tasks: openTasks.filter((t) => getEisenhowerQuadrant(t) === q.id),
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground font-medium">Importante</strong> = marca no formulário da tarefa.
        {' '}<strong className="text-foreground font-medium">Urgente</strong> = prioridade alta ou urgente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map((quadrant) => (
          <div
            key={quadrant.id}
            className={`arrow-card border p-4 min-h-[240px] flex flex-col ${quadrant.statClass}`}
          >
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="arrow-label">{quadrant.subtitle}</p>
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-lg font-bold text-foreground">{quadrant.title}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                  {quadrant.tasks.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{quadrant.action}</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px] pr-1">
              {quadrant.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-8">Nenhuma tarefa</p>
              ) : (
                quadrant.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onView(task)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {task.important && (
                            <Star className="w-3 h-3 inline mr-1 text-amber-400 fill-amber-400" />
                          )}
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {task.goal_id && goalMap.get(task.goal_id) && (
                            <span className="text-[10px] text-purple-300 truncate max-w-[120px]">
                              {goalMap.get(task.goal_id)}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Timer className="w-3 h-3" />
                              {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
