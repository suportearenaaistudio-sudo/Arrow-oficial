import { useCallback, useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTheme } from '@/contexts/ThemeContext';
import { isWindowsDesktop } from '@/lib/platform';

export default function WindowControls() {
  const { theme, isDark } = useTheme();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isWindowsDesktop()) return;

    const appWindow = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;

    const syncMaximized = (value: boolean) => {
      if (!disposed) {
        setMaximized(value);
        document.documentElement.classList.toggle('is-window-maximized', value);
      }
    };

    appWindow.isMaximized().then(syncMaximized);

    appWindow.onResized(async () => {
      syncMaximized(await appWindow.isMaximized());
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      disposed = true;
      unlisten?.();
      document.documentElement.classList.remove('is-window-maximized');
    };
  }, []);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void getCurrentWindow().minimize();
  }, []);

  const handleToggleMaximize = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    setMaximized(await appWindow.isMaximized());
  }, []);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void getCurrentWindow().close();
  }, []);

  if (!isWindowsDesktop()) return null;

  const hover = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="arrow-window-controls flex items-center gap-0.5 ml-1 flex-shrink-0">
      <WinBtn label="Minimizar" hover={hover} color={theme.textSecondary} onClick={handleMinimize}>
        <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
      </WinBtn>
      <WinBtn
        label={maximized ? 'Restaurar' : 'Maximizar'}
        hover={hover}
        color={theme.textSecondary}
        onClick={handleToggleMaximize}
      >
        {maximized ? (
          <Copy className="w-3 h-3" strokeWidth={1.5} />
        ) : (
          <Square className="w-3 h-3" strokeWidth={1.5} />
        )}
      </WinBtn>
      <WinBtn
        label="Fechar"
        hover="rgba(239,68,68,0.15)"
        hoverColor="#ef4444"
        color={theme.textSecondary}
        onClick={handleClose}
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </WinBtn>
    </div>
  );
}

function WinBtn({
  label,
  hover,
  hoverColor,
  color,
  onClick,
  children,
}: {
  label: string;
  hover: string;
  hoverColor?: string;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="arrow-window-control w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150"
      style={{ color }}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hover;
        if (hoverColor) e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = color;
      }}
    >
      {children}
    </button>
  );
}
