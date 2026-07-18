import { Check, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { ExerciseLog, ExerciseSet } from '@/types/arrow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkoutCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseLogs: ExerciseLog[];
  duration: number;
  onDurationChange: (n: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: keyof ExerciseSet, value: number | boolean) => void;
  onToggleSetComplete: (exIdx: number, setIdx: number) => void;
  onAddSet: (exIdx: number) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onConfirm: () => void;
}

export default function WorkoutCompleteDialog({
  open,
  onOpenChange,
  exerciseLogs,
  duration,
  onDurationChange,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  onConfirm,
}: WorkoutCompleteDialogProps) {
  const { theme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Treino</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {exerciseLogs.map((log, exIdx) => (
            <div key={log.exercise_id || exIdx} className="rounded-xl p-3" style={{ background: theme.accentLight }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: theme.textPrimary }}>
                {log.name}
              </h4>
              <div className="space-y-1.5">
                {log.sets.map((set, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => onToggleSetComplete(exIdx, setIdx)}
                      className="p-0.5"
                      title={set.completed ? 'Série concluída' : 'Marcar série'}
                    >
                      {set.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Check className="w-4 h-4" style={{ color: theme.textMuted }} />
                      )}
                    </button>
                    <span className="w-6 text-xs" style={{ color: theme.textMuted }}>S{setIdx + 1}</span>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                      className="w-14 px-2 py-1 rounded border text-xs text-center"
                    />
                    <span className="text-xs" style={{ color: theme.textMuted }}>×</span>
                    <input
                      type="number"
                      step={0.5}
                      value={set.load_kg || 0}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'load_kg', Number(e.target.value))}
                      className="w-14 px-2 py-1 rounded border text-xs text-center"
                    />
                    <span className="text-xs" style={{ color: theme.textMuted }}>kg</span>
                    {log.sets.length > 1 && (
                      <button type="button" onClick={() => onRemoveSet(exIdx, setIdx)} className="p-1">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onAddSet(exIdx)}
                className="text-[10px] flex items-center gap-1 mt-2"
                style={{ color: theme.accent }}
              >
                <Plus className="w-3 h-3" /> Adicionar série
              </button>
            </div>
          ))}
          <div>
            <label className="arrow-label block mb-1.5">Duração (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border text-sm"
            />
          </div>
          <button
            type="button"
            onClick={onConfirm}
            className="arrow-btn-primary w-full flex items-center justify-center gap-2"
            style={{ color: theme.accentForeground }}
          >
            <CheckCircle2 className="w-4 h-4" /> Confirmar Treino
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
