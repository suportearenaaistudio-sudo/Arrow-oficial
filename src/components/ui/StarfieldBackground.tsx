// StarfieldBackground — canvas sparkle starfield with scroll parallax

import { useEffect, useRef, memo } from 'react';
import { bindScrollWake, getAppScrollY } from '@/lib/platform';
import { useVisualQuality } from '@/contexts/VisualQualityContext';

const LAYERS = [
  { count: 120, minR: 1.0, maxR: 1.5, minO: 0.25, maxO: 0.55, speed: 0.06 },
  { count: 90, minR: 1.5, maxR: 2.5, minO: 0.25, maxO: 0.55, speed: 0.13 },
  { count: 50, minR: 2.5, maxR: 3.8, minO: 0.22, maxO: 0.45, speed: 0.22 },
] as const;

const TWINKLE_RATIO = 0.22;
const TWINKLE_INTERVAL_ALTA_MS = 66;
const TWINKLE_INTERVAL_BALANCEADA_MS = 100;

interface Star {
  xPct: number;
  yPct: number;
  r: number;
  opacity: number;
  isLime: boolean;
  twinkle: boolean;
  twinkleDur: number;
  twinkleDelay: number;
  layer: number;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const ALL_STARS: Star[] = (() => {
  const rand = rng(0xcafe1234);
  const stars: Star[] = [];
  LAYERS.forEach((cfg, layer) => {
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        xPct: rand() * 100,
        yPct: rand() * 100,
        r: rand() * (cfg.maxR - cfg.minR) + cfg.minR,
        opacity: rand() * (cfg.maxO - cfg.minO) + cfg.minO,
        isLime: rand() < 0.04,
        twinkle: rand() < TWINKLE_RATIO,
        twinkleDur: 1.5 + rand() * 3.5,
        twinkleDelay: rand() * 5,
        layer,
      });
    }
  });
  return stars;
})();

const HAS_TWINKLE = ALL_STARS.some((s) => s.twinkle);

function starColor(star: Star, isDark: boolean, alpha: number): string {
  if (star.isLime) {
    return isDark ? `rgba(162,255,76,${alpha})` : `rgba(80,130,30,${alpha})`;
  }
  return isDark ? `rgba(215,230,255,${alpha})` : `rgba(30,30,60,${alpha})`;
}

function twinkleAlpha(star: Star, timeMs: number): number {
  if (!star.twinkle) return star.opacity;
  const t = (timeMs / 1000 + star.twinkleDelay) / star.twinkleDur;
  const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  return star.opacity * (0.08 + wave * 0.92);
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.35, y - r * 0.35);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.35, y + r * 0.35);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.35, y + r * 0.35);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.35, y - r * 0.35);
  ctx.closePath();
  ctx.fill();
}

export const StarfieldBackground = memo(function StarfieldBackground({ isDark = true }: { isDark?: boolean }) {
  const { quality } = useVisualQuality();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentY = useRef(0);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const sizeRef = useRef({ w: window.innerWidth, h: window.innerHeight });
  const isDarkRef = useRef(isDark);
  const rafRef = useRef(0);
  const lastDrawRef = useRef(0);
  const parallaxActiveRef = useRef(false);

  const qualityRef = useRef(quality);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = (time: number) => {
      const { w, h } = sizeRef.current;
      const rawY = getAppScrollY(scrollElRef);
      const diff = rawY - currentY.current;

      parallaxActiveRef.current = Math.abs(diff) > 0.05;
      if (parallaxActiveRef.current) {
        currentY.current += diff * 0.1;
      }

      ctx.clearRect(0, 0, w, h);

      for (const star of ALL_STARS) {
        const cfg = LAYERS[star.layer];
        const offsetY = currentY.current * cfg.speed;
        const px = (star.xPct / 100) * w;
        const py = (star.yPct / 100) * h + offsetY;
        const alpha = twinkleAlpha(star, time);
        ctx.fillStyle = starColor(star, isDarkRef.current, alpha);
        drawSparkle(ctx, px, py, star.r);
      }
    };

    const schedule = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const tick = (time: number) => {
      rafRef.current = 0;

      if (document.visibilityState === 'hidden') return;

      const twinkleInterval = qualityRef.current === 'balanceada'
        ? TWINKLE_INTERVAL_BALANCEADA_MS
        : TWINKLE_INTERVAL_ALTA_MS;
      const minInterval = parallaxActiveRef.current ? 0 : twinkleInterval;
      if (minInterval > 0 && time - lastDrawRef.current < minInterval) {
        if (HAS_TWINKLE) schedule();
        return;
      }

      draw(time);
      lastDrawRef.current = time;

      if (parallaxActiveRef.current || HAS_TWINKLE) {
        schedule();
      }
    };

    const wake = () => schedule();
    document.addEventListener('scroll', wake, { capture: true, passive: true });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule();
      else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const unbindScroll = bindScrollWake({ start: schedule, stop: () => {}, wake: schedule, cleanup: () => {} }, scrollElRef);
    schedule();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('scroll', wake, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      unbindScroll();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[3]"
      style={{ contain: 'strict', transform: 'translateZ(0)' }}
    />
  );
});
