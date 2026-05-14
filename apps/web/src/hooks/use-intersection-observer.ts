'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** When true, the observer is detached after the first intersection. */
  freezeOnceVisible?: boolean;
  /** When false, observation is paused (useful while a fetch is in flight). */
  enabled?: boolean;
}

/**
 * Observes a single element and reports whether it currently intersects the
 * viewport (or the configured root). Returns a ref to attach to the target
 * element and the latest `isIntersecting` boolean.
 *
 * SSR-safe: skips when `IntersectionObserver` is unavailable (e.g. during
 * Next.js prerender) and on the server.
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
): readonly [React.MutableRefObject<T | null>, boolean] {
  const { freezeOnceVisible = false, enabled = true, root, rootMargin, threshold } = options;
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && freezeOnceVisible) {
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, freezeOnceVisible, root, rootMargin, threshold]);

  return [ref, isIntersecting] as const;
}
