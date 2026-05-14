'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, SearchX, Star } from 'lucide-react';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/page-hero';
import { HotelCard, HotelCardSkeleton } from '@/components/hotel-card';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const STAR_OPTIONS = [1, 2, 3, 4, 5] as const;

function parseStr(raw: string | null): string {
  return raw ?? '';
}

export default function HotelsPage() {
  return (
    <Suspense fallback={null}>
      <HotelsList />
    </Suspense>
  );
}

function HotelsList() {
  const [qParam, setQParam] = useUrlState('q', parseStr);
  const [starsCsv, setStarsCsv] = useUrlState('stars', parseStr);

  // Locally controlled search input so typing is responsive; URL updates after debounce.
  const [search, setSearch] = useState(qParam);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (debouncedSearch !== qParam) {
      setQParam(debouncedSearch);
    }
  }, [debouncedSearch, qParam, setQParam]);

  const stars = useMemo<number[]>(() => parseStarsCsv(starsCsv), [starsCsv]);

  const toggleStar = (value: number) => {
    const next = stars.includes(value)
      ? stars.filter((s) => s !== value)
      : [...stars, value].sort((a, b) => a - b);
    setStarsCsv(next.join(','));
  };

  const clearStars = () => setStarsCsv('');
  const clearAll = () => {
    setSearch('');
    setStarsCsv('');
  };

  const filters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      stars: stars.length ? stars : undefined,
    }),
    [debouncedSearch, stars],
  );

  const query = useInfiniteQuery({
    queryKey: queryKeys.hotels.list({ ...filters, limit: PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      hotelsApi.list({ page: pageParam, limit: PAGE_SIZE, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });

  const hotels = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  const [sentinelRef, isSentinelVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px',
    enabled: query.hasNextPage && !query.isFetchingNextPage,
  });

  useEffect(() => {
    if (isSentinelVisible && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [isSentinelVisible, query]);

  const hasActiveFilters = search.length > 0 || stars.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <PageHero
        title="Find your stay"
        subtitle="Browse hand-picked hotels and book in seconds."
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search hotels by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search hotels"
            className={cn(
              'h-12 rounded-full border-0 bg-card pl-11 pr-4 text-base shadow-soft',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white/40',
            )}
          />
        </div>
      </PageHero>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by stars">
          <span className="mr-1 text-sm font-medium text-muted-foreground">Stars</span>
          {STAR_OPTIONS.map((value) => {
            const active = stars.includes(value);
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => toggleStar(value)}
                aria-pressed={active}
                className={cn(
                  'gap-1.5 rounded-full transition-all duration-200',
                  active
                    ? 'shadow-glow bg-primary text-primary-foreground hover:bg-primary/90 animate-pop-in'
                    : 'bg-card hover:bg-secondary hover:-translate-y-0.5',
                )}
              >
                <span className="font-medium">{value}</span>
                <Star
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    active ? 'fill-amber-300 text-amber-300 scale-110' : 'text-muted-foreground',
                  )}
                />
              </Button>
            );
          })}
          {stars.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearStars}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear star filters"
            >
              Clear
            </Button>
          ) : null}
        </div>

        {query.isSuccess ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span>{' '}
            hotel{total === 1 ? '' : 's'} · showing{' '}
            <span className="font-semibold text-foreground">{hotels.length}</span>
          </p>
        ) : null}
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {query.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)
        ) : hotels.length === 0 ? (
          <EmptyState onClear={hasActiveFilters ? clearAll : undefined} />
        ) : (
          hotels.map((hotel, i) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              // Cap the stagger so later infinite-scroll batches don't visibly cascade.
              animationDelay={(i % PAGE_SIZE) * 30}
            />
          ))
        )}
      </section>

      <div ref={sentinelRef} aria-hidden="true" className="h-1" />

      <div className="flex justify-center pb-6 text-sm text-muted-foreground" aria-live="polite">
        {query.isFetchingNextPage ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-turquoise" />
            Loading more…
          </span>
        ) : !query.hasNextPage && hotels.length > 0 ? (
          <span>That&apos;s every hotel matching your search.</span>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="col-span-full">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-brand-turquoiseDeep">
          <SearchX className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold">No hotels match your search</h2>
        <p className="text-sm text-muted-foreground">
          Try a different name or loosen the star filter.
        </p>
        {onClear ? (
          <Button onClick={onClear} className="mt-2 rounded-full">
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function parseStarsCsv(raw: string): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  for (const part of raw.split(',')) {
    const n = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(n) && n >= 1 && n <= 5) seen.add(n);
  }
  return Array.from(seen).sort((a, b) => a - b);
}
