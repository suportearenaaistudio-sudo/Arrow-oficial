// RainBackground.tsx — Visual rain effect (optimized canvas loop)

import { useEffect, useRef, memo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

interface Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface Lightning {
  startTime: number;
  duration: number;
  intensity: number;
  branches: { x1: number; y1: number; x2: number; y2: number; width: number }[];
}

function generateLightningBranches(startX: number, startY: number, endY: number) {
  const branches: Lightning['branches'] = [];
  let x = startX;
  let y = startY;
  const segments = 8 + Math.floor(Math.random() * 8);
  const stepY = (endY - startY) / segments;

  for (let i = 0; i < segments; i++) {
    const nx = x + (Math.random() - 0.5) * 80;
    const ny = y + stepY;
    branches.push({ x1: x, y1: y, x2: nx, y2: ny, width: 2.5 - (i / segments) * 2 });

    if (Math.random() < 0.3) {
      const bx = nx + (Math.random() - 0.5) * 60;
      const by = ny + stepY * 0.6;
      branches.push({ x1: nx, y1: ny, x2: bx, y2: by, width: 1 });
    }

    x = nx;
    y = ny;
  }
  return branches;
}

export const RainBackground = memo(function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const dropsRef = useRef<Drop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const lightningRef = useRef<Lightning | null>(null);
  const lastLightningRef = useRef(0);
  const { theme } = useTheme();
  const density = theme.rainDensity ?? 1;
  const isDark = theme.isDark;
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const initDrops = useCallback((w: number, h: number) => {
    const drops: Drop[] = [];
    const count = Math.floor((w * h) / 3000 * density);
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: (8 + Math.random() * 8) * (0.6 + density * 0.4),
        length: (10 + Math.random() * 15) * (0.7 + density * 0.3),
        opacity: (0.1 + Math.random() * 0.25) * (isDarkRef.current ? 1 : 0.5),
      });
    }
    dropsRef.current = drops;
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let time = 0;
    let cardRects: DOMRect[] = [];
    let lastCardScan = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initDrops(w, h);
    }

    function scanCards() {
      const cards = document.querySelectorAll('.arrow-card');
      cardRects = Array.from(cards).map((el) => el.getBoundingClientRect());
    }

    function schedule() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      rafRef.current = 0;

      if (document.visibilityState === 'hidden') return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      time += 16;

      if (time - lastCardScan > 500) {
        scanCards();
        lastCardScan = time;
      }

      ctx.clearRect(0, 0, w, h);

      const drops = dropsRef.current;
      const splashes = splashesRef.current;
      const dark = isDarkRef.current;

      const lightning = lightningRef.current;
      if (lightning) {
        const elapsed = time - lightning.startTime;
        const progress = elapsed / lightning.duration;

        if (progress < 1) {
          const flashAlpha = lightning.intensity * Math.max(0, 1 - progress * 2) * 0.15;
          if (flashAlpha > 0.01) {
            ctx.fillStyle = `rgba(200, 210, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, w, h);
          }

          const forkAlpha = lightning.intensity * Math.max(0, 1 - progress * 1.5);
          if (forkAlpha > 0.05) {
            ctx.strokeStyle = `rgba(200, 210, 255, ${forkAlpha})`;
            ctx.lineWidth = 1.5;
            for (const b of lightning.branches) {
              ctx.lineWidth = b.width;
              ctx.beginPath();
              ctx.moveTo(b.x1, b.y1);
              ctx.lineTo(b.x2, b.y2);
              ctx.stroke();
            }
          }
        } else {
          lightningRef.current = null;
        }
      }

      if (time - lastLightningRef.current > 6000 + Math.random() * 9000) {
        const forkX = w * 0.15 + Math.random() * w * 0.7;
        lightningRef.current = {
          startTime: time,
          duration: 400 + Math.random() * 600,
          intensity: 0.5 + Math.random() * 0.5,
          branches: generateLightningBranches(forkX, -10, h * 0.5 + Math.random() * h * 0.3),
        };
        lastLightningRef.current = time;

        const currentIntensity = localStorage.getItem('arrow-rain-intensity') || 'off';
        if (currentIntensity !== 'sutil') {
          const playThunder = (window as Window & { __playThunder?: () => void }).__playThunder;
          if (playThunder) {
            setTimeout(playThunder, 200 + Math.random() * 1200);
          }
        }
      }

      const dropColor = dark ? '160, 185, 220' : '80, 100, 140';
      const splashColor = dropColor;
      const windAngle = 0.12;
      ctx.lineCap = 'round';

      for (const drop of drops) {
        const prevY = drop.y;
        drop.y += drop.speed;
        drop.x += drop.speed * windAngle;

        for (const rect of cardRects) {
          const cardTop = rect.top;
          if (
            prevY < cardTop && drop.y >= cardTop &&
            drop.x >= rect.left - 5 && drop.x <= rect.right + 5 &&
            splashes.length < 250
          ) {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let s = 0; s < count; s++) {
              splashes.push({
                x: drop.x,
                y: cardTop,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -(0.5 + Math.random() * 1.5),
                life: 0,
                maxLife: 6 + Math.random() * 8,
                size: 0.3 + Math.random() * 0.5,
              });
            }
            drop.y = -drop.length - Math.random() * 100;
            drop.x = Math.random() * w;
            break;
          }
        }

        if (drop.y > h + 10) {
          if (splashes.length < 250) {
            const splashCount = 2 + Math.floor(Math.random() * 3);
            for (let s = 0; s < splashCount; s++) {
              splashes.push({
                x: drop.x, y: h - 2,
                vx: (Math.random() - 0.5) * 3,
                vy: -(1 + Math.random() * 3),
                life: 0,
                maxLife: 10 + Math.random() * 15,
                size: 0.5 + Math.random(),
              });
            }
          }
          drop.y = -drop.length - Math.random() * 100;
          drop.x = Math.random() * w;
        }

        if (drop.x > w + 20) drop.x = -10;

        ctx.strokeStyle = `rgba(${dropColor}, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * windAngle, drop.y - drop.length);
        ctx.stroke();
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.3;
        sp.life++;

        if (sp.life >= sp.maxLife) {
          splashes.splice(i, 1);
          continue;
        }

        const alpha = (1 - sp.life / sp.maxLife) * 0.4;
        ctx.fillStyle = `rgba(${splashColor}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }

      schedule();
    }

    resize();
    window.addEventListener('resize', resize);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule();
      else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    schedule();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initDrops]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background: 'transparent', contain: 'strict', transform: 'translateZ(0)' }}
    />
  );
});
