import type { WeeklyTokenUsage } from '@/lib/ai-types';
import { formatTokenCount } from '@/lib/ai-constants';

interface WeeklyTokenCounterProps {
  usage?: WeeklyTokenUsage;
  compact?: boolean;
}

export default function WeeklyTokenCounter({ usage, compact }: WeeklyTokenCounterProps) {
  if (!usage) return null;

  const total = usage.tokensTotal ?? 0;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
        style={{ background: 'var(--arrow-accent-light)', color: 'var(--arrow-accent)' }}
        title={`Entrada: ${usage.tokensIn} · Saída: ${usage.tokensOut} · ${usage.requestCount} requisições esta semana`}
      >
        <span>Semana:</span>
        <span>{formatTokenCount(total)} tokens</span>
      </div>
    );
  }

  return (
    <div className="arrow-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--arrow-text-muted)' }}>
        Uso esta semana
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--arrow-text-primary)' }}>
            {formatTokenCount(usage.tokensIn)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>entrada</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--arrow-text-primary)' }}>
            {formatTokenCount(usage.tokensOut)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>saída</p>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--arrow-accent)' }}>
            {formatTokenCount(total)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>total</p>
        </div>
      </div>
      <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--arrow-text-secondary)' }}>
        {usage.requestCount} requisições · renova na segunda-feira
      </p>
    </div>
  );
}
