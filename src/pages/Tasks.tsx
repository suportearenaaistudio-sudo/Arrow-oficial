import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, MoreHorizontal, Trash2, Edit2, Timer, GripVertical } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Task, TaskStatus, TaskPriority } from '@/types/arrow';

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'a_fazer', label: 'A Fazer', color: 'kanban-todo' },
  { id: 'em_andamento', label: 'Em Andamento', color: 'kanban-progress' },
  { id: 'revisao', label: 'Revisão', color: 'kanban-review' },
  { id: 'concluida', label: 'Concluída', color: 'kanban-done' },
];

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  baixa: { label: 'baixa', color: 'bg-green-100 text-green-700' },
  media: { label: 'media', color: 'bg-yellow-100 text-yellow-700' },
  alta: { label: 'alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'urgente', color: 'bg-red-100 text-red-700' },
};

const emptyForm = { title: '', description: '', priority: 'media' as TaskPriority, due_date: '', important: false };

export default function Tasks() {
  const { tasks, byStatus, isLoading, createTask, moveTask, deleteTask, updateTask } = useTasks();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...form }, {
        onSuccess: () => { setFormOpen(false); setEditingTask(null); setForm(emptyForm); }
      });
    } else {
      createTask.mutate(form, {
        onSuccess: () => { setFormOpen(false); setForm(emptyForm); }
      });
    }
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date || '', important: task.important });
    setFormOpen(true);
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Gerenciador de Tarefas</h1>
          <p className="text-gray-500 text-sm mt-1">Organize seu dia e conecte tarefas às suas metas</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingTask(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Tarefa</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="arrow-label block mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="O que precisa fazer?" />
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="arrow-label block mb-1.5">Prioridade</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="arrow-label block mb-1.5">Data de Vencimento</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} className="rounded" />
                Importante (Matriz de Eisenhower)
              </label>
              <button type="submit" className="w-full arrow-btn-primary">{editingTask ? 'Salvar' : 'Criar Tarefa'}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = byStatus[col.id] || [];
          return (
            <div key={col.id} className={`rounded-2xl p-3 min-h-[300px] ${col.color}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs bg-white/80 text-gray-500 px-2 py-0.5 rounded-full font-medium">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => {
                  const pri = priorityConfig[task.priority];
                  return (
                    <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-3.5 shadow-sm border border-white/80 hover:shadow-md transition-shadow cursor-grab">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{task.title}</p>
                          {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-gray-100 flex-shrink-0"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEdit(task)} className="gap-2 cursor-pointer text-xs">
                              <Edit2 className="w-3.5 h-3.5" /> Editar
                            </DropdownMenuItem>
                            {col.id !== 'concluida' && (
                              <DropdownMenuItem onClick={() => moveTask.mutate({ id: task.id, status: 'concluida' })} className="gap-2 cursor-pointer text-xs">
                                <CheckSquare className="w-3.5 h-3.5" /> Concluir
                              </DropdownMenuItem>
                            )}
                            {columns.filter(c => c.id !== col.id).map(c => (
                              <DropdownMenuItem key={c.id} onClick={() => moveTask.mutate({ id: task.id, status: c.id })} className="gap-2 cursor-pointer text-xs">
                                <GripVertical className="w-3.5 h-3.5" /> Mover → {c.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => setDeleteId(task.id)} className="gap-2 cursor-pointer text-xs text-red-600 focus:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${pri.color}`}>{pri.label}</span>
                        {task.due_date && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Timer className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-8">Nenhuma tarefa</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteTask.mutate(deleteId); setDeleteId(null); }} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
