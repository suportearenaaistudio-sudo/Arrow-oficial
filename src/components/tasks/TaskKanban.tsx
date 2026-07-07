import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AlertTriangle, Clock } from 'lucide-react';
import { SortableTaskCard } from '@/components/tasks/SortableTaskCard';
import { TaskCardContent } from '@/components/tasks/TaskCardContent';
import { TASK_COLUMNS, toDateKey, normalizeDateKey } from '@/lib/task-views';
import type { Task, TaskStatus } from '@/types/arrow';

type BoardState = Record<TaskStatus, Task[]>;

const COLUMN_IDS = new Set<string>(['a_fazer', 'em_andamento', 'revisao', 'concluida']);

function cloneBoard(byStatus: BoardState): BoardState {
  return {
    a_fazer: [...byStatus.a_fazer],
    em_andamento: [...byStatus.em_andamento],
    revisao: [...byStatus.revisao],
    concluida: [...byStatus.concluida],
  };
}

function findColumn(board: BoardState, taskId: string): TaskStatus | null {
  for (const col of TASK_COLUMNS) {
    if (board[col.id].some((t) => t.id === taskId)) return col.id;
  }
  return null;
}

function findTask(board: BoardState, taskId: string): Task | null {
  for (const col of TASK_COLUMNS) {
    const task = board[col.id].find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}

interface TaskKanbanProps {
  tasks: Task[];
  byStatus: BoardState;
  goalMap: Map<string, string>;
  activeTaskId?: string | null;
  onMove: (id: string, status: TaskStatus) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPomodoro: (task: Task) => void;
}

function KanbanColumn({
  columnId,
  statClass,
  icon: Icon,
  iconColor,
  label,
  description,
  colTasks,
  share,
  totalOpen,
  overdue,
  tasks,
  goalMap,
  activeTaskId,
  onView,
  onEdit,
  onDelete,
  onMove,
  onPomodoro,
}: {
  columnId: TaskStatus;
  statClass: string;
  icon: (typeof TASK_COLUMNS)[0]['icon'];
  iconColor: string;
  label: string;
  description: string;
  colTasks: Task[];
  share: number;
  totalOpen: number;
  overdue: number;
  tasks: Task[];
  goalMap: Map<string, string>;
  activeTaskId?: string | null;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onPomodoro: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div className={`kanban-column border p-4 min-h-[380px] flex flex-col rounded-2xl ${statClass}`}
      style={{ background: 'var(--arrow-bg-card)', borderColor: 'var(--arrow-border)' }}
    >
      <div className="mb-4 pb-3 border-b border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
              <p className="arrow-label truncate">{label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1.5 leading-none">{colTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          {tasks.length > 0 && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white/10 text-muted-foreground flex-shrink-0">
              {share}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {columnId !== 'concluida' && totalOpen > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/10">
              {totalOpen} abertas no total
            </span>
          )}
          {overdue > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {overdue} atrasada{overdue > 1 ? 's' : ''}
            </span>
          )}
          {columnId === 'em_andamento' && colTasks.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Em foco
            </span>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-xl min-h-[120px] transition-colors ${
          isOver ? 'bg-white/8 ring-1 ring-white/15 p-1 -m-1' : ''
        }`}
      >
        <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {colTasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              columnId={columnId}
              goalTitle={task.goal_id ? goalMap.get(task.goal_id) : undefined}
              isActive={activeTaskId === task.id}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onPomodoro={onPomodoro}
              moveColumns={TASK_COLUMNS}
            />
          ))}
        </SortableContext>
        {colTasks.length === 0 && !isOver && (
          <p className="text-xs text-muted-foreground/60 text-center py-10">
            Nenhuma tarefa — arraste aqui
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskKanban({
  tasks,
  byStatus,
  goalMap,
  activeTaskId,
  onMove,
  onView,
  onEdit,
  onDelete,
  onPomodoro,
}: TaskKanbanProps) {
  const [board, setBoard] = useState<BoardState>(() => cloneBoard(byStatus));
  const [activeId, setActiveId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartColRef = useRef<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (!isDraggingRef.current) {
      setBoard(cloneBoard(byStatus));
    }
  }, [byStatus]);

  const activeTask = useMemo(
    () => (activeId ? findTask(board, activeId) : null),
    [activeId, board],
  );

  const activeColumn = useMemo(
    () => (activeId ? findColumn(board, activeId) : null),
    [activeId, board],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true;
    const taskId = String(event.active.id);
    dragStartColRef.current = findColumn(board, taskId);
    setActiveId(taskId);
  }, [board]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    const activeCol = findColumn(board, activeTaskId);
    let overCol: TaskStatus | null = COLUMN_IDS.has(overId) ? (overId as TaskStatus) : findColumn(board, overId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setBoard((prev) => {
      const next = cloneBoard(prev);
      const sourceList = [...next[activeCol]];
      const activeIndex = sourceList.findIndex((t) => t.id === activeTaskId);
      if (activeIndex < 0) return prev;

      const [moved] = sourceList.splice(activeIndex, 1);
      const destList = [...next[overCol!]];
      const overIndex = COLUMN_IDS.has(overId)
        ? destList.length
        : destList.findIndex((t) => t.id === overId);
      destList.splice(overIndex >= 0 ? overIndex : destList.length, 0, {
        ...moved,
        status: overCol!,
      });
      next[activeCol] = sourceList;
      next[overCol!] = destList;
      return next;
    });
  }, [board]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      isDraggingRef.current = false;
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        setBoard(cloneBoard(byStatus));
        return;
      }

      const taskId = String(active.id);
      const endCol = findColumn(board, taskId);
      const startCol = dragStartColRef.current;
      dragStartColRef.current = null;

      if (endCol && startCol && endCol !== startCol) {
        onMove(taskId, endCol);
      } else if (!endCol) {
        setBoard(cloneBoard(byStatus));
      }
    },
    [board, byStatus, onMove],
  );

  const handleDragCancel = useCallback(() => {
    isDraggingRef.current = false;
    setActiveId(null);
    setBoard(cloneBoard(byStatus));
  }, [byStatus]);

  const totalOpen = tasks.filter((t) => t.status !== 'concluida').length;
  const today = toDateKey(new Date());

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {TASK_COLUMNS.map((col) => {
          const colTasks = board[col.id] || [];
          const overdue = colTasks.filter((t) => {
            const key = normalizeDateKey(t.due_date);
            return key && key < today && t.status !== 'concluida';
          }).length;
          const share = tasks.length > 0 ? Math.round((colTasks.length / tasks.length) * 100) : 0;

          return (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              statClass={col.statClass}
              icon={col.icon}
              iconColor={col.iconColor}
              label={col.label}
              description={col.description}
              colTasks={colTasks}
              share={share}
              totalOpen={totalOpen}
              overdue={overdue}
              tasks={tasks}
              goalMap={goalMap}
              activeTaskId={activeTaskId}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onPomodoro={onPomodoro}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask && activeColumn ? (
          <div className="w-[220px]">
            <TaskCardContent
              task={activeTask}
              columnId={activeColumn}
              goalTitle={activeTask.goal_id ? goalMap.get(activeTask.goal_id) : undefined}
              isOverlay
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onPomodoro={onPomodoro}
              moveColumns={TASK_COLUMNS}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
