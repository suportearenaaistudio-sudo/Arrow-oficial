import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Library } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaLists, useMediaListItems } from '@/hooks/useMediaLists';
import SegmentPillBar from '@/components/ui/SegmentPillBar';
import MediaKanbanColumn from '@/components/lists/MediaKanbanColumn';
import ReleaseSchedulePanel from '@/components/lists/ReleaseSchedulePanel';
import { LIST_THEMES } from '@/lib/list-themes';
import type { MediaList, MediaItemStatus } from '@/types/arrow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Lists() {
  const { theme, isDark } = useTheme();
  const { systemLists, customLists, isLoading, createList } = useMediaLists();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const activeList = useMemo(() => {
    const all = [...systemLists, ...customLists];
    if (activeListId) return all.find(l => l.id === activeListId) ?? systemLists[0] ?? null;
    return systemLists[0] ?? null;
  }, [activeListId, systemLists, customLists]);

  const resolvedListId = activeList?.id ?? null;
  const { byStatus, createItem, moveItem, deleteItem, updateItem } = useMediaListItems(resolvedListId);

  const listTheme = activeList ? LIST_THEMES[activeList.list_type] : LIST_THEMES.custom;

  const pillItems = useMemo(() => [
    ...systemLists.map(list => ({
      id: list.id,
      label: LIST_THEMES[list.list_type]?.label || list.name,
      icon: LIST_THEMES[list.list_type]?.icon,
      accent: LIST_THEMES[list.list_type]?.accent,
    })),
    ...customLists.map(list => ({
      id: list.id,
      label: list.name,
      icon: LIST_THEMES.custom.icon,
      accent: LIST_THEMES.custom.accent,
    })),
  ], [systemLists, customLists]);

  const allItems = useMemo(
    () => [...byStatus.top, ...byStatus.visto, ...byStatus.a_ver],
    [byStatus],
  );

  function handleAddItem(
    status: MediaItemStatus,
    data: { title: string; subtitle: string; rating?: number },
  ) {
    const rank = status === 'top' ? byStatus.top.length + 1 : undefined;
    createItem.mutate({ ...data, status, rank });
  }

  function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    createList.mutate(
      { name: newListName, list_type: 'custom' },
      { onSuccess: (list) => {
        setNewListName('');
        setNewListOpen(false);
        setActiveListId((list as MediaList).id);
      }},
    );
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold arrow-gradient-text">Listas</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
          Organize filmes, séries, jogos e mais
        </p>
      </div>

      {pillItems.length > 0 && (
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <SegmentPillBar
            items={pillItems}
            activeId={resolvedListId}
            onChange={setActiveListId}
          />
          <button
            onClick={() => setNewListOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ color: theme.textSecondary, border: `1px dashed ${theme.border}` }}
          >
            <Plus className="w-3.5 h-3.5" /> Nova Lista
          </button>
        </div>
      )}

      <div className="flex gap-4 min-h-[calc(100vh-14rem)]">
        <div className="w-[220px] flex-shrink-0 hidden md:block">
          <div
            className="flex flex-col rounded-[20px] p-3 h-full min-h-[360px]"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.border}`,
            }}
          >
            <ReleaseSchedulePanel activeList={activeList} items={allItems} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeList ? (
            <>
              <div
                className="relative flex items-center gap-4 mb-5 p-5 rounded-2xl overflow-hidden"
                style={{ background: listTheme.accentLight }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: listTheme.headerPattern }}
                />
                <div
                  className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: listTheme.gradient }}
                >
                  <listTheme.icon className="w-6 h-6 text-white" />
                </div>
                <div className="relative flex-1">
                  <h2 className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                    {activeList.name}
                  </h2>
                  <div className="flex gap-3 mt-1">
                    {[
                      { label: 'Top', count: byStatus.top.length, color: listTheme.accent },
                      { label: 'Visto', count: byStatus.visto.length, color: theme.textMuted },
                      { label: 'A Ver', count: byStatus.a_ver.length, color: theme.textMuted },
                    ].map(s => (
                      <span key={s.label} className="text-xs" style={{ color: s.color }}>
                        <span className="font-bold">{s.count}</span> {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MediaKanbanColumn
                  status="top"
                  items={byStatus.top}
                  theme={listTheme}
                  onAdd={(data) => handleAddItem('top', data)}
                  onMove={(id, status, rank) => moveItem.mutate({ id, status, rank })}
                  onDelete={(id) => deleteItem.mutate(id)}
                  onUpdateRating={(id, rating) => updateItem.mutate({ id, rating })}
                />
                <MediaKanbanColumn
                  status="visto"
                  items={byStatus.visto}
                  theme={listTheme}
                  onAdd={(data) => handleAddItem('visto', data)}
                  onMove={(id, status) => moveItem.mutate({ id, status })}
                  onDelete={(id) => deleteItem.mutate(id)}
                  onUpdateRating={(id, rating) => updateItem.mutate({ id, rating })}
                />
                <MediaKanbanColumn
                  status="a_ver"
                  items={byStatus.a_ver}
                  theme={listTheme}
                  onAdd={(data) => handleAddItem('a_ver', data)}
                  onMove={(id, status) => moveItem.mutate({ id, status })}
                  onDelete={(id) => deleteItem.mutate(id)}
                  onUpdateRating={(id, rating) => updateItem.mutate({ id, rating })}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 arrow-card">
              <Library className="w-12 h-12 mb-3" style={{ color: theme.textMuted }} />
              <p style={{ color: theme.textMuted }}>Selecione uma lista</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Lista Personalizada</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateList} className="space-y-4 mt-2">
            <input required value={newListName} onChange={e => setNewListName(e.target.value)}
              placeholder="Nome da lista"
              className="w-full px-4 py-2.5 rounded-xl border text-sm" />
            <button type="submit" className="arrow-btn-primary w-full">Criar Lista</button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
