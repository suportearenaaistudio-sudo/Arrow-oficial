import { Link } from 'react-router-dom';
import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlannedTimeBlock } from '@/types/time-blocks';
import { blockBarColors, blockFillPercent, minToTimeStr, normalizeBlock, resolveBlockColor } from '@/lib/time-blocks';

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
        const blockColor = resolveBlockColor(block);
        const { track } = blockBarColors(blockColor);
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
              border: `1px solid ${isSelected ? blockColor : 'var(--arrow-border)'}`,
              boxShadow: isSelected ? `0 0 0 1px ${blockColor}33` : 'none',
            }}
          >
            <div className="flex items-center gap-3 flex-1 p-3 min-w-0">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: track, color: blockColor }}
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
                {normalizeBlock(block).tasks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {normalizeBlock(block).tasks.map((t) => (
                      <Link
                        key={t.id}
                        to="/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-md hover:underline"
                        style={{ background: `${blockColor}18`, color: blockColor }}
                      >
                        {t.title || 'Tarefa'}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: blockColor }}>
                {fill}%
              </span>
            </div>

            <div
              className="w-1 flex-shrink-0"
              style={{ background: blockColor }}
            />

            <div className="absolute bottom-0 left-12 right-4 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${fill}%`, background: blockColor }}
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
