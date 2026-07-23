import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DesktopContextMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

interface DesktopContextMenuContextValue {
  pageItems: DesktopContextMenuItem[];
  registerPageItems: (id: string, items: DesktopContextMenuItem[]) => void;
  unregisterPageItems: (id: string) => void;
}

const DesktopContextMenuContext = createContext<DesktopContextMenuContextValue | null>(null);

export function DesktopContextMenuProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Map<string, DesktopContextMenuItem[]>>(
    () => new Map(),
  );

  const registerPageItems = useCallback((id: string, items: DesktopContextMenuItem[]) => {
    setRegistrations((prev) => {
      const next = new Map(prev);
      next.set(id, items);
      return next;
    });
  }, []);

  const unregisterPageItems = useCallback((id: string) => {
    setRegistrations((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const pageItems = useMemo(() => {
    const all: DesktopContextMenuItem[] = [];
    for (const items of registrations.values()) {
      all.push(...items);
    }
    return all;
  }, [registrations]);

  return (
    <DesktopContextMenuContext.Provider
      value={{ pageItems, registerPageItems, unregisterPageItems }}
    >
      {children}
    </DesktopContextMenuContext.Provider>
  );
}

export function usePageContextMenu(
  factory: () => DesktopContextMenuItem[],
  deps: unknown[],
) {
  const ctx = useContext(DesktopContextMenuContext);
  const id = useId();
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    if (!ctx) return;
    ctx.registerPageItems(id, factoryRef.current());
    return () => ctx.unregisterPageItems(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ctx, ...deps]);
}

export function useDesktopContextMenuItems() {
  return useContext(DesktopContextMenuContext)?.pageItems ?? [];
}
