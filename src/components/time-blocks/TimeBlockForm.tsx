import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import type { PlannedTimeBlock, TimeBlockType } from '@/types/time-blocks';
import { BLOCK_COLOR_PRESETS, TIME_BLOCK_META } from '@/types/time-blocks';
import { minToTimeStr, timeStrToMin } from '@/lib/time-blocks';
import PomodoroTaskPicker from '@/components/pomodoro/PomodoroTaskPicker';
import { useFocusTimer } from '@/contexts/FocusTimerContext';

interface TimeBlockFormProps {
  onAdd: (input: {
    startMin: number;
    endMin: number;
    tasks?: PlannedTimeBlock['tasks'];
    taskId?: string | null;
    taskTitle?: string | null;
    label?: string;
    type?: TimeBlockType;
    color?: string;
  }) => PlannedTimeBlock | null;
  onUpdate?: (
    blockId: string,
    patch: Partial<Pick<PlannedTimeBlock, 'startMin' | 'endMin' | 'label' | 'type' | 'tasks' | 'color'>>,
  ) => boolean;
  onCancelEdit?: () => void;
  editingBlock?: PlannedTimeBlock | null;
  blocks?: PlannedTimeBlock[];
  compact?: boolean;
}

const TYPES: TimeBlockType[] = ['focus', 'estrategico', 'buffer', 'escape'];

export default function TimeBlockForm({
  onAdd,
  onUpdate,
  onCancelEdit,
  editingBlock,
  blocks = [],
  compact,
}: TimeBlockFormProps) {
  const { theme } = useTheme();
  const { taskId, taskTitle } = useFocusTimer();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:30');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<TimeBlockType>('focus');
  const [color, setColor] = useState<string>(BLOCK_COLOR_PRESETS[0].color);

  const isEditing = !!editingBlock;

  useEffect(() => {
    if (editingBlock) {
      setOpen(true);
      setStart(minToTimeStr(editingBlock.startMin));
      setEnd(minToTimeStr(editingBlock.endMin));
      setLabel(editingBlock.label);
      setType(editingBlock.type);
      setColor(editingBlock.color ?? TIME_BLOCK_META[editingBlock.type].color);
    }
  }, [editingBlock]);

  function handleClose() {
    setOpen(false);
    setLabel('');
    setColor(BLOCK_COLOR_PRESETS[0].color);
    onCancelEdit?.();
  }

  function handleSubmit() {
    const startMin = timeStrToMin(start);
    const endMin = timeStrToMin(end);
    if (startMin === null || endMin === null || endMin <= startMin) {
      toast.error('Horário inválido');
      return;
    }

    const tasks = taskId ? [{ id: taskId, title: taskTitle || '' }] : editingBlock?.tasks ?? [];

    if (isEditing && editingBlock && onUpdate) {
      const ok = onUpdate(editingBlock.id, {
        startMin,
        endMin,
        label: label.trim() || taskTitle || 'Bloco de foco',
        type,
        color,
        tasks,
      });
      if (ok) {
        toast.success('Bloco atualizado');
        handleClose();
      } else {
        toast.error('Não foi possível atualizar o bloco');
      }
      return;
    }

    const block = onAdd({
      startMin,
      endMin,
      tasks,
      label: label.trim() || taskTitle || 'Bloco de foco',
      type,
      color,
    });

    if (!block) {
      toast.error('Não foi possível adicionar o bloco');
      return;
    }

    handleClose();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
        style={{
          background: 'var(--arrow-accent-light)',
          color: theme.accent,
          border: '1px solid var(--arrow-border)',
        }}
      >
        <Plus className="w-3.5 h-3.5" />
        Novo bloco
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-3 space-y-3 w-full"
      style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
          {isEditing ? 'Editar bloco' : 'Planejar bloco'}
        </p>
        <button type="button" onClick={handleClose} style={{ color: theme.textMuted }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px]" style={{ color: theme.textMuted }}>
          Início
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--arrow-bg-card)', border: '1px solid var(--arrow-border)', color: theme.textPrimary }}
          />
        </label>
        <label className="text-[10px]" style={{ color: theme.textMuted }}>
          Fim
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--arrow-bg-card)', border: '1px solid var(--arrow-border)', color: theme.textPrimary }}
          />
        </label>
      </div>

      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome do bloco (opcional)"
        className="w-full px-2 py-1.5 rounded-lg text-xs"
        style={{ background: 'var(--arrow-bg-card)', border: '1px solid var(--arrow-border)', color: theme.textPrimary }}
      />

      <PomodoroTaskPicker expanded={false} />

      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            title={TIME_BLOCK_META[t].description}
            className="px-2 py-1 rounded-lg text-[10px] font-medium"
            style={{
              background: type === t ? TIME_BLOCK_META[t].bg : 'transparent',
              color: type === t ? TIME_BLOCK_META[t].color : theme.textSecondary,
              border: `1px solid ${type === t ? TIME_BLOCK_META[t].color : 'var(--arrow-border)'}`,
            }}
          >
            {TIME_BLOCK_META[t].label}
          </button>
        ))}
      </div>
      <p className="text-[9px]" style={{ color: theme.textMuted }}>
        {TIME_BLOCK_META[type].description}
      </p>

      <div>
        <p className="text-[10px] mb-1.5" style={{ color: theme.textMuted }}>
          Cor do bloco
        </p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.color}
              type="button"
              title={preset.label}
              onClick={() => setColor(preset.color)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                background: preset.color,
                boxShadow:
                  color === preset.color
                    ? `0 0 0 2px #fff, 0 0 0 4px ${preset.color}`
                    : '0 1px 3px rgba(0,0,0,0.15)',
              }}
              aria-label={preset.label}
              aria-pressed={color === preset.color}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-2 rounded-xl text-xs font-semibold"
        style={{ background: theme.accent, color: theme.accentForeground }}
      >
        {isEditing ? 'Salvar alterações' : 'Adicionar à timeline'}
      </button>
    </div>
  );
}
