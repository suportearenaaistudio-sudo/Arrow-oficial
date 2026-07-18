import { useTheme } from '@/contexts/ThemeContext';

interface TogglePillProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export default function TogglePill({
  selected,
  onClick,
  children,
  disabled,
  className = '',
  title,
}: TogglePillProps) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`font-semibold transition-opacity ${disabled ? 'opacity-35' : 'hover:opacity-90'} ${className}`}
      style={{
        background: selected ? theme.accent : theme.accentLight,
        color: selected ? theme.accentForeground : theme.accent,
        border: `1.5px solid ${selected ? theme.accent : 'var(--arrow-border)'}`,
      }}
    >
      {children}
    </button>
  );
}
