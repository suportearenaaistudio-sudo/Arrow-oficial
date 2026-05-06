import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Pause, Trash2, Edit2, Plus, Clock, Target, Repeat, ChevronRight } from 'lucide-react';
import { useCycles, getCurrentWeek, getCycleProgress } from '@/hooks/useCycles';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Cycle, CycleCategory } from '@/types/arrow';

const categoryConfig: Record<CycleCategory, { label: string }> = {
  crescimento: { label: 'Crescimento Pessoal' },
  profissional: { label: 'Carreira e Negocios' },
  saude: { label: 'Saude e Bem-estar' },
  relacionamentos: { label: 'Relacionamentos' },
  criatividade: { label: 'Arte e Criatividade' },
  financeiro: { label: 'Financas Pessoais' },
  aprendizado: { label: 'Estudos e Habilidades' },
  equilibrio: { label: 'Equilibrio de Vida' },
};

const emptyForm = { title: '', description: '', start_date: '', category: '' as CycleCategory, duration: 12 };

export default function Cycles() {
  const { cycles, isLoading, createCycle, activateCycle, deleteCycle, updateCycle } = useCycles();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const stats = {
    total: cycles.length,
    ativo: cycles.filter(c => c.status === 'ativo').length,
    concluidos: cycles.filter(c => c.status === 'concluido').length,
    pausados: cycles.filter(c => c.status === 'pausado').length,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingCycle) {
      updateCycle.mutate({ id: editingCycle.id, ...form }, {
        onSuccess: () => { setFormOpen(false); setEditingCycle(null); setForm(emptyForm); }
      });
    } else {
      createCycle.mutate(form, {
        onSuccess: () => { setFormOpen(false); setForm(emptyForm); }
      });
    }
  }

  function handleEdit(cycle: Cycle) {
    setEditingCycle(cycle);
    setForm({
      title: cycle.title,
      description: cycle.description || '',
      start_date: cycle.start_date,
      category: cycle.category || '' as CycleCategory,
      duration: cycle.duration,
    });
    setFormOpen(true);
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Meus Ciclos de 12 Semanas</h1>
          <p className="text-gray-500 text-sm mt-1">Organize sua jornada em ciclos focados para alcançar resultados extraordinários</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingCycle(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Ciclo
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCycle ? 'Editar Ciclo' : 'Novo Ciclo de 12 Semanas'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="arrow-label block mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" placeholder="Ex: Foco Total" />
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none h-20" placeholder="Objetivos deste ciclo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arrow-label block mb-1.5">Data de Início</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Duração (semanas)</label>
                  <input type="number" min={4} max={16} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CycleCategory }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="">Selecione...</option>
                  {Object.entries(categoryConfig).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full arrow-btn-primary" disabled={createCycle.isPending || updateCycle.isPending}>
                {editingCycle ? 'Salvar Alterações' : 'Criar Ciclo'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Ciclos', value: stats.total, icon: Calendar, tint: 'stat-card-blue' },
          { label: 'Ciclo Ativo', value: stats.ativo, icon: Play, tint: 'stat-card-green' },
          { label: 'Concluídos', value: stats.concluidos, icon: Target, tint: 'stat-card-purple' },
          { label: 'Em Pausa', value: stats.pausados, icon: Pause, tint: 'stat-card-amber' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`arrow-card p-5 ${s.tint}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/60">
                <s.icon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cycles Grid */}
      {cycles.length === 0 ? (
        <div className="arrow-card p-12 text-center">
          <Calendar className="w-16 h-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum ciclo ainda</h3>
          <p className="text-gray-400 text-sm mb-4">Crie seu primeiro ciclo de 12 semanas para começar!</p>
          <button onClick={() => setFormOpen(true)} className="arrow-btn-primary">Criar Primeiro Ciclo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cycles.map((cycle, i) => {
            const week = getCurrentWeek(cycle);
            const progress = getCycleProgress(cycle);
            const cat = categoryConfig[cycle.category as CycleCategory];
            return (
              <motion.div key={cycle.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="arrow-card p-5 overflow-hidden">
                {/* Category Bar */}
                <div className="h-1 -mt-5 -mx-5 mb-4 bg-gradient-to-r from-orange-400 to-blue-500 rounded-t-2xl" />
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{cat?.label || 'Sem categoria'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Ativo</span>
                    <Switch checked={cycle.status === 'ativo'}
                      onCheckedChange={(checked) => {
                        if (checked) activateCycle.mutate(cycle.id);
                        else updateCycle.mutate({ id: cycle.id, status: 'pausado' as const });
                      }} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{cycle.title}</h3>
                {cycle.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{cycle.description}</p>}
                {/* Progress */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso do Ciclo</span>
                  <span>Semana {week}/{cycle.duration}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full mb-1">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-right text-xs font-semibold text-green-600 mb-3">{progress}%</p>
                {/* Dates */}
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span><Clock className="w-3 h-3 inline mr-1" />Início: {new Date(cycle.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span>Fim: {new Date(cycle.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => handleEdit(cycle)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir ciclo?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita. O ciclo "{cycle.title}" será excluído permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCycle.mutate(cycle.id)} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="flex-1" />
                  <button className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:text-orange-700 transition-colors">
                    <Repeat className="w-3.5 h-3.5" /> Ver Timeline <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
