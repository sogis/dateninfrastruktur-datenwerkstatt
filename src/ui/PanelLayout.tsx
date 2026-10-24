import {useEffect, useRef, useState} from 'react';
export function useMediaQuery(value: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(value).matches);
  useEffect(() => {
    const query = window.matchMedia(value);
    const update = () => setMatches(query.matches);
    query.addEventListener('change', update);
    update();
    return () => query.removeEventListener('change', update);
  }, [value]);
  return matches;
}
/** Pixel minima remain meaningful when the viewport or the toolbar changes size. */
export function usePanelHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(700);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      if (frame !== undefined) return;
      // Panel minima affect layout; update them outside the observer delivery cycle.
      frame = requestAnimationFrame(() => {
        frame = undefined;
        setHeight(host.clientHeight);
      });
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);
  return {ref, height};
}
