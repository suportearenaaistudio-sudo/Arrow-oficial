import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ArrowCardVariant = 'default' | 'interactive' | 'stat';

export interface ArrowCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ArrowCardVariant;
  onCardClick?: () => void;
  icon?: ReactNode;
  label?: string;
  value?: string;
  trend?: { value: string; positive?: boolean };
}

export const ArrowCard = forwardRef<HTMLDivElement, ArrowCardProps>(
  (
    {
      variant = 'default',
      onCardClick,
      icon,
      label,
      value,
      trend,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isInteractive = variant === 'interactive' || !!onCardClick;
    const handleClick = onCardClick ?? onClick;

    if (variant === 'stat') {
      return (
        <div
          ref={ref}
          className={cn('arrow-card arrow-card-stat', className)}
          {...props}
        >
          <div className="flex items-start justify-between gap-3">
            {icon && (
              <div className="arrow-card-stat-icon flex-shrink-0">{icon}</div>
            )}
            {isInteractive && (
              <ChevronRight
                className="w-4 h-4 flex-shrink-0 ml-auto opacity-40"
                style={{ color: 'var(--arrow-text-muted)' }}
              />
            )}
          </div>
          {label && (
            <p className="text-xs mt-3 mb-1" style={{ color: 'var(--arrow-text-secondary)' }}>
              {label}
            </p>
          )}
          {(value || trend) && (
            <div className="flex items-baseline gap-2">
              {value && (
                <span
                  className="text-2xl font-semibold tracking-tight"
                  style={{ color: 'var(--arrow-text-primary)' }}
                >
                  {value}
                </span>
              )}
              {trend && (
                <span
                  className="text-sm font-medium"
                  style={{ color: trend.positive ? 'var(--arrow-accent)' : '#ef4444' }}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
              )}
            </div>
          )}
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        className={cn(
          'arrow-card',
          isInteractive && 'arrow-card-interactive cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
        {variant === 'interactive' && (
          <ChevronRight
            className="arrow-card-chevron w-4 h-4 absolute top-5 right-5 opacity-40"
            style={{ color: 'var(--arrow-text-muted)' }}
          />
        )}
      </div>
    );
  },
);

ArrowCard.displayName = 'ArrowCard';
