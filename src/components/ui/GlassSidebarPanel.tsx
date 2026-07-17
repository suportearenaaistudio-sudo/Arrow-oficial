import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export interface GlassSidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface GlassSidebarSection {
  title?: string;
  items: GlassSidebarItem[];
}

interface GlassSidebarPanelProps {
  sections: GlassSidebarSection[];
  activeId: string | null;
  onChange: (id: string) => void;
  footer?: React.ReactNode;
  activeStyle?: 'outline' | 'pill';
}

export default function GlassSidebarPanel({
  sections,
  activeId,
  onChange,
  footer,
  activeStyle = 'pill',
}: GlassSidebarPanelProps) {
  const { theme, isDark } = useTheme();

  return (
    <div
      className="flex flex-col rounded-[20px] p-2 h-full"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.border}`,
      }}
    >
      <div className="flex-1 space-y-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.title || si}>
            {si > 0 && (
              <div
                className="mb-2"
                style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : theme.border}` }}
              />
            )}
            {section.title && (
              <p
                className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.id === activeId;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-150 text-left"
                    style={{
                      color: isActive ? theme.textPrimary : theme.textSecondary,
                      fontWeight: isActive ? 600 : 500,
                      background:
                        isActive && activeStyle === 'pill'
                          ? isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'
                          : 'transparent',
                      border:
                        isActive && activeStyle === 'outline'
                          ? `1px solid ${isDark ? 'rgba(255,255,255,0.5)' : theme.border}`
                          : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.25 : 2} />}
                    <span className="text-[13px] truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {footer && (
        <div className="pt-2 mt-2 flex-shrink-0" style={{ borderTop: `1px solid ${theme.border}` }}>
          {footer}
        </div>
      )}
    </div>
  );
}
