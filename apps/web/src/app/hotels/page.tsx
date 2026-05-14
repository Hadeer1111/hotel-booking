'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function parseInt1(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
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
  const [page, setPage] = useUrlState('page', parseInt1);
  const [qParam, setQParam] = useUrlState('q', parseStr);

  // Locally controlled search input so typing is responsive; URL updates after debounce.
  const [search, setSearch] = useState(qParam);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (debouncedSearch !== qParam) {
      setQParam(debouncedSearch);
      // Reset to page 1 whenever the query changes.
      setPage(1);
    }
  }, [debouncedSearch, qParam, setPage, setQParam]);

  const params = { page, limit: 12, q: debouncedSearch || undefined };
  const query = useQuery({
    queryKey: queryKeys.hotels.list(params),
    queryFn: () => hotelsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const meta = query.data?.meta;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find your stay</h1>
        <p className="text-muted-foreground">Search hotels by name and book in seconds.</p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <Input
            placeholder="Search hotels by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search hotels"
          />
        </div>
        {meta ? (
          <p className="text-sm text-muted-foreground">
            {meta.total} hotels · page {meta.page} of {meta.totalPages}
          </p>
        ) : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        ) : query.data && query.data.data.length === 0 ? (
          <p className="col-span-full rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No hotels match your search.
          </p>
        ) : (
          query.data?.data.map((hotel) => (
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

      {meta && meta.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => setPage(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage(meta.page + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
