import { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Plus, TrendingUp, TrendingDown, DollarSign, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TransactionType } from '@/types/arrow';

const incomeCats = ['salario', 'freelance', 'investimentos', 'vendas', 'servicos', 'bonus', 'rendimentos', 'outros_receita'];
const expenseCats = ['alimentacao', 'transporte', 'moradia', 'lazer', 'saude', 'educacao', 'assinaturas', 'roupas', 'tecnologia', 'viagem', 'impostos', 'outros_despesa'];

const emptyForm = { description: '', amount: 0, type: 'despesa' as TransactionType, category: '', date: new Date().toISOString().split('T')[0] };

export default function Finances() {
  const { transactions, receitas, despesas, saldo, isLoading, createTransaction, deleteTransaction } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTransaction.mutate(form, { onSuccess: () => { setFormOpen(false); setForm(emptyForm); } });
  }

  function formatCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Finanças</h1>
          <p className="text-gray-500 text-sm mt-1">Controle completo das suas finanças pessoais</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Transação</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="flex gap-2">
                {(['receita', 'despesa'] as TransactionType[]).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === t
                      ? t === 'receita' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-500'}`}>
                    {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                  </button>
                ))}
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Descrição</label>
                <input type="text" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arrow-label block mb-1.5">Valor (R$)</label>
                  <input type="number" min={0.01} step={0.01} required value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Data</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="">Selecione...</option>
                  {(form.type === 'receita' ? incomeCats : expenseCats).map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full arrow-btn-primary">Registrar</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="arrow-card p-5 stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="arrow-label">Receitas</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(receitas)}</p>
            </div>
            <ArrowUpCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="arrow-card p-5 stat-card-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="arrow-label">Despesas</p>
              <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(despesas)}</p>
            </div>
            <ArrowDownCircle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`arrow-card p-5 ${saldo >= 0 ? 'stat-card-blue' : 'stat-card-red'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="arrow-label">Saldo</p>
              <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="arrow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Transações Recentes</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Landmark className="w-12 h-12 text-orange-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma transação registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 30).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`p-2 rounded-xl ${t.type === 'receita' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {t.type === 'receita' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{t.description}</p>
                  <p className="text-[10px] text-gray-400">{t.category?.replace(/_/g, ' ')} · {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <p className={`text-sm font-semibold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'receita' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                </p>
                <button onClick={() => deleteTransaction.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
