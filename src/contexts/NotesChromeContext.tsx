import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NotesChromeMode = 'editor' | 'graph';

export interface NotesChromeState {
  active: boolean;
  mode: NotesChromeMode;
  onNewNote: () => void;
  onNewFolder: () => void;
  onOpenGraph: () => void;
  onOpenEditor: () => void;
  onQuickSwitcher: () => void;
}

const noop = () => {};

const defaultState: NotesChromeState = {
  active: false,
  mode: 'editor',
  onNewNote: noop,
  onNewFolder: noop,
  onOpenGraph: noop,
  onOpenEditor: noop,
  onQuickSwitcher: noop,
};

interface NotesChromeContextValue extends NotesChromeState {
  register: (patch: Partial<NotesChromeState>) => void;
  reset: () => void;
}

const NotesChromeContext = createContext<NotesChromeContextValue>({
  ...defaultState,
  register: () => {},
  reset: () => {},
});

export function NotesChromeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotesChromeState>(defaultState);

  const register = useCallback((patch: Partial<NotesChromeState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({ ...state, register, reset }),
    [state, register, reset],
  );

  return (
    <NotesChromeContext.Provider value={value}>
      {children}
    </NotesChromeContext.Provider>
  );
}

export function useNotesChrome() {
  return useContext(NotesChromeContext);
}
