import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Plus, TrendingUp, Calendar, Edit2, CheckCircle2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import type { Goal } from '@/types/arrow';

const categoryLabels: Record<string, string> = {
  pessoal: 'Pessoal', profissional: 'Profissional', saude: 'Saude', financeiro: 'Financeiro',
  educacao: 'Educacao', relacionamentos: 'Relacionamentos', criatividade: 'Criatividade', viagem: 'Viagem',
};

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal } = useGoals();
  const { showSuccess } = useNotification();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateValue, setUpdateValue] = useState(0);

  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Target className="w-16 h-16 text-gray-200 mb-4" />
        <p className="text-gray-400">Meta não encontrada</p>
        <button onClick={() => navigate('/goals')} className="mt-4 arrow-btn-secondary text-sm">Voltar para Metas</button>
      </div>
    );
  }

  const progress = goal.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;

  function handleProgressUpdate(e: React.FormEvent) {
    e.preventDefault();
    const newValue = goal.current_value + updateValue;
    const updates: Partial<Goal> = { current_value: newValue };
    if (goal.target_value && newValue >= goal.target_value) {
      updates.status = 'concluido';
    }
    updateGoal.mutate({ id: goal.id, ...updates }, {
      onSuccess: () => {
        setUpdateOpen(false);
        setUpdateValue(0);
        if (updates.status === 'concluido') showSuccess('Meta concluida!');
        else showSuccess('Progresso atualizado!');
      },
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Back */}
      <button onClick={() => navigate('/goals')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Metas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Card */}
          <div className="arrow-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-sm text-gray-500">{categoryLabels[goal.category] || goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}</span>
                <h1 className="text-2xl font-bold text-gray-800 mt-1">{goal.title}</h1>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                goal.status === 'ativo' ? 'bg-green-100 text-green-700' :
                goal.status === 'concluido' ? 'bg-blue-100 text-blue-700' :
                goal.status === 'pausado' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </span>
            </div>
            {goal.description && <p className="text-sm text-gray-500 mb-4">{goal.description}</p>}

            {/* Progress */}
            {goal.goal_type === 'quantitativa' && goal.target_value > 0 && (
              <div className="bg-gray-50/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso</span>
                  <span className="text-lg font-bold arrow-gradient-text">{progress}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-3 mb-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Atual: {goal.current_value}</span>
                  <span>Meta: {goal.target_value}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-goals */}
          <div className="arrow-card p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Sub-metas
            </h3>
            {(goal.sub_goals || []).length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma sub-meta criada ainda</p>
            ) : (
              <div className="space-y-2">
                {goal.sub_goals.map((sg) => (
                  <div key={sg.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sg.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {sg.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${sg.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{sg.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="arrow-card p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Marcos
            </h3>
            {(goal.milestones || []).length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum marco definido ainda</p>
            ) : (
              <div className="space-y-2">
                {goal.milestones.map((ms) => (
                  <div key={ms.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                    <div className={`w-5 h-5 rounded-full ${ms.completed ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    <div className="flex-1">
                      <span className={`text-sm ${ms.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{ms.title}</span>
                      {ms.target_value && <span className="text-xs text-gray-400 ml-2">({ms.target_value})</span>}
                    </div>
                    {ms.completed_date && <span className="text-[10px] text-gray-400">{new Date(ms.completed_date).toLocaleDateString('pt-BR')}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="arrow-card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Ações</h3>
            <div className="space-y-2">
              <button onClick={() => setUpdateOpen(true)} className="w-full arrow-btn-primary flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Atualizar Progresso
              </button>
              {goal.status === 'ativo' && (
                <button onClick={() => updateGoal.mutate({ id: goal.id, status: 'concluido' })}
                  className="w-full arrow-btn-secondary flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Marcar como Concluída
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="arrow-card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Detalhes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-gray-800 font-medium">{goal.goal_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Prioridade</span><span className="text-gray-800 font-medium">{goal.priority}</span></div>
              {goal.target_date && (
                <div className="flex justify-between"><span className="text-gray-500">Prazo</span><span className="text-gray-800 font-medium">{new Date(goal.target_date).toLocaleDateString('pt-BR')}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Criada em</span><span className="text-gray-800 font-medium">{new Date(goal.created_at).toLocaleDateString('pt-BR')}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="arrow-card p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Notas</h3>
            <p className="text-sm text-gray-400">{goal.notes || 'Nenhuma nota adicionada'}</p>
          </div>
        </div>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Atualizar Progresso</DialogTitle></DialogHeader>
          <form onSubmit={handleProgressUpdate} className="space-y-4 mt-2">
            <div>
              <label className="arrow-label block mb-1.5">Quanto você avançou?</label>
              <input type="number" min={0} value={updateValue || ''} onChange={e => setUpdateValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder={`Valor atual: ${goal.current_value}`} />
              {goal.target_value && (
                <p className="text-xs text-gray-400 mt-1">Progresso após: {goal.current_value + updateValue} / {goal.target_value}</p>
              )}
            </div>
            <button type="submit" className="w-full arrow-btn-primary">Atualizar</button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
