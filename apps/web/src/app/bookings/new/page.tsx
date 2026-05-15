'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { HotelBookingPanel } from '@/components/booking/hotel-booking-panel';
import { PageHero } from '@/components/page-hero';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const PICK_FIRST_PAGE_SIZE = 100;

export default function NewBookingPage() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <BookingNewGate />
    </Suspense>
  );
}

function HeaderSkeleton() {
  return (
    <div className="container mx-auto p-8 space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

function BookingNewGate() {
  const searchParams = useSearchParams();
  const nextPath = `/bookings/new${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return (
    <RouteGuard fallback={`/login?next=${encodeURIComponent(nextPath)}`}>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hotelId, setHotelId] = useState('');
  const fromQuery = searchParams.get('hotel') ?? '';

  const hotelsQuery = useQuery({
    queryKey: queryKeys.hotels.list({ page: 1, limit: PICK_FIRST_PAGE_SIZE }),
    queryFn: () => hotelsApi.list({ page: 1, limit: PICK_FIRST_PAGE_SIZE }),
  });

  useEffect(() => {
    if (!fromQuery) return;
    if (hotelsQuery.data?.data.some((h) => h.id === fromQuery)) {
      setHotelId(fromQuery);
    }
  }, [fromQuery, hotelsQuery.data]);

  const selectedHotel = hotelsQuery.data?.data.find((h) => h.id === hotelId);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHero
        title="Book a stay"
        subtitle="Choose a hotel, dates, and room — same flow as from the hotel page, without browsing the catalogue first."
      />

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-2">
            <Label htmlFor="hotel-pick">Hotel</Label>
            {hotelsQuery.isLoading ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <Select
                value={hotelId || undefined}
                onValueChange={(v) => {
                  setHotelId(v);
                  const next = new URLSearchParams(searchParams.toString());
                  next.set('hotel', v);
                  router.replace(`/bookings/new?${next.toString()}`, { scroll: false });
                }}
              >
                <SelectTrigger id="hotel-pick" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a hotel" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(hotelsQuery.data?.data ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} · {h.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hotelsQuery.data && hotelsQuery.data.meta.totalPages > 1 ? (
              <p className="text-xs text-muted-foreground">
                Showing the first {PICK_FIRST_PAGE_SIZE} hotels. Use{' '}
                <Link href="/hotels" className="text-brand-turquoiseDeep underline-offset-2 hover:underline">
                  /hotels
                </Link>{' '}
                to find others.
              </p>
            ) : null}
          </div>
          {selectedHotel ? (
            <Button variant="outline" size="sm" className="shrink-0 gap-2 rounded-full" asChild>
              <Link href={`/hotels/${selectedHotel.id}`}>
                Hotel page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {!hotelId ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Select a hotel above to check availability and complete your booking.
        </p>
      ) : (
        <HotelBookingPanel
          hotelId={hotelId}
          loginNextPath={`/bookings/new?hotel=${encodeURIComponent(hotelId)}`}
        />
      )}
    </div>
  );
}
