import type { ContextStats } from '@/lib/ai-types';
import { formatTokenCount } from '@/lib/ai-constants';

interface ContextUsageBarProps {
  stats?: ContextStats;
}

export default function ContextUsageBar({ stats }: ContextUsageBarProps) {
  if (!stats) return null;

  const pct = Math.min(100, (stats.estimatedTokens / stats.maxTokens) * 100);

  return (
    <div
      className="flex items-center gap-2 text-xs"
      title={`Prompt estimado: ${stats.estimatedTokens} / ${stats.maxTokens} tokens`}
    >
      <span style={{ color: 'var(--arrow-text-muted)' }}>ctx</span>
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--arrow-border)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct > 85 ? '#ef4444' : 'var(--arrow-accent)',
          }}
        />
      </div>
      <span style={{ color: 'var(--arrow-text-secondary)' }}>
        {formatTokenCount(stats.estimatedTokens)}/{formatTokenCount(stats.maxTokens)}
      </span>
      {stats.truncated && (
        <span className="text-[10px]" style={{ color: '#f59e0b' }}>truncado</span>
      )}
    </div>
  );
}
