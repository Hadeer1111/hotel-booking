'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find your stay</h1>
        <p className="text-muted-foreground">Search hotels by name and book in seconds.</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Input
              placeholder="Search hotels by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search hotels"
            />
          </div>
          {query.isSuccess ? (
            <p className="text-sm text-muted-foreground">
              {total} hotel{total === 1 ? '' : 's'} · showing {hotels.length}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by stars">
          <span className="text-sm text-muted-foreground mr-1">Stars</span>
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
                className={cn('gap-1', active && 'shadow-sm')}
              >
                {value}
                <Star className={cn('h-3 w-3', active && 'fill-current')} />
              </Button>
            );
          })}
          {stars.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearStars}
              aria-label="Clear star filters"
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        ) : hotels.length === 0 ? (
          <p className="col-span-full rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No hotels match your search.
          </p>
        ) : (
          hotels.map((hotel) => (
            <Link key={hotel.id} href={`/hotels/${hotel.id}`} className="block group">
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{hotel.name}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {hotel.stars}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{hotel.city}</p>
                  <p className="line-clamp-2">{hotel.address}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>

      <div ref={sentinelRef} aria-hidden="true" className="h-1" />

      <div className="flex justify-center py-4 text-sm text-muted-foreground" aria-live="polite">
        {query.isFetchingNextPage ? (
          <span>Loading more…</span>
        ) : !query.hasNextPage && hotels.length > 0 ? (
          <span>That&apos;s every hotel matching your search.</span>
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
