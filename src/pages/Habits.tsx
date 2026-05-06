import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Plus, Edit2, Trash2, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Habit, HabitCategory, HabitFrequency, HabitRoutine, HabitCompletion } from '@/types/arrow';

const categoryConfig: Record<HabitCategory, { label: string }> = {
  saude: { label: 'Saude' }, produtividade: { label: 'Produtividade' },
  relacionamentos: { label: 'Relacionamentos' }, crescimento: { label: 'Crescimento' },
  lazer: { label: 'Lazer' }, financeiro: { label: 'Financeiro' }, outro: { label: 'Outro' },
};

const routineLabels: Record<HabitRoutine, { label: string }> = {
  manha: { label: 'Rotina da Manha' }, tarde: { label: 'Rotina da Tarde' },
  noite: { label: 'Rotina da Noite' }, qualquer: { label: 'Qualquer Horario' },
};

const emptyForm = { title: '', description: '', category: 'saude' as HabitCategory, frequency_type: 'diario' as HabitFrequency, frequency_value: 3, routine: 'qualquer' as HabitRoutine };

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function Habits() {
  const { habits, stats, isLoading, createHabit, toggleHabitDay, deleteHabit, updateHabit } = useHabits();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const last7 = getLast7Days();
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingHabit) {
      updateHabit.mutate({ id: editingHabit.id, ...form }, { onSuccess: () => { setFormOpen(false); setEditingHabit(null); setForm(emptyForm); } });
    } else {
      createHabit.mutate(form, { onSuccess: () => { setFormOpen(false); setForm(emptyForm); } });
    }
  }

  function isCompleted(habit: Habit, date: string): boolean {
    return (habit.completion_history || []).some((h: HabitCompletion) => h.date === date && h.completed);
  }

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const cat = categoryConfig[habit.category];
    return (
      <motion.div layout className="arrow-card p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs text-gray-500">{cat.label}</span>
            <h3 className="font-semibold text-gray-800 mt-0.5">{habit.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditingHabit(habit); setForm({ title: habit.title, description: habit.description || '', category: habit.category, frequency_type: habit.frequency_type, frequency_value: habit.frequency_value || 3, routine: habit.routine }); setFormOpen(true); }}
              className="p-1.5 rounded-lg hover:bg-gray-100"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
            <button onClick={() => setDeleteId(habit.id)}
              className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" /> {habit.current_streak} dias</span>
          <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Record: {habit.longest_streak}</span>
        </div>
        {/* Weekly grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {last7.map((date) => {
            const completed = isCompleted(habit, date);
            const dayIndex = new Date(date).getDay();
            return (
              <button key={date} onClick={() => toggleHabitDay.mutate({ habit, date })}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all duration-200 ${completed
                  ? 'bg-gradient-to-b from-green-400 to-green-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                <span className="text-[9px] font-medium">{dayNames[dayIndex]}</span>
                {completed ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Meus Hábitos</h1>
          <p className="text-gray-500 text-sm mt-1">Construa consistência com rastreamento diário</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingHabit(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Hábito</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingHabit ? 'Editar Hábito' : 'Novo Hábito'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div><label className="arrow-label block mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: Meditar 10 minutos" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="arrow-label block mb-1.5">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as HabitCategory }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select></div>
                <div><label className="arrow-label block mb-1.5">Rotina</label>
                  <select value={form.routine} onChange={e => setForm(f => ({ ...f, routine: e.target.value as HabitRoutine }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    {Object.entries(routineLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select></div>
              </div>
              <div><label className="arrow-label block mb-1.5">Frequência</label>
                <select value={form.frequency_type} onChange={e => setForm(f => ({ ...f, frequency_type: e.target.value as HabitFrequency }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="diario">Diário</option><option value="intermitente">Intermitente</option><option value="dias_especificos">Dias Específicos</option>
                </select></div>
              {form.frequency_type === 'intermitente' && (
                <div><label className="arrow-label block mb-1.5">Vezes por semana</label>
                  <input type="number" min={1} max={6} value={form.frequency_value} onChange={e => setForm(f => ({ ...f, frequency_value: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" /></div>
              )}
              <button type="submit" className="w-full arrow-btn-primary">{editingHabit ? 'Salvar' : 'Criar Hábito'}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Hábitos', value: stats.total, tint: 'stat-card-blue' },
          { label: 'Sequências Ativas', value: stats.activeStreaks, tint: 'stat-card-green' },
          { label: 'Maior Sequência', value: `${stats.longestStreak} dias`, tint: 'stat-card-orange' },
          { label: 'Total Completado', value: stats.totalCompleted, tint: 'stat-card-purple' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`arrow-card p-4 ${s.tint}`}>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos os Hábitos</TabsTrigger>
          <TabsTrigger value="routine">Por Rotina</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {habits.length === 0 ? (
            <div className="arrow-card p-12 text-center">
              <Repeat className="w-16 h-16 text-orange-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum hábito ainda</h3>
              <p className="text-gray-400 text-sm mb-4">Adicione hábitos para acompanhar sequências</p>
              <button onClick={() => setFormOpen(true)} className="arrow-btn-primary">Criar Primeiro Hábito</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {habits.map(h => <HabitCard key={h.id} habit={h} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="routine">
          {(['manha', 'tarde', 'noite', 'qualquer'] as HabitRoutine[]).map(routine => {
            const routineHabits = habits.filter(h => h.routine === routine);
            if (routineHabits.length === 0) return null;
            const r = routineLabels[routine];
            return (
              <div key={routine} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">{r.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {routineHabits.map(h => <HabitCard key={h.id} habit={h} />)}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir hábito?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteHabit.mutate(deleteId); setDeleteId(null); }} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
