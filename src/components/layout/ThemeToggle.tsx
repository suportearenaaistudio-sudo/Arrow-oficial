import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ThemeToggle() {
  const { isDark, theme, appearanceMode, toggleLightDark } = useTheme();

  const label =
    appearanceMode === 'system'
      ? `Automático (${isDark ? 'escuro' : 'claro'})`
      : isDark
        ? 'Modo escuro — Graphite'
        : 'Modo claro — Aurora Boreal';

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleLightDark}
          aria-label={label}
          className="relative w-[52px] h-7 rounded-full flex items-center flex-shrink-0 transition-colors duration-300"
          style={{
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <Sun
            className="absolute left-1.5 w-3.5 h-3.5 z-10 transition-opacity duration-300"
            style={{
              color: isDark ? theme.textMuted : theme.accent,
              opacity: isDark ? 0.35 : 1,
            }}
            strokeWidth={1.75}
          />
          <Moon
            className="absolute right-1.5 w-3.5 h-3.5 z-10 transition-opacity duration-300"
            style={{
              color: isDark ? theme.accent : theme.textMuted,
              opacity: isDark ? 1 : 0.35,
            }}
            strokeWidth={1.75}
          />
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="absolute top-0.5 w-6 h-6 rounded-full shadow-sm"
            style={{
              left: isDark ? 24 : 2,
              background: isDark
                ? 'linear-gradient(135deg, #3a3a3c, #1c1c1e)'
                : 'linear-gradient(135deg, #fff, #f5f5f7)',
              boxShadow: isDark
                ? '0 1px 4px rgba(0,0,0,0.4)'
                : '0 1px 4px rgba(0,0,0,0.12)',
            }}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
