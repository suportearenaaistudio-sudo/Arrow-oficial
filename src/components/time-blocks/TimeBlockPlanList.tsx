import { Link } from 'react-router-dom';
import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlannedTimeBlock } from '@/types/time-blocks';
import { TIME_BLOCK_META } from '@/types/time-blocks';
import { blockFillPercent, minToTimeStr } from '@/lib/time-blocks';

interface TimeBlockPlanListProps {
  blocks: PlannedTimeBlock[];
  selectedId: string | null;
  activeBlockId?: string | null;
  liveFillMin?: number;
  onSelect: (id: string) => void;
  onEdit?: (block: PlannedTimeBlock) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
}

function blockInitial(block: PlannedTimeBlock): string {
  if (block.label?.trim()) return block.label.trim().charAt(0).toUpperCase();
  return 'B';
}

export default function TimeBlockPlanList({
  blocks,
  selectedId,
  activeBlockId,
  liveFillMin = 0,
  onSelect,
  onEdit,
  onRemove,
  onDuplicate,
  onMarkComplete,
}: TimeBlockPlanListProps) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--arrow-text-primary)' }}>
        Plano do dia
      </h3>
      {blocks.map((block) => {
        const meta = TIME_BLOCK_META[block.type];
        const isSelected = selectedId === block.id || activeBlockId === block.id;
        const extra = activeBlockId === block.id ? liveFillMin : 0;
        const fill = blockFillPercent(block, extra);

        return (
          <div
            key={block.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(block.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(block.id)}
            className="relative flex items-stretch rounded-xl overflow-hidden cursor-pointer transition-all hover:brightness-[1.02]"
            style={{
              background: 'var(--arrow-bg-elevated)',
              border: `1px solid ${isSelected ? meta.color : 'var(--arrow-border)'}`,
              boxShadow: isSelected ? `0 0 0 1px ${meta.color}33` : 'none',
            }}
          >
            <div className="flex items-center gap-3 flex-1 p-3 min-w-0">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: meta.bg, color: meta.color }}
              >
                {blockInitial(block)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--arrow-text-primary)' }}>
                  {block.label}
                </p>
                <p className="text-[10px] tabular-nums" style={{ color: 'var(--arrow-text-muted)' }}>
                  {minToTimeStr(block.startMin)} – {minToTimeStr(block.endMin)}
                </p>
                {block.taskId && (
                  <Link
                    to="/tasks"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-medium hover:underline"
                    style={{ color: meta.color }}
                  >
                    {block.taskTitle || 'Ver tarefa'} →
                  </Link>
                )}
              </div>
              <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: meta.color }}>
                {fill}%
              </span>
            </div>

            <div
              className="w-1 flex-shrink-0"
              style={{ background: meta.color }}
            />

            <div className="absolute bottom-0 left-12 right-4 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${fill}%`, background: meta.color }}
              />
            </div>

            <div className="absolute top-2 right-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="p-1 rounded-lg hover:bg-muted" style={{ color: 'var(--arrow-text-muted)' }}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(block)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(block.id)}>
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                  {onMarkComplete && (
                    <DropdownMenuItem onClick={() => onMarkComplete(block.id)}>
                      <Check className="w-3.5 h-3.5 mr-2" />
                      Marcar concluído
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onRemove(block.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
