import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { MediaList, MediaListItem, MediaItemStatus } from '@/types/arrow';

export function useMediaLists() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const listsQuery = useQuery({
    queryKey: ['media-lists', profile?.id],
    queryFn: () => desktopAPI.db.mediaLists.lists.list() as Promise<MediaList[]>,
    enabled: !!profile,
    retry: false,
  });

  const createList = useMutation({
    mutationFn: (data: Partial<MediaList>) =>
      desktopAPI.db.mediaLists.lists.create(data) as Promise<MediaList>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-lists'] });
      showSuccess('Lista criada!');
    },
    onError: () => showError('Erro ao criar lista'),
  });

  const deleteList = useMutation({
    mutationFn: (id: string) => desktopAPI.db.mediaLists.lists.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-lists'] });
      showSuccess('Lista excluída');
    },
    onError: (e: Error) => showError(e.message || 'Erro ao excluir lista'),
  });

  const lists = listsQuery.data || [];
  const systemLists = lists.filter(l => l.is_system);
  const customLists = lists.filter(l => !l.is_system);

  return {
    lists,
    systemLists,
    customLists,
    isLoading: listsQuery.isLoading,
    createList,
    deleteList,
  };
}

export function useMediaListItems(listId: string | null) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const itemsQuery = useQuery({
    queryKey: ['media-items', listId, profile?.id],
    queryFn: () => desktopAPI.db.mediaLists.items.list(listId!) as Promise<MediaListItem[]>,
    enabled: !!profile && !!listId,
    retry: false,
  });

  const createItem = useMutation({
    mutationFn: (data: Partial<MediaListItem>) =>
      desktopAPI.db.mediaLists.items.create({ ...data, list_id: listId }) as Promise<MediaListItem>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-items', listId] });
      showSuccess('Item adicionado!');
    },
    onError: () => showError('Erro ao adicionar item'),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...updates }: Partial<MediaListItem> & { id: string }) =>
      desktopAPI.db.mediaLists.items.update({ id, ...updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media-items', listId] }),
    onError: () => showError('Erro ao atualizar item'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => desktopAPI.db.mediaLists.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-items', listId] });
      showSuccess('Item removido');
    },
    onError: () => showError('Erro ao remover item'),
  });

  const moveItem = useMutation({
    mutationFn: ({ id, status, rank }: { id: string; status: MediaItemStatus; rank?: number }) =>
      desktopAPI.db.mediaLists.items.move(id, status, rank) as Promise<MediaListItem>,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media-items', listId] }),
    onError: () => showError('Erro ao mover item'),
  });

  const items = itemsQuery.data || [];
  const byStatus = {
    top: items.filter(i => i.status === 'top').sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
    visto: items.filter(i => i.status === 'visto'),
    a_ver: items.filter(i => i.status === 'a_ver'),
  };

  return {
    items,
    byStatus,
    isLoading: itemsQuery.isLoading,
    createItem,
    updateItem,
    deleteItem,
    moveItem,
  };
}
