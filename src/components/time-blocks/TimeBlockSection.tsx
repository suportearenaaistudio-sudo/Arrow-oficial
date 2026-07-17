import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { suggestNextFreeSlot } from '@/lib/time-blocks';
import TimeBlockGantt from '@/components/time-blocks/TimeBlockGantt';
import TimeBlockPlanList from '@/components/time-blocks/TimeBlockPlanList';
import TimeBlockEfficiency from '@/components/time-blocks/TimeBlockEfficiency';
import TimeBlockForm from '@/components/time-blocks/TimeBlockForm';

interface TimeBlockSectionProps {
  compact?: boolean;
}

export default function TimeBlockSection({ compact }: TimeBlockSectionProps) {
  const {
    isSessionOpen,
    status,
    activeBlockId,
    remainingSecs,
    totalSecs,
    taskId,
    taskTitle,
    durationMin,
    setActiveBlockId,
    setTask,
  } = useFocusTimer();

  const {
    blocks,
    selectedId,
    selectedBlock,
    dayProgress,
    setSelectedId,
    addBlock,
    removeBlock,
    duplicateBlock,
    markComplete,
    updateBlock,
  } = useTimeBlocks();

  const [editingBlock, setEditingBlock] = useState<typeof selectedBlock>(null);

  const liveFillMin =
    isSessionOpen && status === 'active' && totalSecs > 0
      ? (totalSecs - remainingSecs) / 60
      : 0;

  const effectiveSelected = selectedId ?? activeBlockId;

  function handleSelect(id: string) {
    setSelectedId(id);
    setActiveBlockId(id);
    const block = blocks.find((b) => b.id === id);
    if (block?.taskId) setTask(block.taskId, block.taskTitle);
  }

  function handleSuggestFromTask() {
    const slot = suggestNextFreeSlot(blocks, durationMin);
    if (!slot) {
      toast.error('Sem horário livre na timeline de hoje');
      return;
    }
    const block = addBlock({
      startMin: slot.startMin,
      endMin: slot.endMin,
      taskId,
      taskTitle,
      label: taskTitle || 'Bloco de foco',
      type: 'focus',
    });
    if (block) {
      setActiveBlockId(block.id);
      toast.success('Bloco criado a partir da tarefa ativa');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--arrow-text-primary)' }}>
            Time Blocks
          </h2>
          {!compact && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
              Timeline do dia — preenche com sessões de foco
            </p>
          )}
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--arrow-accent)' }}>
          {dayProgress}%
        </span>
      </div>

      <div className="space-y-4">
        <TimeBlockGantt
          blocks={blocks}
          selectedId={effectiveSelected}
          activeBlockId={activeBlockId}
          liveFillMin={liveFillMin}
          onSelect={handleSelect}
          period="day"
          compact={compact}
        />
        <TimeBlockGantt
          blocks={blocks}
          selectedId={effectiveSelected}
          activeBlockId={activeBlockId}
          liveFillMin={liveFillMin}
          onSelect={handleSelect}
          period="night"
          compact={compact}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <TimeBlockForm
          onAdd={addBlock}
          compact={compact}
          editingBlock={editingBlock}
          onUpdate={updateBlock}
          onCancelEdit={() => setEditingBlock(null)}
          blocks={blocks}
        />
        {!compact && taskTitle && (
          <button
            type="button"
            onClick={handleSuggestFromTask}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: 'var(--arrow-accent-light)',
              color: 'var(--arrow-accent)',
              border: '1px solid var(--arrow-border)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bloco da tarefa ativa
          </button>
        )}
      </div>

      {!compact && (
        <>
          <TimeBlockPlanList
            blocks={blocks}
            selectedId={effectiveSelected}
            activeBlockId={activeBlockId}
            liveFillMin={liveFillMin}
            onSelect={handleSelect}
            onEdit={setEditingBlock}
            onRemove={removeBlock}
            onDuplicate={(id) => {
              const copy = duplicateBlock(id);
              if (copy) toast.success('Bloco duplicado');
              else toast.error('Não foi possível duplicar — conflito de horário');
            }}
            onMarkComplete={(id) => {
              markComplete(id);
              toast.success('Bloco marcado como concluído');
            }}
          />

          <TimeBlockEfficiency blocks={blocks} />
        </>
      )}

      {compact && <TimeBlockEfficiency blocks={blocks} compact />}
    </div>
  );
}
