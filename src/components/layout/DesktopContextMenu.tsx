import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Settings, Sun, Moon, PanelLeft, PanelLeftClose, RotateCw,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebarOptional } from '@/contexts/SidebarContext';
import { useDesktopContextMenuItems } from '@/contexts/DesktopContextMenuContext';
import { getDesktopContextPageLabel } from '@/lib/desktop-context-menu-pages';
import { isDesktop } from '@/lib/platform';

interface MenuPos {
  x: number;
  y: number;
}

const SKIP_SELECTOR = 'input, textarea, select, [contenteditable="true"], .cm-editor, .cm-content';

function getPortalRoot() {
  return document.getElementById('root') ?? document.body;
}

export default function DesktopContextMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDark, toggleLightDark } = useTheme();
  const sidebar = useSidebarOptional();
  const pageItems = useDesktopContextMenuItems();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const inAppShell = location.pathname !== '/setup';
  const pageLabel = getDesktopContextPageLabel(location.pathname);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) setHoveredId(null);
  }, [open]);

  useEffect(() => {
    if (!isDesktop()) return;

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(SKIP_SELECTOR)) return;

      e.preventDefault();
      e.stopPropagation();

      const padding = 8;
      const menuW = 220;
      const menuH = 320;
      const x = Math.min(e.clientX, window.innerWidth - menuW - padding);
      const y = Math.min(e.clientY, window.innerHeight - menuH - padding);

      setPos({ x: Math.max(padding, x), y: Math.max(padding, y) });
      setOpen(true);
    };

    document.addEventListener('contextmenu', onContextMenu, { capture: true });
    return () => document.removeEventListener('contextmenu', onContextMenu, { capture: true });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const run = (fn: () => void) => {
    fn();
    close();
  };

  if (!isDesktop() || !open) return null;

  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.18)' : theme.accentLight;
  const hoverIconColor = isDark ? '#ffffff' : theme.accent;

  const Item = ({
    itemId,
    label,
    icon: Icon,
    onClick,
    disabled,
  }: {
    itemId: string;
    label: string;
    icon: typeof Settings;
    onClick: () => void;
    disabled?: boolean;
  }) => {
    const isHovered = hoveredId === itemId;

    return (
      <button
        type="button"
        disabled={disabled}
        className="arrow-desktop-context-menu-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] disabled:opacity-40 disabled:pointer-events-none"
        style={{
          color: theme.textPrimary,
          background: isHovered ? hoverBg : 'transparent',
        }}
        data-hovered={isHovered ? 'true' : undefined}
        data-item-id={itemId}
        data-tauri-drag-region={false}
        onPointerEnter={() => {
          if (!disabled) setHoveredId(itemId);
        }}
        onPointerLeave={() => {
          setHoveredId((current) => (current === itemId ? null : current));
        }}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          run(onClick);
        }}
      >
        <Icon
          className="arrow-desktop-context-menu-icon w-4 h-4 flex-shrink-0"
          strokeWidth={1.5}
          style={{ color: isHovered ? hoverIconColor : theme.textSecondary }}
        />
        {label}
      </button>
    );
  };

  const Separator = () => (
    <div className="my-1 mx-2" style={{ borderTop: `1px solid ${theme.border}` }} />
  );

  return createPortal(
    <>
      <div
        className="arrow-desktop-context-menu-backdrop fixed inset-0 z-[9998]"
        data-tauri-drag-region={false}
        onPointerDown={(e) => {
          e.preventDefault();
          close();
        }}
      />
      <div
        ref={menuRef}
        className="arrow-desktop-context-menu fixed z-[9999] min-w-[210px] rounded-xl py-1.5 px-1 shadow-2xl"
        data-tauri-drag-region={false}
        style={{
          left: pos.x,
          top: pos.y,
          background: isDark ? 'rgba(28,28,30,0.96)' : 'rgba(255,255,255,0.96)',
          border: `1px solid ${theme.border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        role="menu"
        onPointerMove={(e) => {
          const target = (e.target as HTMLElement).closest('[data-item-id]');
          const nextId = target?.getAttribute('data-item-id');
          setHoveredId((current) => (current === nextId ? current : nextId));
        }}
        onPointerLeave={() => setHoveredId(null)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {inAppShell && pageLabel && pageItems.length > 0 && (
          <>
            <p
              className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide pointer-events-none"
              style={{ color: theme.textMuted }}
            >
              {pageLabel}
            </p>
            {pageItems.map((item) => (
              <Item
                key={item.id}
                itemId={item.id}
                label={item.label}
                icon={item.icon}
                onClick={item.onClick}
                disabled={item.disabled}
              />
            ))}
            <Separator />
          </>
        )}

        <Item
          itemId="theme-toggle"
          label={isDark ? 'Modo claro' : 'Modo escuro'}
          icon={isDark ? Sun : Moon}
          onClick={toggleLightDark}
        />

        {inAppShell && sidebar && (
          <Item
            itemId="sidebar-toggle"
            label={sidebar.collapsed ? 'Expandir menu' : 'Recolher menu'}
            icon={sidebar.collapsed ? PanelLeft : PanelLeftClose}
            onClick={sidebar.toggle}
          />
        )}

        {inAppShell && (
          <Item itemId="settings" label="Configurações" icon={Settings} onClick={() => navigate('/settings')} />
        )}

        {import.meta.env.DEV && (
          <>
            <Separator />
            <Item itemId="reload" label="Recarregar" icon={RotateCw} onClick={() => window.location.reload()} />
          </>
        )}
      </div>
    </>,
    getPortalRoot(),
  );
}
