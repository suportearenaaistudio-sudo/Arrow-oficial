import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Search, Edit2, Trash2, TrendingUp, ArrowRight, User, Briefcase, Heart, Wallet, BookOpen, Users, Palette, Plane, Calendar } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { usePageContextMenu } from '@/contexts/DesktopContextMenuContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import type { Goal, GoalCategory, GoalType, Priority } from '@/types/arrow';

const categoryConfig: Record<GoalCategory, { icon: React.ElementType; label: string }> = {
  pessoal: { icon: User, label: 'Pessoal' },
  profissional: { icon: Briefcase, label: 'Profissional' },
  saude: { icon: Heart, label: 'Saude' },
  financeiro: { icon: Wallet, label: 'Financeiro' },
  educacao: { icon: BookOpen, label: 'Educacao' },
  relacionamentos: { icon: Users, label: 'Relacionamentos' },
  criatividade: { icon: Palette, label: 'Criatividade' },
  viagem: { icon: Plane, label: 'Viagem' },
};

const priorityColors: Record<Priority, string> = {
  baixa: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
};

const emptyForm = { title: '', description: '', category: 'pessoal' as GoalCategory, goal_type: 'quantitativa' as GoalType, priority: 'media' as Priority, target_value: 0, target_date: '' };

export default function Goals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { goals, stats, isLoading, createGoal, deleteGoal, updateGoal } = useGoals({ search, category: catFilter, status: statusFilter });
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  usePageContextMenu(
    () => [
      {
        id: 'new-goal',
        label: 'Nova meta',
        icon: Plus,
        onClick: () => {
          setEditingGoal(null);
          setForm(emptyForm);
          setFormOpen(true);
        },
      },
    ],
    [],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...form }, { onSuccess: () => { setFormOpen(false); setEditingGoal(null); setForm(emptyForm); } });
    } else {
      createGoal.mutate(form, { onSuccess: () => { setFormOpen(false); setForm(emptyForm); } });
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Minhas Metas</h1>
          <p className="text-gray-500 text-sm mt-1">Defina e acompanhe suas metas com clareza</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingGoal(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Meta</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="arrow-label block mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arrow-label block mb-1.5">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Prioridade</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="baixa">Baixa</option><option value="media">Média</option>
                    <option value="alta">Alta</option><option value="critica">Crítica</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arrow-label block mb-1.5">Tipo</label>
                  <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value as GoalType }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="quantitativa">Quantitativa</option><option value="qualitativa">Qualitativa</option>
                    <option value="habito">Hábito</option><option value="projeto">Projeto</option>
                  </select>
                </div>
                {form.goal_type === 'quantitativa' && (
                  <div>
                    <label className="arrow-label block mb-1.5">Valor Alvo</label>
                    <input type="number" min={0} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                )}
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Data Alvo</label>
                <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <button type="submit" className="w-full arrow-btn-primary">{editingGoal ? 'Salvar' : 'Criar Meta'}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar metas..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
          <option value="">Todas categorias</option>
          {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
          <option value="">Todos status</option>
          <option value="ativo">Ativas</option><option value="concluido">Concluídas</option>
          <option value="pausado">Pausadas</option><option value="cancelado">Canceladas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, tint: 'stat-card-blue' },
          { label: 'Ativas', value: stats.ativas, tint: 'stat-card-green' },
          { label: 'Concluídas', value: stats.concluidas, tint: 'stat-card-purple' },
          { label: 'Pausadas', value: stats.pausadas, tint: 'stat-card-amber' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`arrow-card p-4 ${s.tint}`}>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="arrow-card p-12 text-center">
          <Target className="w-16 h-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma meta encontrada</h3>
          <p className="text-gray-400 text-sm mb-4">Crie sua primeira meta para começar a acompanhar!</p>
          <button onClick={() => setFormOpen(true)} className="arrow-btn-primary">Criar Primeira Meta</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal, i) => {
            const cat = categoryConfig[goal.category];
            const progress = goal.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="arrow-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">{cat && <cat.icon className="w-3 h-3" />} {cat?.label}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${priorityColors[goal.priority]}`}>{goal.priority}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{goal.title}</h3>
                {goal.goal_type === 'quantitativa' && goal.target_value > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{goal.current_value} / {goal.target_value}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                {goal.target_date && (
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(goal.target_date).toLocaleDateString('pt-BR')}</p>
                )}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => { setEditingGoal(goal); setForm({ title: goal.title, description: goal.description || '', category: goal.category, goal_type: goal.goal_type, priority: goal.priority, target_value: goal.target_value || 0, target_date: goal.target_date || '' }); setFormOpen(true); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => setDeleteId(goal.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-gray-400" /></button>
                  <div className="flex-1" />
                  <button onClick={() => navigate(`/goal-detail/${goal.id}`)}
                    className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:text-orange-700">
                    Detalhes <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir meta?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteGoal.mutate(deleteId); setDeleteId(null); }} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
