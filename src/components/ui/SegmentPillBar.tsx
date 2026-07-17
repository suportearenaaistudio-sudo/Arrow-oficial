import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export interface SegmentPillItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  accent?: string;
}

interface SegmentPillBarProps {
  items: SegmentPillItem[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export default function SegmentPillBar({ items, activeId, onChange }: SegmentPillBarProps) {
  const { theme, isDark } = useTheme();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-full overflow-x-auto scrollbar-hide"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${theme.border}`,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full whitespace-nowrap transition-colors duration-150 flex-shrink-0"
            style={{
              color: isActive ? theme.textPrimary : theme.textSecondary,
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="segment-pill-active"
                className="absolute inset-0 rounded-full"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.14)' : '#ffffff',
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && (
                <Icon
                  className="w-4 h-4"
                  style={{ color: isActive ? (item.accent || theme.accent) : theme.textMuted }}
                />
              )}
              <span className="text-[13px]">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
