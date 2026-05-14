'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  /** Total animation duration in ms. Defaults to 900. */
  duration?: number;
  /** Starting value. Defaults to 0. */
  from?: number;
}

/**
 * Smoothly animates a numeric value from `from` to `to` over `duration` ms
 * using `requestAnimationFrame` and an ease-out cubic for a satisfying
 * deceleration. Used to make dashboard tiles feel responsive.
 *
 * Returns the current intermediate value, which can be rounded or formatted
 * by the caller (e.g. currency vs. integer).
 */
export function useCountUp(to: number, { duration = 900, from = 0 }: UseCountUpOptions = {}): number {
  const [value, setValue] = useState(from);
  const startValueRef = useRef(from);
  const targetRef = useRef(to);

  useEffect(() => {
    startValueRef.current = value;
    targetRef.current = to;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // Ease-out cubic: deceleration that feels lively but settles softly.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startValueRef.current + (targetRef.current - startValueRef.current) * eased;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // We intentionally exclude `value` from deps; this hook re-runs only when
    // the target or duration changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  return value;
}
