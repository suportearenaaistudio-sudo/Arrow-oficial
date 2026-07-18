import { Copy, GripVertical, Trash2 } from 'lucide-react';
import type { WorkoutExercise } from '@/types/arrow';

interface ExercisePrescriptionRowProps {
  exercise: WorkoutExercise;
  onChange: (patch: Partial<WorkoutExercise>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  compact?: boolean;
}

export default function ExercisePrescriptionRow({
  exercise,
  onChange,
  onRemove,
  onDuplicate,
  compact,
}: ExercisePrescriptionRowProps) {
  return (
    <div
      className={`grid gap-2 items-end ${compact ? 'grid-cols-[1fr_auto]' : 'grid-cols-[auto_1fr_repeat(4,minmax(0,3.5rem))_auto]'}`}
      style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
    >
      {!compact && (
        <div className="flex items-center justify-center px-1 py-2 opacity-40">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      <label className={`${compact ? 'col-span-2' : ''} px-2 pt-2`}>
        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--arrow-text-muted)' }}>
          Exercício
        </span>
        <input
          value={exercise.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nome do exercício"
          className="mt-0.5 w-full px-2 py-1.5 rounded-lg text-xs border"
        />
      </label>
      {!compact && (
        <>
          <label className="px-1 pt-2">
            <span className="text-[9px] uppercase" style={{ color: 'var(--arrow-text-muted)' }}>Séries</span>
            <input
              type="number"
              min={1}
              max={20}
              value={exercise.default_sets ?? 3}
              onChange={(e) => onChange({ default_sets: Number(e.target.value) })}
              className="mt-0.5 w-full px-1 py-1.5 rounded-lg text-xs border text-center"
            />
          </label>
          <label className="px-1 pt-2">
            <span className="text-[9px] uppercase" style={{ color: 'var(--arrow-text-muted)' }}>Reps</span>
            <input
              type="number"
              min={1}
              max={100}
              value={exercise.default_reps ?? 10}
              onChange={(e) => onChange({ default_reps: Number(e.target.value) })}
              className="mt-0.5 w-full px-1 py-1.5 rounded-lg text-xs border text-center"
            />
          </label>
          <label className="px-1 pt-2">
            <span className="text-[9px] uppercase" style={{ color: 'var(--arrow-text-muted)' }}>Kg</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={exercise.default_load_kg ?? ''}
              onChange={(e) => onChange({ default_load_kg: e.target.value ? Number(e.target.value) : undefined })}
              className="mt-0.5 w-full px-1 py-1.5 rounded-lg text-xs border text-center"
              placeholder="—"
            />
          </label>
          <label className="px-1 pt-2">
            <span className="text-[9px] uppercase" style={{ color: 'var(--arrow-text-muted)' }}>Desc</span>
            <input
              type="number"
              min={0}
              step={15}
              value={exercise.rest_seconds ?? 90}
              onChange={(e) => onChange({ rest_seconds: Number(e.target.value) })}
              className="mt-0.5 w-full px-1 py-1.5 rounded-lg text-xs border text-center"
            />
          </label>
        </>
      )}
      <div className="flex items-center gap-1 px-2 pb-2">
        <button type="button" onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-muted" title="Duplicar">
          <Copy className="w-3.5 h-3.5" style={{ color: 'var(--arrow-text-muted)' }} />
        </button>
        <button type="button" onClick={onRemove} className="p-1.5 rounded-lg hover:bg-muted" title="Remover">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}
