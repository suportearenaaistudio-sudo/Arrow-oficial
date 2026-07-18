import { useTheme } from '@/contexts/ThemeContext';
import type { WorkoutFocus, WorkoutSplitType, WorkoutTrainingType } from '@/types/arrow';
import {
  FOCUS_OPTIONS,
  TRAINING_TYPE_OPTIONS,
  trainingUsesSplit,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from '@/lib/workout-config';
import RingDial from '@/components/ui/RingDial';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SPLIT_OPTIONS: WorkoutSplitType[] = ['AB', 'ABC', 'ABCD', 'ABCDE'];

export interface WorkoutWizardForm {
  name: string;
  training_type: WorkoutTrainingType;
  split_type: WorkoutSplitType;
  frequency_per_week: number;
  focus: WorkoutFocus;
  days_of_week: number[];
  duration_weeks: number;
  create_habit: boolean;
}

export const DEFAULT_WIZARD: WorkoutWizardForm = {
  name: '',
  training_type: 'academia',
  split_type: 'ABC',
  frequency_per_week: 4,
  focus: 'hipertrofia',
  days_of_week: [1, 3, 5],
  duration_weeks: 12,
  create_habit: true,
};

interface WorkoutProgramWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WorkoutWizardForm;
  setForm: React.Dispatch<React.SetStateAction<WorkoutWizardForm>>;
  onSubmit: (e: React.FormEvent) => void;
  onTrainingTypeChange: (type: WorkoutTrainingType) => void;
  onSplitChange: (split: WorkoutSplitType) => void;
  onFrequencyChange: (freq: number) => void;
  onToggleDay: (day: number) => void;
}

export default function WorkoutProgramWizard({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  onTrainingTypeChange,
  onSplitChange,
  onFrequencyChange,
  onToggleDay,
}: WorkoutProgramWizardProps) {
  const { theme, isDark } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[min(88vh,720px)] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b" style={{ borderColor: 'var(--arrow-border)' }}>
          <DialogTitle className="text-base">Novo Programa de Treino</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="arrow-label block mb-1">Nome do programa</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                placeholder="Ex: Hipertrofia 2026"
              />
            </div>

            <div
              className="grid grid-cols-2 gap-3 p-3 rounded-2xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}
            >
              <RingDial
                label="Duração"
                min={4}
                max={24}
                step={1}
                value={form.duration_weeks}
                onChange={(duration_weeks) => setForm((f) => ({ ...f, duration_weeks }))}
                color={theme.accent}
                formatValue={(v) => (
                  <>
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color: theme.accent }}>
                      {v}
                    </span>
                    <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
                      semanas
                    </span>
                  </>
                )}
              />
              <RingDial
                label="Frequência"
                min={1}
                max={7}
                step={1}
                value={form.frequency_per_week}
                onChange={onFrequencyChange}
                color={theme.accent}
                formatValue={(v) => (
                  <>
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color: theme.accent }}>
                      {v}×
                    </span>
                    <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
                      por semana
                    </span>
                  </>
                )}
              />
            </div>

            <div>
              <label className="arrow-label block mb-1.5">Tipo de treino</label>
              <div className="grid grid-cols-4 gap-1.5">
                {TRAINING_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = form.training_type === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onTrainingTypeChange(opt.id)}
                      className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-colors"
                      style={{
                        background: selected ? theme.accentLight : 'transparent',
                        border: `1.5px solid ${selected ? theme.accent : 'var(--arrow-border)'}`,
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: selected ? theme.accent : theme.textMuted }}
                      />
                      <span className="text-[9px] font-semibold leading-tight text-center">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {trainingUsesSplit(form.training_type) && (
              <div>
                <label className="arrow-label block mb-1.5">Divisão (split)</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SPLIT_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSplitChange(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        background: form.split_type === s ? theme.accent : theme.accentLight,
                        color: form.split_type === s ? '#fff' : theme.accent,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="arrow-label">Dias da semana</label>
                <span className="text-[10px] tabular-nums" style={{ color: theme.textMuted }}>
                  {form.days_of_week.length}/{form.frequency_per_week}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_ORDER.map((day) => {
                  const selected = form.days_of_week.includes(day);
                  const disabled =
                    !selected && form.days_of_week.length >= form.frequency_per_week;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => onToggleDay(day)}
                      disabled={disabled}
                      className="py-1.5 rounded-lg text-[10px] font-bold transition-opacity"
                      style={{
                        background: selected ? theme.accent : theme.accentLight,
                        color: selected ? '#fff' : theme.accent,
                        opacity: disabled ? 0.35 : 1,
                      }}
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="arrow-label block mb-1.5">Foco do treino</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FOCUS_OPTIONS.map((opt) => {
                  const FocusIcon = opt.icon;
                  const selected = form.focus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, focus: opt.id }))}
                      className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all"
                      style={{
                        background: selected ? theme.accentLight : 'transparent',
                        border: `1.5px solid ${selected ? theme.accent : 'var(--arrow-border)'}`,
                      }}
                    >
                      <FocusIcon
                        className="w-4 h-4"
                        style={{ color: selected ? theme.accent : theme.textMuted }}
                      />
                      <span className="text-[10px] font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="shrink-0 px-5 py-4 space-y-3 border-t"
            style={{ borderColor: 'var(--arrow-border)', background: 'var(--arrow-bg-elevated)' }}
          >
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: theme.textSecondary }}>
              <input
                type="checkbox"
                checked={form.create_habit}
                onChange={(e) => setForm((f) => ({ ...f, create_habit: e.target.checked }))}
              />
              Criar hábito vinculado ({form.frequency_per_week}× por semana)
            </label>
            <button type="submit" className="arrow-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold">
              Criar Programa
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
