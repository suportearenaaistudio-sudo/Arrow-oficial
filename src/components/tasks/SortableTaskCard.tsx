import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCardContent, type TaskCardContentProps } from '@/components/tasks/TaskCardContent';
import type { Task } from '@/types/arrow';

type SortableTaskCardProps = Omit<TaskCardContentProps, 'dragHandleProps' | 'isOverlay'> & {
  task: Task;
};

export function SortableTaskCard(props: SortableTaskCardProps) {
  const { task } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: props.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent {...props} dragHandleProps={listeners} />
    </div>
  );
}
