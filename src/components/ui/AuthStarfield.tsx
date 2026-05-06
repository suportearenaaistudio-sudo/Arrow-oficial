// AuthStarfield.tsx
// ✦ Horizontal drifting starfield for auth page

import { memo, useEffect, useRef } from 'react';

const STAR_COUNT = 200;
const SPARKLE = 'M 0 -1 L 0.35 -0.35 L 1 0 L 0.35 0.35 L 0 1 L -0.35 0.35 L -1 0 L -0.35 -0.35 Z';

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
  isLime: boolean;
  twinkle: boolean;
  twinkleDur: number;
  twinkleDelay: number;
}

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

const rand = seededRng(0xdead1234);
const STARS: Star[] = Array.from({ length: STAR_COUNT }, () => ({
  x: rand() * 100,
  y: rand() * 100,
  r: 0.8 + rand() * 2.5,
  opacity: 0.15 + rand() * 0.5,
  speed: 0.003 + rand() * 0.012, // % per frame
  isLime: rand() < 0.06,
  twinkle: rand() < 0.25,
  twinkleDur: 1.5 + rand() * 4,
  twinkleDelay: rand() * 6,
}));

export const AuthStarfield = memo(function AuthStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef(STARS.map(s => ({ ...s })));
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const stars = starsRef.current;
      time += 0.016;

      for (const star of stars) {
        // Drift horizontally
        star.x += star.speed;
        if (star.x > 102) star.x = -2;

        const px = (star.x / 100) * w;
        const py = (star.y / 100) * h;

        // Twinkle
        let alpha = star.opacity;
        if (star.twinkle) {
          const t = (time + star.twinkleDelay) / star.twinkleDur;
          alpha *= 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI));
        }

        // Color
        if (star.isLime) {
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(215, 230, 255, ${alpha})`;
        }

        // Draw sparkle shape
        const s = star.r;
        ctx.save();
        ctx.translate(px, py);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.35, -s * 0.35);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.35, s * 0.35);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.35, -s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
});
