import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVault } from '@/contexts/VaultContext';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';
import type { AIConversation, AIMessage, ContextStats, SendMessageResult } from '@/lib/ai-types';

export function useAIConversations() {
  const { profile } = useVault();

  return useQuery({
    queryKey: ['ai-conversations', profile?.id],
    queryFn: () => desktopAPI.ai.listConversations() as Promise<AIConversation[]>,
    enabled: isDesktop() && !!profile,
    retry: false,
  });
}

export function useAIMessages(conversationId: string | null) {
  const { profile } = useVault();

  return useQuery({
    queryKey: ['ai-messages', profile?.id, conversationId],
    queryFn: () => desktopAPI.ai.listMessages(conversationId!) as Promise<AIMessage[]>,
    enabled: isDesktop() && !!profile && !!conversationId,
    retry: false,
  });
}

export function useAIContextStats(conversationId: string | null) {
  const { profile } = useVault();

  return useQuery({
    queryKey: ['ai-context-stats', profile?.id, conversationId],
    queryFn: () => desktopAPI.ai.getContextStats(conversationId) as Promise<ContextStats>,
    enabled: isDesktop() && !!profile,
    retry: false,
  });
}

export function useAIActions(conversationId: string | null) {
  const { profile } = useVault();
  const queryClient = useQueryClient();

  const invalidateAffected = (queries: string[] = []) => {
    const map: Record<string, string[]> = {
      tasks: ['tasks'],
      goals: ['goals'],
      habits: ['habits'],
      notes: ['notes'],
      transactions: ['transactions'],
      checkins: ['checkins', 'daily-checkin'],
      vision: ['vision'],
      cycles: ['cycles'],
    };
    const keys = new Set<string>();
    for (const q of queries) {
      for (const k of map[q] ?? [q]) keys.add(k);
    }
    for (const k of keys) {
      queryClient.invalidateQueries({ queryKey: [k] });
    }
    queryClient.invalidateQueries({ queryKey: ['ai-settings', profile?.id] });
  };

  const createConversation = useMutation({
    mutationFn: (title?: string) =>
      desktopAPI.ai.createConversation(title) as Promise<AIConversation>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', profile?.id] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => desktopAPI.ai.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', profile?.id] });
    },
  });

  const renameConversation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      desktopAPI.ai.renameConversation(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', profile?.id] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: (message: string) =>
      desktopAPI.ai.sendMessage(conversationId!, message) as Promise<SendMessageResult>,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages', profile?.id, conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-context-stats', profile?.id, conversationId] });
      if (result.affectedQueries?.length) {
        invalidateAffected(result.affectedQueries);
      }
    },
  });

  const confirmTool = useMutation({
    mutationFn: ({ pendingId, confirmed }: { pendingId: string; confirmed: boolean }) =>
      desktopAPI.ai.confirmTool(pendingId, confirmed) as Promise<SendMessageResult>,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages', profile?.id, conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings', profile?.id] });
      if (result.affectedQueries?.length) {
        invalidateAffected(result.affectedQueries);
      }
    },
  });

  return {
    createConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    confirmTool,
    invalidateAffected,
  };
}
