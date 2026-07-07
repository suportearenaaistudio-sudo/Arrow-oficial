import { useEffect, useRef, useState, type RefObject } from 'react';

const SCROLL_DELTA = 6;
const TOP_THRESHOLD = 16;

export function useHideOnScroll(containerRef: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      if (y <= TOP_THRESHOLD) {
        setVisible(true);
      } else if (y > lastScrollY.current + SCROLL_DELTA) {
        setVisible(false);
      } else if (y < lastScrollY.current - SCROLL_DELTA) {
        setVisible(true);
      }
      lastScrollY.current = y;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef]);

  return visible;
}
