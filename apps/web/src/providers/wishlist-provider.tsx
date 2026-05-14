'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Wishlist is a pure client-side concern (no API), so we persist an array of
 * hotel ids in `localStorage` and broadcast cross-tab changes through the
 * native `storage` event.
 *
 * Why client-only?
 * - Take-home scope; adding a server-side Favorite table + auth gate is
 *   meaningful work that isn't asked for.
 * - Lets unauthenticated visitors curate a list before signing up — a
 *   pattern most hotel/booking sites use.
 *
 * SSR safety: state starts empty and only hydrates on `useEffect`. Components
 * that need to avoid hydration mismatch can read `hydrated` and render a
 * neutral state until it becomes true.
 */

const STORAGE_KEY = 'hb.wishlist';

interface WishlistContextValue {
  ids: string[];
  count: number;
  hydrated: boolean;
  has: (hotelId: string) => boolean;
  toggle: (hotelId: string) => void;
  add: (hotelId: string) => void;
  remove: (hotelId: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readPersisted(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota or private-mode — wishlist is a soft feature, swallow */
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount.
  useEffect(() => {
    setIds(readPersisted());
    setHydrated(true);
  }, []);

  // Cross-tab sync: another tab toggles a heart, we react.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setIds(readPersisted());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const has = useCallback((hotelId: string) => ids.includes(hotelId), [ids]);

  const add = useCallback((hotelId: string) => {
    setIds((prev) => {
      if (prev.includes(hotelId)) return prev;
      const next = [hotelId, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((hotelId: string) => {
    setIds((prev) => {
      if (!prev.includes(hotelId)) return prev;
      const next = prev.filter((id) => id !== hotelId);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback((hotelId: string) => {
    setIds((prev) => {
      const next = prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [hotelId, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds(() => {
      persist([]);
      return [];
    });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, count: ids.length, hydrated, has, toggle, add, remove, clear }),
    [ids, hydrated, has, toggle, add, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
