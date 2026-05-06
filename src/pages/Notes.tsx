import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Trash2, Tag, Edit3 } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Note } from '@/types/arrow';

export default function Notes() {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [editContent, setEditContent] = useState('');

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  const filtered = notes.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter && !(n.tags || []).includes(tagFilter)) return false;
    return true;
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createNote.mutate(
      { title: form.title, content: form.content, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) },
      { onSuccess: () => { setFormOpen(false); setForm({ title: '', content: '', tags: '' }); } }
    );
  }

  function handleSaveContent() {
    if (!selectedNote) return;
    updateNote.mutate({ id: selectedNote.id, content: editContent });
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Notas</h1>
          <p className="text-gray-500 text-sm mt-1">Capture ideias e insights</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Nota</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nova Nota</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="arrow-label block mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Conteúdo</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
              </div>
              <div>
                <label className="arrow-label block mb-1.5">Tags (separadas por vírgula)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="produtividade, ideias, projeto" />
              </div>
              <button type="submit" className="w-full arrow-btn-primary">Criar Nota</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Left panel — Notes list */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar notas..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => setTagFilter('')}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${!tagFilter ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                Todas
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${tag === tagFilter ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Nenhuma nota</p>
              </div>
            ) : filtered.map(note => (
              <button key={note.id}
                onClick={() => { setSelectedNote(note); setEditContent(note.content || ''); }}
                className={`w-full text-left p-3.5 rounded-xl transition-all ${selectedNote?.id === note.id ? 'bg-orange-50 border border-orange-200' : 'arrow-card hover:shadow-md'}`}>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{note.title}</p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{note.content || 'Sem conteúdo'}</p>
                {(note.tags || []).length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {note.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel — Note content */}
        <div className="flex-1 arrow-card p-6 flex flex-col overflow-hidden">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{selectedNote.title}</h2>
                <div className="flex items-center gap-1">
                  <button onClick={handleSaveContent} className="arrow-btn-primary text-xs px-3 py-1.5">Salvar</button>
                  <button onClick={() => { deleteNote.mutate(selectedNote.id); setSelectedNote(null); }}
                    className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                className="flex-1 w-full text-sm text-gray-700 leading-relaxed resize-none focus:outline-none bg-transparent"
                placeholder="Comece a escrever..." />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Edit3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Selecione uma nota para editar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
