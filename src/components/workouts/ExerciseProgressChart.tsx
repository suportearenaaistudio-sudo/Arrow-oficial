import { useMemo, useState } from 'react';
import type { ExerciseProgressPoint } from '@/types/arrow';

type Metric = 'max_load_kg' | 'estimated_1rm' | 'max_reps';

const METRICS: Array<{ id: Metric; label: string; suffix: string }> = [
  { id: 'max_load_kg', label: 'Carga', suffix: 'kg' },
  { id: 'estimated_1rm', label: 'e1RM', suffix: 'kg' },
  { id: 'max_reps', label: 'Repetições', suffix: 'reps' },
];

export default function ExerciseProgressChart({
  points,
}: {
  points: ExerciseProgressPoint[];
}) {
  const [metric, setMetric] = useState<Metric>('max_load_kg');
  const selected = METRICS.find((item) => item.id === metric)!;
  const chart = useMemo(() => {
    const values = points.map((point) => Number(point[metric] ?? 0));
    const max = Math.max(1, ...values);
    const min = Math.min(0, ...values);
    const range = Math.max(1, max - min);
    const left = 48;
    const top = 18;
    const width = 560;
    const height = 160;
    const coordinates = values.map((value, index) => ({
      x: points.length === 1 ? left + width / 2 : left + (index / (points.length - 1)) * width,
      y: top + height - ((value - min) / range) * height,
      value,
      date: points[index].date,
    }));
    return { coordinates, min, max, left, top, width, height };
  }, [metric, points]);

  if (!points.length) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--arrow-text-muted)' }}>
          Registre pelo menos um treino para gerar o gráfico.
        </p>
      </div>
    );
  }

  const first = chart.coordinates[0];
  const last = chart.coordinates[chart.coordinates.length - 1];
  const change = last.value - first.value;

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3 items-center mb-3">
        <div className="inline-flex rounded-xl p-1" style={{ background: 'var(--arrow-bg-elevated)' }}>
          {METRICS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMetric(item.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: metric === item.id ? 'var(--arrow-accent)' : 'transparent',
                color:
                  metric === item.id
                    ? '#fff'
                    : 'var(--arrow-text-muted)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p
          className="text-xs font-semibold"
          style={{ color: change >= 0 ? '#22c55e' : '#ef4444' }}
        >
          {change >= 0 ? '+' : ''}
          {Math.round(change * 10) / 10} {selected.suffix} no período
        </p>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 640 220"
          className="w-full min-w-[520px]"
          role="img"
          aria-label={`Gráfico de evolução de ${selected.label}`}
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = chart.top + chart.height * ratio;
            const value = chart.max - (chart.max - chart.min) * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={chart.left}
                  x2={chart.left + chart.width}
                  y1={y}
                  y2={y}
                  stroke="var(--arrow-border)"
                  strokeDasharray="4 5"
                />
                <text
                  x={chart.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--arrow-text-muted)"
                >
                  {Math.round(value * 10) / 10}
                </text>
              </g>
            );
          })}
          <polyline
            points={chart.coordinates.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke="var(--arrow-accent)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {chart.coordinates.map((point, index) => (
            <g key={`${point.date}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="var(--arrow-bg)"
                stroke="var(--arrow-accent)"
                strokeWidth="3"
              >
                <title>
                  {new Date(`${point.date}T12:00:00`).toLocaleDateString('pt-BR')}: {point.value}{' '}
                  {selected.suffix}
                </title>
              </circle>
              {(index === 0 || index === chart.coordinates.length - 1 || points.length <= 5) && (
                <text
                  x={point.x}
                  y={chart.top + chart.height + 24}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--arrow-text-muted)"
                >
                  {new Date(`${point.date}T12:00:00`).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
