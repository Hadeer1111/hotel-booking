'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/providers/wishlist-provider';
import { cn } from '@/lib/utils';

export interface WishlistButtonProps {
  hotelId: string;
  hotelName?: string;
  /** Compact `sm` for cards, `md` for hero overlays. */
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Visual variant. `chip` is a glassy pill suited to overlays on imagery.
   * `bare` renders just the icon without a background.
   */
  variant?: 'chip' | 'bare';
}

/**
 * Heart toggle that lives on top of a `<Link>`-wrapped HotelCard or as a
 * standalone control on the detail hero. Stops click propagation so it never
 * triggers the parent's navigation when the user only meant to wishlist.
 *
 * SSR-aware: until the WishlistProvider has hydrated from localStorage the
 * button renders as un-filled and disabled-toggling, avoiding a hydration
 * mismatch on cards rendered server-side.
 */
export function WishlistButton({
  hotelId,
  hotelName,
  size = 'sm',
  className,
  variant = 'chip',
}: WishlistButtonProps) {
  const { has, toggle, hydrated } = useWishlist();
  // Increments on each click; bound to the Heart `key` to force a remount so
  // the `animate-pop-in` keyframe replays even when the icon is re-rendered.
  const [pulseKey, setPulseKey] = React.useState(0);
  const active = hydrated && has(hotelId);

  const dims = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(hotelId);
    setPulseKey((k) => k + 1);
  };

  const label = hotelName
    ? `${active ? 'Remove' : 'Add'} ${hotelName} ${active ? 'from' : 'to'} wishlist`
    : active
      ? 'Remove from wishlist'
      : 'Add to wishlist';

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'group/heart inline-flex items-center justify-center rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        dims,
        variant === 'chip' && [
          'bg-white/95 text-slate-700 shadow-sm backdrop-blur',
          'hover:scale-110 hover:text-rose-500',
          active && 'text-rose-500',
        ],
        variant === 'bare' && [
          'text-white/90 hover:text-rose-300 hover:scale-110',
          active && 'text-rose-400',
        ],
        className,
      )}
    >
      <Heart
        key={pulseKey}
        className={cn(
          icon,
          'transition-transform duration-200',
          active && 'fill-current',
          pulseKey > 0 && 'animate-pop-in',
        )}
      />
    </button>
  );
}
