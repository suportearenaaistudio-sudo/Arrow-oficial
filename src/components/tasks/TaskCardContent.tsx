import {
  MoreHorizontal,
  Trash2,
  Edit2,
  CheckSquare,
  GripVertical,
  Target,
  Star,
  Play,
  Eye,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getPomodoroCount } from '@/lib/task-pomodoro';
import type { Task, TaskStatus, TaskPriority } from '@/types/arrow';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  baixa: { label: 'baixa', className: 'bg-green-500/15 text-green-400' },
  media: { label: 'média', className: 'bg-yellow-500/15 text-yellow-400' },
  alta: { label: 'alta', className: 'bg-orange-500/15 text-orange-400' },
  urgente: { label: 'urgente', className: 'bg-red-500/15 text-red-400' },
};

export interface TaskCardContentProps {
  task: Task;
  columnId: TaskStatus;
  goalTitle?: string;
  isActive?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onPomodoro: (task: Task) => void;
  moveColumns: { id: TaskStatus; label: string }[];
}

export function TaskCardContent({
  task,
  columnId,
  goalTitle,
  isActive,
  isOverlay,
  dragHandleProps,
  onView,
  onEdit,
  onDelete,
  onMove,
  onPomodoro,
  moveColumns,
}: TaskCardContentProps) {
  const pri = priorityConfig[task.priority];
  const pomodoros = getPomodoroCount(task.tags);

  return (
    <div
      className={`rounded-xl border bg-white/5 p-2.5 ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-orange-400/50 bg-[var(--arrow-bg-elevated)] cursor-grabbing'
          : 'hover:bg-white/8 transition-shadow'
      } ${isActive && !isOverlay ? 'ring-1 ring-orange-400/60' : 'border-white/10'}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...dragHandleProps}
          className="p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Arrastar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onView(task)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {task.important && (
              <Star className="w-3 h-3 inline mr-0.5 text-amber-400 fill-amber-400" />
            )}
            {task.title}
          </p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pri.className}`}>
              {pri.label}
            </span>
            {goalTitle && (
              <span className="text-[9px] text-purple-300 truncate max-w-[80px] flex items-center gap-0.5">
                <Target className="w-2.5 h-2.5 flex-shrink-0" />
                {goalTitle}
              </span>
            )}
            {pomodoros > 0 && (
              <span className="text-[9px] text-orange-300">🍅{pomodoros}</span>
            )}
          </div>
        </button>

        {!isOverlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded hover:bg-white/10 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onView(task)} className="gap-2 cursor-pointer text-xs">
                <Eye className="w-3.5 h-3.5" /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 cursor-pointer text-xs">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </DropdownMenuItem>
              {columnId !== 'concluida' && (
                <>
                  <DropdownMenuItem onClick={() => onPomodoro(task)} className="gap-2 cursor-pointer text-xs">
                    <Play className="w-3.5 h-3.5" /> Pomodoro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onMove(task.id, 'concluida')}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Concluir
                  </DropdownMenuItem>
                </>
              )}
              {moveColumns
                .filter((c) => c.id !== columnId)
                .map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => onMove(task.id, c.id)}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <GripVertical className="w-3.5 h-3.5" /> → {c.label}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
