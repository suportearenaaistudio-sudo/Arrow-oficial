import { Plus, TrendingUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { WorkoutExercise, WorkoutTemplate } from '@/types/arrow';
import { defaultExercisesForFocus } from '@/lib/workout-config';
import ExercisePrescriptionRow from '@/components/workouts/ExercisePrescriptionRow';

interface WorkoutTemplateEditorProps {
  templates: WorkoutTemplate[];
  programFocus?: string;
  editingTemplateId: string | null;
  onEditTemplate: (id: string | null) => void;
  onUpdateTemplate: (id: string, patch: Partial<WorkoutTemplate>) => void;
  onProgressExercise: (name: string, id?: string) => void;
}

export default function WorkoutTemplateEditor({
  templates,
  programFocus,
  editingTemplateId,
  onEditTemplate,
  onUpdateTemplate,
  onProgressExercise,
}: WorkoutTemplateEditorProps) {
  const { theme } = useTheme();

  function updateExercise(template: WorkoutTemplate, exerciseId: string, patch: Partial<WorkoutExercise>) {
    const exercises = (template.exercises || []).map((ex) =>
      ex.id === exerciseId ? { ...ex, ...patch } : ex,
    );
    onUpdateTemplate(template.id, { exercises });
  }

  function addExercise(template: WorkoutTemplate) {
    const focus = (programFocus as 'forca' | 'hipertrofia' | 'resistencia') || 'hipertrofia';
    const defs = defaultExercisesForFocus(focus);
    const newEx: WorkoutExercise = {
      id: crypto.randomUUID(),
      name: 'Novo exercício',
      ...defs,
    };
    onUpdateTemplate(template.id, { exercises: [...(template.exercises || []), newEx] });
  }

  return (
    <div className="arrow-card p-5">
      <h3 className="font-semibold mb-4" style={{ color: theme.textPrimary }}>
        Treinos do Programa
      </h3>
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-xl p-4"
            style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: theme.accent, color: theme.accentForeground }}
                >
                  {template.label}
                </span>
                {editingTemplateId === template.id ? (
                  <input
                    defaultValue={template.name}
                    onBlur={(e) => {
                      onUpdateTemplate(template.id, { name: e.target.value });
                      onEditTemplate(null);
                    }}
                    className="text-sm font-semibold bg-transparent border-b outline-none flex-1"
                    autoFocus
                  />
                ) : (
                  <h4 className="font-semibold text-sm truncate" style={{ color: theme.textPrimary }}>
                    {template.name}
                  </h4>
                )}
                <button type="button" onClick={() => onEditTemplate(template.id)} className="text-[10px] shrink-0" style={{ color: theme.accent }}>
                  editar
                </button>
              </div>
              {template.exercises?.[0] && (
                <button type="button" onClick={() => onProgressExercise(template.exercises[0].name, template.exercises[0].id)}>
                  <TrendingUp className="w-4 h-4" style={{ color: theme.accent }} />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {(template.exercises || []).map((ex) => (
                <div key={ex.id} className="flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <ExercisePrescriptionRow
                      exercise={ex}
                      onChange={(patch) => updateExercise(template, ex.id, patch)}
                      onRemove={() =>
                        onUpdateTemplate(template.id, {
                          exercises: template.exercises.filter((item) => item.id !== ex.id),
                        })
                      }
                      onDuplicate={() => {
                        const copy = { ...ex, id: crypto.randomUUID(), name: `${ex.name} (cópia)` };
                        const idx = template.exercises.findIndex((item) => item.id === ex.id);
                        const next = [...template.exercises];
                        next.splice(idx + 1, 0, copy);
                        onUpdateTemplate(template.id, { exercises: next });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onProgressExercise(ex.name, ex.id)}
                    className="p-2 mt-1"
                    title="Ver evolução"
                  >
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addExercise(template)}
              className="text-xs flex items-center gap-1 mt-2"
              style={{ color: theme.accent }}
            >
              <Plus className="w-3 h-3" /> Adicionar exercício
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
