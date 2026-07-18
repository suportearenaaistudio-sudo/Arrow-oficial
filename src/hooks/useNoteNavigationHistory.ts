import { useCallback, useRef, useState } from 'react';

export function useNoteNavigationHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const indexRef = useRef(-1);
  const skipPush = useRef(false);
  const [, bump] = useState(0);

  const push = useCallback((noteId: string) => {
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    setHistory((prev) => {
      const trimmed = prev.slice(0, indexRef.current + 1);
      if (trimmed[trimmed.length - 1] === noteId) return prev;
      const next = [...trimmed, noteId];
      indexRef.current = next.length - 1;
      return next;
    });
    bump((n) => n + 1);
  }, []);

  const canGoBack = indexRef.current > 0;
  const canGoForward = indexRef.current >= 0 && indexRef.current < history.length - 1;

  const goBack = useCallback(() => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    skipPush.current = true;
    bump((n) => n + 1);
    return history[indexRef.current] ?? null;
  }, [history]);

  const goForward = useCallback(() => {
    if (indexRef.current >= history.length - 1) return null;
    indexRef.current += 1;
    skipPush.current = true;
    bump((n) => n + 1);
    return history[indexRef.current] ?? null;
  }, [history]);

  return { push, goBack, goForward, canGoBack, canGoForward };
}
