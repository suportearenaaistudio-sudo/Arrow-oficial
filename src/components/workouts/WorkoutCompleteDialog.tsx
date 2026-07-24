import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ExerciseResultDraft { exercise_id?: string; name: string; load_kg: number; reps: number; rpe: number; completed: boolean; }

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void; results: ExerciseResultDraft[];
  duration: number; notes: string; onDurationChange: (n: number) => void; onNotesChange: (text: string) => void;
  onResultChange: (index: number, field: keyof ExerciseResultDraft, value: number | boolean) => void; onConfirm: () => void;
}

export default function WorkoutCompleteDialog({ open, onOpenChange, results, duration, notes, onDurationChange, onNotesChange, onResultChange, onConfirm }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Registrar treino realizado</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Registre o resultado depois da academia. Uma carga por exercício — sem séries, cronômetro ou execução ao vivo.</p>
      <div className="space-y-3 mt-3">
        {results.map((result, index) => <div key={`${result.exercise_id}-${index}`} className="rounded-xl border p-3 grid grid-cols-[minmax(120px,1fr)_70px_70px_70px_34px] gap-2 items-end">
          <div><p className="text-sm font-semibold">{result.name}</p><p className="text-[10px] text-muted-foreground">resultado do exercício</p></div>
          <label className="text-xs">Carga<input type="number" min="0" step="0.5" value={result.load_kg || ''} onChange={(e) => onResultChange(index, 'load_kg', Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" placeholder="kg" /></label>
          <label className="text-xs">Reps<input type="number" min="0" value={result.reps || ''} onChange={(e) => onResultChange(index, 'reps', Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" /></label>
          <label className="text-xs">RPE<input type="number" min="1" max="10" step="0.5" value={result.rpe || ''} onChange={(e) => onResultChange(index, 'rpe', Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" /></label>
          <label className="flex justify-center pb-1"><input type="checkbox" checked={result.completed} onChange={(e) => onResultChange(index, 'completed', e.target.checked)} aria-label={`Concluiu ${result.name}`} /></label>
        </div>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-sm">Duração (min)<input type="number" min="0" value={duration || ''} onChange={(e) => onDurationChange(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" /></label><label className="text-sm">Observações<textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 min-h-10" placeholder="Como foi o treino?" /></label></div>
        <button type="button" onClick={onConfirm} className="arrow-btn-primary w-full flex justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Salvar registro</button>
      </div>
    </DialogContent>
  </Dialog>;
}
