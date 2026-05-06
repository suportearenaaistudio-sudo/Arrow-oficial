// StarfieldBackground.tsx
// ✦ Sparkle starfield | Scroll parallax (rAF poll)

import { useEffect, useRef, memo, useState } from 'react';

// ── Config ──────────────────────────────────────────────────────────────────
const LAYERS = [
  { count: 120, minR: 1.0, maxR: 1.5,  minO: 0.25, maxO: 0.55, speed: 0.06 },
  { count: 90,  minR: 1.5, maxR: 2.5,  minO: 0.25, maxO: 0.55, speed: 0.13 },
  { count: 50,  minR: 2.5, maxR: 3.8,  minO: 0.22, maxO: 0.45, speed: 0.22 },
] as const;

const TWINKLE_RATIO = 0.22;
const LIME_DARK  = 'rgba(162,255,76,';
const WHITE_DARK = 'rgba(215,230,255,';
const LIME_LIGHT  = 'rgba(80,130,30,';
const BLACK_LIGHT = 'rgba(30,30,60,';

// ✦ 4-pointed sparkle, centered at (0,0), outer=1, inner=0.35
const SPARKLE = 'M 0 -1 L 0.35 -0.35 L 1 0 L 0.35 0.35 L 0 1 L -0.35 0.35 L -1 0 L -0.35 -0.35 Z';

// ── Seeded RNG ────────────────────────────────────────────────────────────
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ── Star definitions (generated once, stable) ────────────────────────────
interface Star {
  id: number;
  xPct: number;
  yPct: number;
  r: number;
  opacity: number;
  isLime: boolean;
  twinkle: boolean;
  twinkleDur: number;
  twinkleDelay: number;
}

const STAR_DEFS: Star[][] = (() => {
  const rand = rng(0xcafe1234);
  let id = 0;
  return LAYERS.map(cfg =>
    Array.from({ length: cfg.count }, (): Star => ({
      id: id++,
      xPct: rand() * 100,
      yPct: rand() * 100,
      r: rand() * (cfg.maxR - cfg.minR) + cfg.minR,
      opacity: rand() * (cfg.maxO - cfg.minO) + cfg.minO,
      isLime: rand() < 0.04,
      twinkle: rand() < TWINKLE_RATIO,
      twinkleDur: 1.5 + rand() * 3.5,
      twinkleDelay: rand() * 5,
    }))
  );
})();

// ── Star element ─────────────────────────────────────────────────────────
function StarEl({ s, w, h, isDark }: { s: Star; w: number; h: number; isDark: boolean }) {
  const px = (s.xPct / 100) * w;
  const py = (s.yPct / 100) * h;
  const lime = isDark ? LIME_DARK : LIME_LIGHT;
  const base = isDark ? WHITE_DARK : BLACK_LIGHT;
  const fill = `${s.isLime ? lime : base}${s.opacity})`;

  return (
    <path
      d={SPARKLE}
      fill={fill}
      transform={`translate(${px} ${py}) scale(${s.r})`}
      style={s.twinkle ? {
        animationName: 'arrow-twinkle',
        animationDuration: `${s.twinkleDur}s`,
        animationDelay: `${s.twinkleDelay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
      } : undefined}
    />
  );
}

// ── Parallax SVG layer ────────────────────────────────────────────────────
const ParallaxLayer = memo(function ParallaxLayer({
  stars, layerRef, w, h, isDark,
}: {
  stars: Star[];
  layerRef: React.RefObject<SVGSVGElement | null>;
  w: number;
  h: number;
  isDark: boolean;
}) {
  return (
    <svg
      ref={layerRef as React.RefObject<SVGSVGElement>}
      aria-hidden="true"
      width={w}
      height={h}
      className="absolute top-0 left-0 overflow-visible"
      style={{ willChange: 'transform' }}
    >
      {stars.map(s => <StarEl key={s.id} s={s} w={w} h={h} isDark={isDark} />)}
    </svg>
  );
});

// ── Main component ────────────────────────────────────────────────────────
export const StarfieldBackground = memo(function StarfieldBackground({ isDark = true }: { isDark?: boolean }) {
  const refs = [
    useRef<SVGSVGElement | null>(null),
    useRef<SVGSVGElement | null>(null),
    useRef<SVGSVGElement | null>(null),
  ];

  const rafRef = useRef<number>(0);
  const currentY = useRef(0);
  const scrollElRef = useRef<HTMLElement | null>(null);

  const [size, setSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const SELECTORS = ['main', '[data-sidebar="inset"]', '.overflow-auto', '.overflow-y-auto'];

    const getScrollY = (): number => {
      if (scrollElRef.current && scrollElRef.current.scrollTop > 0) {
        return scrollElRef.current.scrollTop;
      }
      for (const sel of SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const st = (el as HTMLElement).scrollTop;
          if (st > 0) {
            scrollElRef.current = el as HTMLElement;
            return st;
          }
        }
      }
      return window.scrollY || 0;
    };

    const onScroll = () => {
      for (const sel of SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const st = (el as HTMLElement).scrollTop;
          if (st > 0) { scrollElRef.current = el as HTMLElement; return; }
        }
      }
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });

    const tick = () => {
      const rawY = getScrollY();
      const diff = rawY - currentY.current;

      if (Math.abs(diff) > 0.05) {
        currentY.current += diff * 0.10;
        const y = currentY.current;
        LAYERS.forEach((cfg, i) => {
          refs[i].current?.style.setProperty('transform', `translateY(${(y * cfg.speed).toFixed(2)}px)`);
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { w, h } = size;

  return (
    <>
      <style>{`
        @keyframes arrow-twinkle {
          0%   { opacity: 1; }
          100% { opacity: 0.08; }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {STAR_DEFS.map((stars, i) => (
          <ParallaxLayer key={i} stars={stars} layerRef={refs[i]} w={w} h={h} isDark={isDark} />
        ))}
      </div>
    </>
  );
});
