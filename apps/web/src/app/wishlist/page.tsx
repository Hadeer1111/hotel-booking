'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/page-hero';
import { HotelCard, HotelCardSkeleton } from '@/components/hotel-card';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useWishlist } from '@/providers/wishlist-provider';
import { cn } from '@/lib/utils';

/**
 * Renders a grid of the visitor's wishlisted hotels.
 *
 * Wishlist ids live in localStorage (see `wishlist-provider`), so the page
 * doesn't need a dedicated server endpoint. Each id is fetched in parallel
 * via `useQueries`; TanStack Query dedupes/caches across pages, so a hotel
 * already viewed elsewhere is shown instantly.
 */
export default function WishlistPage() {
  const { ids, count, hydrated, clear, remove } = useWishlist();

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.hotels.detail(id),
      queryFn: () => hotelsApi.detail(id),
      staleTime: 60_000,
    })),
  });

  const hotels = queries
    .map((q, i) => ({ id: ids[i], data: q.data, error: q.error, isLoading: q.isLoading }))
    // Stale ids whose hotel has been deleted will error out; surface them as
    // a graceful "Removed by owner" tile rather than blowing up the grid.
    .filter((row) => row.data || row.isLoading || row.error);

  const someLoading = queries.some((q) => q.isLoading);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
      <PageHero
        title="Hotels you love"
        subtitle="Tap the heart on any hotel to save it for later — your list lives on this device and syncs across tabs."
      >
        {hydrated && count > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900 sm:gap-3">
            <span className="rounded-full bg-white/70 px-3 py-1 font-medium shadow-sm backdrop-blur">
              {count} saved
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="rounded-full text-slate-900 hover:bg-white/40"
            >
              Clear all
            </Button>
          </div>
        ) : null}
      </PageHero>

      <div className="container mx-auto p-4 md:p-6">
        {!hydrated ? (
          <SkeletonGrid />
        ) : count === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((row, i) =>
                row.data ? (
                  // The card already carries a WishlistButton (top-left of
                  // the cover) that doubles as the remove control here — a
                  // second top-right button would be redundant.
                  <HotelCard key={row.id} hotel={row.data} animationDelay={i * 50} />
                ) : row.isLoading ? (
                  <HotelCardSkeleton key={row.id} />
                ) : (
                  <RemovedTile key={row.id} hotelId={row.id} onRemove={() => remove(row.id)} />
                ),
              )}
            </div>
            {someLoading && (
              <p className="mt-6 text-center text-sm text-muted-foreground">Loading…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <HotelCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl bg-card p-10 text-center shadow-soft',
        'animate-fade-up',
      )}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40">
        <Heart className="h-7 w-7 text-rose-500 dark:text-rose-400" />
      </span>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">No favourites yet</h2>
        <p className="text-sm text-muted-foreground">
          Browse the catalogue and tap the heart on any hotel to bookmark it here.
        </p>
      </div>
      <Link href="/hotels">
        <Button size="lg" className="rounded-full gap-2 shadow-soft hover:-translate-y-0.5 transition-transform">
          <Sparkles className="h-4 w-4" />
          Discover hotels
        </Button>
      </Link>
    </div>
  );
}

function RemovedTile({ hotelId, onRemove }: { hotelId: string; onRemove: () => void }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-6',
        'bg-muted/50 text-center text-sm text-muted-foreground animate-fade-up',
      )}
    >
      <Heart className="h-5 w-5 text-rose-300" />
      <p>This hotel is no longer available.</p>
      <Button size="sm" variant="ghost" onClick={onRemove} className="rounded-full">
        Remove from list
      </Button>
      <span className="text-[10px] uppercase tracking-wider">{hotelId.slice(0, 8)}</span>
    </div>
  );
}
