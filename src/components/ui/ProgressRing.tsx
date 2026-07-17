interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  glow?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--arrow-accent)',
  trackColor = 'rgba(128,128,128,0.15)',
  glow = false,
  children,
  className = '',
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, progress));
  const dashOffset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
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
          className="transition-[stroke-dashoffset] duration-500 ease-out"
          style={
            glow
              ? { filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.6))' }
              : undefined
          }
        />
      </svg>
      {children && (
        <div className="relative z-10 flex flex-col items-center justify-center">{children}</div>
      )}
    </div>
  );
}
