'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import type { CreatedBookingResponse } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, nightsBetween, toIsoDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const hotelId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const dayAfter = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  }, []);

  const [checkIn, setCheckIn] = useState(toIsoDate(tomorrow));
  const [checkOut, setCheckOut] = useState(toIsoDate(dayAfter));
  const [guestCount, setGuestCount] = useState(1);

  const hotelQuery = useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.detail(hotelId),
  });

  const range = { checkIn, checkOut };
  const validRange = new Date(checkOut) > new Date(checkIn);

  const availabilityQuery = useQuery({
    queryKey: queryKeys.hotels.availability(hotelId, range),
    queryFn: () => hotelsApi.availability(hotelId, range),
    enabled: Boolean(hotelId) && validRange,
  });

  const book = useMutation({
    mutationFn: (roomTypeId: string) =>
      api.post<CreatedBookingResponse>('/bookings', {
        hotelId,
        roomTypeId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guestCount,
      }),
    onSuccess: (created) => {
      toast({ title: 'Booking created', description: 'Redirecting to checkout…' });
      const hash = created.clientSecret
        ? `#secret=${encodeURIComponent(created.clientSecret)}`
        : '';
      router.push(`/bookings/${created.booking.id}${hash}`);
    },
    onError: (err) => {
      toast({
        title: 'Could not create booking',
        description: (err as Error).message,
        variant: 'destructive',
      });
    },
  });

  if (hotelQuery.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!hotelQuery.data) return null;
  const hotel = hotelQuery.data;
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">{hotel.name}</h1>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            {hotel.stars}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {hotel.city} · {hotel.address}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Choose your dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="checkIn">Check-in</Label>
            <Input
              id="checkIn"
              type="date"
              value={checkIn}
              min={toIsoDate(new Date())}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkOut">Check-out</Label>
            <Input
              id="checkOut"
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guests">Guests</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="opacity-0">Nights</Label>
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Room types</h2>
        {availabilityQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !validRange ? (
          <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
            Pick valid check-in / check-out dates to see availability.
          </p>
        ) : availabilityQuery.data && availabilityQuery.data.length === 0 ? (
          <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
            This hotel has no rooms yet.
          </p>
        ) : (
          availabilityQuery.data?.map((rt) => {
            const totalPrice = Number(rt.basePricePerNight) * nights;
            const disabled =
              !user || rt.availableRooms <= 0 || !validRange || book.isPending;
            return (
              <Card key={rt.id}>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rt.name}</h3>
                      <Badge variant="outline">
                        Sleeps {rt.capacity}
                      </Badge>
                      <Badge
                        variant={rt.availableRooms > 0 ? 'secondary' : 'destructive'}
                      >
                        {rt.availableRooms} / {rt.totalRooms} available
                      </Badge>
                    </div>
                    {rt.description ? (
                      <p className="text-sm text-muted-foreground">{rt.description}</p>
                    ) : null}
                    <p className="text-sm">
                      {formatCurrency(Number(rt.basePricePerNight))} / night ·
                      {' '}
                      <strong>{formatCurrency(totalPrice)}</strong> total for {nights}
                      {' '}
                      {nights === 1 ? 'night' : 'nights'}
                    </p>
                  </div>
                  <Button
                    disabled={disabled}
                    onClick={() => {
                      if (!user) {
                        router.push(`/login?next=/hotels/${hotelId}`);
                        return;
                      }
                      book.mutate(rt.id);
                    }}
                  >
                    {!user ? 'Sign in to book' : book.isPending ? 'Booking…' : 'Book now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {hotel.createdAt ? (
        <p className="text-xs text-muted-foreground">
          Listed {formatDate(hotel.createdAt)}
        </p>
      ) : null}
    </div>
  );
}
