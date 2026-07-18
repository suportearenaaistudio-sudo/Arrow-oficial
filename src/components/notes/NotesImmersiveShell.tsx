import { ReactNode } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlatformChrome } from '@/hooks/usePlatformChrome';

interface NotesImmersiveShellProps {
  children: ReactNode;
}

export default function NotesImmersiveShell({ children }: NotesImmersiveShellProps) {
  const { theme } = useTheme();
  const { collapsed } = useSidebar();
  const { topBarTotalHeight } = usePlatformChrome(collapsed);

  const shellHeight = `calc(100vh - ${topBarTotalHeight}px - 3rem)`;

  return (
    <div
      className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 -mb-6 lg:-mb-8 flex flex-col overflow-hidden"
      style={{
        height: shellHeight,
        background: theme.bg,
      }}
    >
      {children}
    </div>
  );
}
