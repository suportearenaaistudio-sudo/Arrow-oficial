import { useCallback, useRef } from 'react';

interface RingDialProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  formatValue: (value: number) => React.ReactNode;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

function clampStep(value: number, min: number, max: number, step: number) {
  const stepped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, stepped));
}

function valueToProgress(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function pointerToValue(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  min: number,
  max: number,
  step: number,
) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const angle = Math.atan2(clientY - cy, clientX - cx);
  const deg = (angle * (180 / Math.PI) + 90 + 360) % 360;
  const raw = min + (deg / 360) * (max - min);
  return clampStep(raw, min, max, step);
}

export default function RingDial({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  formatValue,
  color = 'var(--arrow-accent)',
  size = 108,
  strokeWidth = 10,
}: RingDialProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = valueToProgress(value, min, max);
  const dashOffset = circumference * (1 - progress / 100);
  const center = size / 2;

  // Knob at end of arc (arc starts at 12 o'clock, no SVG rotation needed)
  const knobAngle = (progress / 100) * 2 * Math.PI - Math.PI / 2;
  const knobX = center + r * Math.cos(knobAngle);
  const knobY = center + r * Math.sin(knobAngle);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      onChange(pointerToValue(clientX, clientY, rect, min, max, step));
    },
    [max, min, onChange, step],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    rootRef.current?.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    rootRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--arrow-text-muted)' }}>
        {label}
      </p>
      <div
        ref={rootRef}
        className="relative touch-none cursor-pointer"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            onChange(clampStep(value + step, min, max, step));
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            onChange(clampStep(value - step, min, max, step));
          }
        }}
      >
        <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth={strokeWidth}
            transform={`rotate(-90 ${center} ${center})`}
          />
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
          <circle
            cx={knobX}
            cy={knobY}
            r={strokeWidth * 0.65}
            fill="#fff"
            stroke={color}
            strokeWidth={2}
            className="pointer-events-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {formatValue(value)}
        </div>
      </div>
    </div>
  );
}
