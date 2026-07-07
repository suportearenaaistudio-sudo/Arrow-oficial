import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, ChevronDown, Loader2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MAX_USER_MESSAGE_CHARS,
  GEMINI_MODEL_PRESETS,
  formatModelLabel,
  estimateTokens,
} from '@/lib/ai-constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  model?: string;
  onModelChange?: (model: string) => void;
  modelSaving?: boolean;
  onNewChat?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ChatInput({
  onSend,
  model,
  onModelChange,
  modelSaving,
  onNewChat,
  disabled,
  loading,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, loading, onSend]);

  const chars = text.length;
  const tokens = estimateTokens(text);
  const canSend = Boolean(text.trim()) && !disabled && !loading;
  const displayModel = model ? formatModelLabel(model) : 'Modelo';
  const modelInPresets = model ? GEMINI_MODEL_PRESETS.includes(model as (typeof GEMINI_MODEL_PRESETS)[number]) : false;

  return (
    <div className="flex-shrink-0 px-2 lg:px-3 pt-1 pb-2">
      <div
        className="arrow-chat-input flex items-center gap-0.5 rounded-[22px] px-1.5 py-1 transition-colors duration-150"
        style={{
          background: 'var(--arrow-bg-elevated)',
          border: '1px solid var(--arrow-border)',
        }}
      >
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            disabled={disabled || loading}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-colors hover:opacity-80"
            style={{ color: 'var(--arrow-text-muted)' }}
            title="Nova conversa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_USER_MESSAGE_CHARS))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Envie uma mensagem..."
          disabled={disabled || loading}
          rows={1}
          className="arrow-chat-textarea flex-1 min-w-0 py-1 px-1 text-sm outline-none resize-none bg-transparent border-0 shadow-none disabled:opacity-50 leading-snug max-h-[120px] placeholder:opacity-50 focus:ring-0 focus:outline-none"
          style={{ color: 'var(--arrow-text-primary)' }}
        />

        <div className="flex items-center gap-0.5 flex-shrink-0 pr-0.5">
          {onModelChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled || modelSaving}>
                <button
                  type="button"
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[11px] font-medium outline-none disabled:opacity-50 transition-colors hover:opacity-80 max-w-[8.5rem]"
                  style={{ color: 'var(--arrow-text-secondary)' }}
                >
                  {modelSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                  ) : (
                    <span className="truncate">{displayModel}</span>
                  )}
                  <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={8}
                className="min-w-[11rem] rounded-xl p-1"
                style={{
                  background: 'var(--arrow-bg-card)',
                  borderColor: 'var(--arrow-border)',
                  color: 'var(--arrow-text-primary)',
                }}
              >
                <DropdownMenuRadioGroup
                  value={model}
                  onValueChange={(value) => {
                    if (value && value !== model) onModelChange(value);
                  }}
                >
                  {GEMINI_MODEL_PRESETS.map((preset) => (
                    <DropdownMenuRadioItem
                      key={preset}
                      value={preset}
                      className="text-xs rounded-lg cursor-pointer"
                      style={{ color: 'var(--arrow-text-primary)' }}
                    >
                      {formatModelLabel(preset)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {model && !modelInPresets && (
                  <>
                    <DropdownMenuSeparator style={{ background: 'var(--arrow-border)' }} />
                    <DropdownMenuRadioItem
                      value={model}
                      className="text-xs rounded-lg cursor-pointer"
                      style={{ color: 'var(--arrow-text-primary)' }}
                    >
                      {formatModelLabel(model)} (atual)
                    </DropdownMenuRadioItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'transparent',
              color: canSend ? 'var(--arrow-text-primary)' : 'var(--arrow-text-muted)',
              border: `1px solid ${canSend ? 'var(--arrow-text-muted)' : 'var(--arrow-border)'}`,
            }}
            title="Enviar"
          >
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {text.length > 0 && (
        <div
          className="flex justify-end gap-3 px-3 mt-0.5 text-[10px] tabular-nums"
          style={{ color: 'var(--arrow-text-muted)' }}
        >
          <span style={{ color: chars > MAX_USER_MESSAGE_CHARS * 0.9 ? '#ef4444' : undefined }}>
            {chars}/{MAX_USER_MESSAGE_CHARS}
          </span>
          <span>~{tokens} tok</span>
        </div>
      )}
    </div>
  );
}
