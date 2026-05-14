'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/providers/wishlist-provider';
import { cn } from '@/lib/utils';

/**
 * Header pill linking to /wishlist. Shows a count badge once the provider
 * has hydrated and the user has saved at least one hotel. Renders an empty
 * neutral state during SSR to avoid a hydration mismatch.
 */
export function WishlistLink() {
  const { count, hydrated } = useWishlist();
  const pathname = usePathname();
  const active = pathname === '/wishlist';
  const showBadge = hydrated && count > 0;

  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist${showBadge ? ` (${count})` : ''}`}
      title="Wishlist"
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400'
          : 'text-muted-foreground hover:bg-secondary hover:text-rose-500',
      )}
    >
      <Heart className={cn('h-4 w-4 transition-transform', active && 'fill-current')} />
      {showBadge && (
        <span
          className={cn(
            'absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full',
            'bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm',
            'animate-pop-in',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
