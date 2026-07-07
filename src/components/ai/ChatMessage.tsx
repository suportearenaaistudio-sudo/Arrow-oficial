import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { AIMessage } from '@/lib/ai-types';
import MarkdownContent from '@/components/ai/MarkdownContent';
import { formatTokenCount } from '@/lib/ai-constants';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: AIMessage;
  animate?: boolean;
  onAnimationDone?: () => void;
}

function useTypewriter(text: string, enabled: boolean) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const step = () => {
      i = Math.min(text.length, i + Math.max(2, Math.ceil(text.length / 80)));
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, enabled]);

  return displayed;
}

export default function ChatMessage({ message, animate, onAnimationDone }: ChatMessageProps) {
  const { theme, isDark } = useTheme();
  const isUser = message.role === 'user';
  const tokensIn = message.tokens_in ?? 0;
  const tokensOut = message.tokens_out ?? 0;
  const displayed = useTypewriter(message.content, !!animate && !isUser);

  useEffect(() => {
    if (animate && !isUser && displayed === message.content) {
      onAnimationDone?.();
    }
  }, [animate, isUser, displayed, message.content, onAnimationDone]);

  if (isUser) {
    return (
      <motion.div
        layout={false}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end mb-5"
      >
        <div
          className="max-w-[78%] rounded-2xl px-4 py-2.5"
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            color: isDark ? '#0B0B0B' : 'white',
          }}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5 mb-6 max-w-[92%]"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'var(--arrow-accent-light)' }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--arrow-accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <MarkdownContent content={displayed} />
        {(tokensIn > 0 || tokensOut > 0) && displayed === message.content && (
          <p className="text-[10px] mt-2" style={{ color: 'var(--arrow-text-muted)' }}>
            {formatTokenCount(tokensIn)} in · {formatTokenCount(tokensOut)} out
          </p>
        )}
      </div>
    </motion.div>
  );
}
