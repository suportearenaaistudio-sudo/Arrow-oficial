import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Calendar, Target, CheckSquare, Flame, Plus, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { useCycles, getCurrentWeek, getCycleProgress } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { MoodType } from '@/types/arrow';

const moodOptions: { mood: MoodType; Icon: React.ElementType; label: string }[] = [
  { mood: 'muito_feliz', Icon: Smile, label: 'Muito Feliz' },
  { mood: 'feliz', Icon: Smile, label: 'Feliz' },
  { mood: 'neutro', Icon: Meh, label: 'Neutro' },
  { mood: 'triste', Icon: Frown, label: 'Triste' },
  { mood: 'muito_triste', Icon: Frown, label: 'Muito Triste' },
];

export default function Planning() {
  const navigate = useNavigate();
  const { activeCycle, isLoading } = useCycles();
  const { goals } = useGoals();
  const { tasks, byStatus } = useTasks();
  const { habits } = useHabits();
  const { todayCheckin, saveCheckin } = useDailyCheckin();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    mood: 'neutro' as MoodType,
    productivity_score: 5,
    gratitude: '',
    highlight: '',
    challenge: '',
    tomorrow_focus: '',
  });

  function handleSaveCheckin(e: React.FormEvent) {
    e.preventDefault();
    saveCheckin.mutate(checkinForm, {
      onSuccess: () => setCheckinOpen(false),
    });
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  if (!activeCycle) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold arrow-gradient-text mb-1">Planejamento</h1>
        <p className="text-gray-500 text-sm mb-6">Organize sua jornada em ciclos focados</p>
        <div className="arrow-card p-12 text-center">
          <PieChart className="w-16 h-16 text-orange-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum ciclo ativo</h3>
          <p className="text-gray-400 text-sm mb-4">Crie e ative um ciclo para usar o planejamento</p>
          <button onClick={() => navigate('/cycles')} className="arrow-btn-primary">Ir para Ciclos</button>
        </div>
      </motion.div>
    );
  }

  const week = getCurrentWeek(activeCycle);
  const progress = getCycleProgress(activeCycle);
  const activeGoals = goals.filter(g => g.status === 'ativo');
  const weekTasks = byStatus.a_fazer.length + byStatus.em_andamento.length;
  const doneThisWeek = byStatus.concluida.length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Planejamento</h1>
          <p className="text-gray-500 text-sm mt-1">Ciclo: {activeCycle.title} — Semana {week}</p>
        </div>
        <button onClick={() => setCheckinOpen(true)} className="arrow-btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Check-in Diário
        </button>
      </div>

      {/* Cycle Progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="arrow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Progresso do Ciclo</h3>
          <span className="text-sm font-bold arrow-gradient-text">Semana {week} de {activeCycle.duration}</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
          <div className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{new Date(activeCycle.start_date).toLocaleDateString('pt-BR')}</span>
          <span className="font-semibold text-green-600">{progress}% concluído</span>
          <span>{new Date(activeCycle.end_date).toLocaleDateString('pt-BR')}</span>
        </div>
      </motion.div>

      {/* Week Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Metas Ativas', value: activeGoals.length, icon: Target, tint: 'stat-card-purple' },
          { label: 'Tarefas Pendentes', value: weekTasks, icon: CheckSquare, tint: 'stat-card-blue' },
          { label: 'Tarefas Concluídas', value: doneThisWeek, icon: CheckSquare, tint: 'stat-card-green' },
          { label: 'Hábitos Ativos', value: habits.length, icon: Flame, tint: 'stat-card-orange' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`arrow-card p-5 ${s.tint}`}>
            <div className="flex items-start justify-between">
              <div><p className="text-2xl font-bold text-gray-800">{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>
              <s.icon className="w-5 h-5 text-gray-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Check-in Status */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`arrow-card p-5 ${todayCheckin ? 'stat-card-green' : 'bg-yellow-50/80 border-yellow-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Check-in de Hoje</h3>
            {todayCheckin ? (
              <p className="text-sm text-green-600 mt-1">Concluido — Humor: {moodOptions.find(m => m.mood === todayCheckin.mood)?.label} · Produtividade: {todayCheckin.productivity_score}/10</p>
            ) : (
              <p className="text-sm text-amber-600 mt-1">Pendente — Faca seu check-in para acompanhar seu dia</p>
            )}
          </div>
          {!todayCheckin && (
            <button onClick={() => setCheckinOpen(true)} className="arrow-btn-primary text-xs">Fazer Agora</button>
          )}
        </div>
      </motion.div>

      {/* Check-in Dialog */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Check-in Diário</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveCheckin} className="space-y-4 mt-2">
            <div>
              <label className="arrow-label block mb-2">Como você está?</label>
              <div className="flex gap-2">
                {moodOptions.map(m => (
                  <button key={m.mood} type="button" onClick={() => setCheckinForm(f => ({ ...f, mood: m.mood }))}
                    className={`flex-1 py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${checkinForm.mood === m.mood ? 'bg-orange-50 ring-2 ring-orange-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <m.Icon className="w-6 h-6" />
                    <span className="text-[9px] font-medium text-gray-500">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="arrow-label block mb-1.5">Produtividade (1-10)</label>
              <input type="range" min={1} max={10} value={checkinForm.productivity_score}
                onChange={e => setCheckinForm(f => ({ ...f, productivity_score: Number(e.target.value) }))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-gray-400"><span>1</span><span className="font-bold text-orange-600 text-sm">{checkinForm.productivity_score}</span><span>10</span></div>
            </div>
            <div>
              <label className="arrow-label block mb-1.5">Gratidão</label>
              <input type="text" value={checkinForm.gratitude} onChange={e => setCheckinForm(f => ({ ...f, gratitude: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="O que te deixou grato hoje?" />
            </div>
            <div>
              <label className="arrow-label block mb-1.5">Destaque do dia</label>
              <input type="text" value={checkinForm.highlight} onChange={e => setCheckinForm(f => ({ ...f, highlight: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Maior conquista de hoje" />
            </div>
            <div>
              <label className="arrow-label block mb-1.5">Foco de amanhã</label>
              <input type="text" value={checkinForm.tomorrow_focus} onChange={e => setCheckinForm(f => ({ ...f, tomorrow_focus: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="No que focar amanhã?" />
            </div>
            <button type="submit" className="w-full arrow-btn-primary">Salvar Check-in</button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
