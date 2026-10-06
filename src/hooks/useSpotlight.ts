import { useCallback, type PointerEvent } from 'react';

/** Faz o reflexo do vidro acompanhar o cursor (classe CSS .spotlight). */
export function useSpotlight<T extends HTMLElement>() {
  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    el.style.setProperty('--spot-opacity', '1');
  }, []);
  const onPointerLeave = useCallback((event: PointerEvent<T>) => {
    event.currentTarget.style.setProperty('--spot-opacity', '0');
  }, []);
  return { onPointerMove, onPointerLeave };
}
