import { useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { WorkoutCheckin } from '@/types/arrow';

export default function WorkoutCheckinDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (checkin: Omit<WorkoutCheckin, 'id' | 'session_id'>) => void }) {
  const [values, setValues] = useState({ energy: 3, sleep_quality: 3, pain_level: 1, fatigue_level: 2, performance_drop: false, available_minutes: 60, notes: '' });
  const field = (key: 'energy' | 'sleep_quality' | 'pain_level' | 'fatigue_level', label: string) => <label className="text-sm flex items-center justify-between gap-3">{label}<select value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="rounded-lg border px-2 py-1 text-sm">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex gap-2 items-center"><Activity className="w-4 h-4 text-orange-500" /> Check-in pré-treino</DialogTitle></DialogHeader>
    <div className="space-y-3 mt-2">{field('energy', 'Energia')}{field('sleep_quality', 'Qualidade do sono')}{field('pain_level', 'Dor/desconforto')}{field('fatigue_level', 'Fadiga')}
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={values.performance_drop} onChange={(event) => setValues((current) => ({ ...current, performance_drop: event.target.checked }))} /> Percebi queda de desempenho</label>
      {values.performance_drop && <p className="text-xs p-2 rounded-lg bg-amber-50 text-amber-800 flex gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> O Arrow pode programar recuperação conforme o programa.</p>}
      <label className="text-sm block">Tempo disponível <input type="number" min={10} value={values.available_minutes} onChange={(event) => setValues((current) => ({ ...current, available_minutes: Number(event.target.value) }))} className="ml-2 w-20 rounded border px-2 py-1" /> min</label>
      <textarea value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Observações opcionais" className="w-full rounded-xl border p-2 text-sm" rows={2} />
      <button onClick={() => onConfirm(values)} className="arrow-btn-primary w-full">Salvar check-in</button>
    </div></DialogContent></Dialog>;
}
