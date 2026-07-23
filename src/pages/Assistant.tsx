import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Settings, Loader2, AlertCircle, MessageSquarePlus } from 'lucide-react';
import { usePageContextMenu } from '@/contexts/DesktopContextMenuContext';
import { useQueryClient } from '@tanstack/react-query';
import { useVault } from '@/contexts/VaultContext';
import { useAISettings } from '@/hooks/useAISettings';
import {
  useAIConversations,
  useAIMessages,
  useAIContextStats,
  useAIActions,
} from '@/hooks/useAI';
import { useNotification } from '@/hooks/useNotification';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';
import ConversationSidebar from '@/components/ai/ConversationSidebar';
import ChatMessage from '@/components/ai/ChatMessage';
import ChatInput from '@/components/ai/ChatInput';
import TypingIndicator from '@/components/ai/TypingIndicator';
import WeeklyTokenCounter from '@/components/ai/WeeklyTokenCounter';
import ContextUsageBar from '@/components/ai/ContextUsageBar';
import ToolActionCard from '@/components/ai/ToolActionCard';
import type { SendMessageResult } from '@/lib/ai-types';

export default function Assistant() {
  if (!isDesktop()) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-20">
        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--arrow-accent)' }} />
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--arrow-text-primary)' }}>Assistente IA</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--arrow-text-secondary)' }}>
          O assistente funciona no app desktop (Tauri). No navegador, use <code>npm run dev:desktop</code>.
        </p>
        <Link to="/" className="text-sm underline" style={{ color: 'var(--arrow-accent)' }}>Voltar ao Dashboard</Link>
      </motion.div>
    );
  }

  return <AssistantDesktop />;
}

function AssistantDesktop() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { configured, weeklyUsage, isLoading: loadingSettings, settings, model, saveModel, refetch: refetchSettings } = useAISettings();
  const { data: conversations = [], isLoading: loadingConvs, error: convError } = useAIConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages = [], isLoading: loadingMsgs, error: msgError } = useAIMessages(activeId);
  const { data: contextStats, error: ctxError } = useAIContextStats(activeId);
  const { createConversation, deleteConversation, renameConversation, confirmTool } =
    useAIActions(activeId);
  const { showError, showSuccess } = useNotification();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sending, setSending] = useState(false);
  const [optimisticUser, setOptimisticUser] = useState<string | null>(null);
  const [animatingMsgId, setAnimatingMsgId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    preview: string;
  } | null>(null);

  usePageContextMenu(
    () => [
      {
        id: 'new-conversation',
        label: 'Nova conversa',
        icon: MessageSquarePlus,
        onClick: () => {
          void handleNewConversation();
        },
      },
    ],
    [conversations.length],
  );

  useEffect(() => {
    refetchSettings();
  }, [refetchSettings]);

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, sending, optimisticUser]);

  const queryError = convError || msgError || ctxError;
  const activeModel = settings?.model || model || '';

  async function handleModelChange(nextModel: string) {
    if (!nextModel.trim() || nextModel === activeModel) return;
    try {
      await saveModel.mutateAsync(nextModel.trim());
    } catch {
      showError('Erro ao salvar modelo');
    }
  }

  const showOptimisticUser =
    optimisticUser &&
    !messages.some((m) => m.role === 'user' && m.content === optimisticUser);

  async function handleNewConversation() {
    try {
      const conv = await createConversation.mutateAsync();
      setActiveId(conv.id);
    } catch {
      showError('Erro ao criar conversa');
    }
  }

  async function handleSend(text: string) {
    let convId = activeId;
    setOptimisticUser(text);
    setSending(true);

    // #region agent log
    fetch('http://127.0.0.1:7522/ingest/23c8148f-1089-4fe2-9c7f-b9daad8f820c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af36b1'},body:JSON.stringify({sessionId:'af36b1',location:'Assistant.tsx:handleSend:start',message:'send started',data:{convId,textLen:text.length,model:activeModel},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    try {
      if (!convId) {
        const conv = await createConversation.mutateAsync();
        convId = conv.id;
        setActiveId(conv.id);
      }
      // #region agent log
      fetch('http://127.0.0.1:7522/ingest/23c8148f-1089-4fe2-9c7f-b9daad8f820c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af36b1'},body:JSON.stringify({sessionId:'af36b1',location:'Assistant.tsx:handleSend:invoke',message:'calling sendMessage',data:{convId},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const result = (await desktopAPI.ai.sendMessage(convId, text)) as SendMessageResult;
      // #region agent log
      fetch('http://127.0.0.1:7522/ingest/23c8148f-1089-4fe2-9c7f-b9daad8f820c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af36b1'},body:JSON.stringify({sessionId:'af36b1',location:'Assistant.tsx:handleSend:ok',message:'sendMessage returned',data:{status:result.status},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      await queryClient.invalidateQueries({ queryKey: ['ai-messages', profile?.id, convId] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-settings', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-context-stats', profile?.id, convId] });
      await refetchSettings();
      if (result.affectedQueries?.length) {
        for (const q of result.affectedQueries) {
          queryClient.invalidateQueries({ queryKey: [q] });
        }
      }
      setOptimisticUser(null);
      if (result.assistantMessageId) {
        setAnimatingMsgId(result.assistantMessageId);
      }
      handleSendResult(result);
    } catch (e) {
      setOptimisticUser(null);
      // #region agent log
      fetch('http://127.0.0.1:7522/ingest/23c8148f-1089-4fe2-9c7f-b9daad8f820c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af36b1'},body:JSON.stringify({sessionId:'af36b1',location:'Assistant.tsx:handleSend:catch',message:'sendMessage threw',data:{error:typeof e==='string'?e:e instanceof Error?e.message:String(e)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const msg =
        typeof e === 'string'
          ? e
          : e instanceof Error
            ? e.message
            : 'Erro ao enviar mensagem';
      showError(msg);
    } finally {
      setSending(false);
    }
  }

  function handleSendResult(result: SendMessageResult) {
    if (result.status === 'pending_confirmation' && result.pendingId && result.pendingPreview) {
      setPending({ id: result.pendingId, preview: result.pendingPreview });
    } else {
      setPending(null);
    }
  }

  async function handleConfirm(confirmed: boolean) {
    if (!pending) return;
    try {
      const result = await confirmTool.mutateAsync({ pendingId: pending.id, confirmed });
      setPending(null);
      if (confirmed) showSuccess('Ação executada');
      handleSendResult(result);
    } catch {
      showError('Erro ao processar ação');
    }
  }

  if (loadingSettings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--arrow-accent)' }} />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 arrow-card p-8">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#ef4444' }} />
        <h2 className="font-semibold mb-2" style={{ color: 'var(--arrow-text-primary)' }}>Assistente indisponível</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--arrow-text-secondary)' }}>
          {(queryError as Error).message || 'Reinicie o app desktop para carregar o módulo de IA.'}
        </p>
        <Link to="/" className="text-sm underline" style={{ color: 'var(--arrow-accent)' }}>Voltar ao início</Link>
      </div>
    );
  }

  if (!configured) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-20">
        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--arrow-accent)' }} />
        <h1 className="text-xl font-bold arrow-gradient-text mb-2">Assistente Arrow</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--arrow-text-secondary)' }}>
          Configure sua chave API do Gemini em Configurações para começar. Sua chave fica salva apenas no vault local.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--arrow-accent)', color: 'white' }}
        >
          <Settings className="w-4 h-4" />
          Ir para Configurações
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col -mx-6 -mb-6 lg:-mx-8 lg:-mb-8 overflow-hidden"
      style={{ height: 'calc(100dvh - 4.25rem)' }}
    >
      <div className="flex items-center justify-between px-6 lg:px-8 pt-0 pb-3 flex-shrink-0 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Assistente Arrow</h1>
          <p className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>
            IA com acesso aos seus dados locais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ContextUsageBar stats={contextStats} />
          <WeeklyTokenCounter usage={weeklyUsage} compact />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden px-2 lg:px-4">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNewConversation}
          onDelete={(id) => {
            deleteConversation.mutate(id);
            if (activeId === id) setActiveId(null);
          }}
          onRename={(id, title) => renameConversation.mutate({ id, title })}
          loading={createConversation.isPending}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pl-3 lg:pl-4">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 lg:px-3 scroll-smooth"
          >
            {loadingMsgs && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--arrow-accent)' }} />
              </div>
            )}
            {!loadingMsgs && messages.length === 0 && !sending && !optimisticUser && (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-12">
                <Sparkles className="w-10 h-10 mb-3 opacity-40" style={{ color: 'var(--arrow-accent)' }} />
                <p className="text-sm max-w-sm" style={{ color: 'var(--arrow-text-secondary)' }}>
                  Pergunte sobre suas tarefas, metas, hábitos ou peça para criar algo novo.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                animate={msg.id === animatingMsgId && msg.role === 'assistant'}
                onAnimationDone={() => setAnimatingMsgId(null)}
              />
            ))}
            {showOptimisticUser && (
              <ChatMessage
                message={{
                  id: 'optimistic-user',
                  conversation_id: activeId || '',
                  role: 'user',
                  content: optimisticUser!,
                  created_at: new Date().toISOString(),
                }}
              />
            )}
            {sending && <TypingIndicator />}
            {pending && (
              <ToolActionCard
                preview={pending.preview}
                onConfirm={() => handleConfirm(true)}
                onCancel={() => handleConfirm(false)}
                loading={confirmTool.isPending}
              />
            )}
          </div>
          <ChatInput
            onSend={handleSend}
            model={activeModel}
            onModelChange={handleModelChange}
            modelSaving={saveModel.isPending}
            onNewChat={handleNewConversation}
            disabled={!configured}
            loading={sending || confirmTool.isPending}
          />
        </div>
      </div>
    </motion.div>
  );
}
