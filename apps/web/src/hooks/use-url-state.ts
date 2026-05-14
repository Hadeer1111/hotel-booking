'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Two-way bind a single URL search param without remounting the page.
 * Returns a getter and a setter. Setting `null` removes the param.
 */
export function useUrlState<T extends string | number | null>(
  key: string,
  parse: (raw: string | null) => T,
): readonly [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = parse(params.get(key));

  const set = useCallback(
    (next: T) => {
      const sp = new URLSearchParams(params.toString());
      if (next === null || next === '' || (typeof next === 'number' && Number.isNaN(next))) {
        sp.delete(key);
      } else {
        sp.set(key, String(next));
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [key, params, pathname, router],
  );

  return [value, set] as const;
}
