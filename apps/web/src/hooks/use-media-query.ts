'use client';

import { useEffect, useState } from 'react';

/** Client-only breakpoint hook; SSR/first paint returns `initial` until the effect runs. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (): void => {
      setMatches(mq.matches);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}
