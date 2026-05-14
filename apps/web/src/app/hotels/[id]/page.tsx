'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Star,
  Users as UsersIcon,
} from 'lucide-react';
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
import { getHotelImage } from '@/lib/hotel-image';
import { getHotelGradient } from '@/lib/hotel-gradient';
import { formatCurrency, formatDate, nightsBetween, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
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
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }
  if (!hotelQuery.data) return null;
  const hotel = hotelQuery.data;
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));
  const image = getHotelImage(hotel.name, 1600);
  const gradient = getHotelGradient(hotel.name);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 self-start text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero with cover image + name overlay */}
      <section className={cn('relative overflow-hidden rounded-3xl shadow-soft bg-gradient-to-br', gradient)}>
        <div className="relative h-72 md:h-96">
          <Image
            src={image.src}
            alt={`${hotel.name} cover image`}
            fill
            priority
            sizes="(min-width: 1024px) 80vw, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 border-0 bg-white/95 text-slate-900 backdrop-blur">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{hotel.stars}</span>
              </Badge>
              <Badge
                variant="secondary"
                className="border-0 bg-white/20 text-white backdrop-blur"
              >
                {hotel.status}
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {hotel.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-white/85">
              <MapPin className="h-4 w-4" />
              {hotel.city} · {hotel.address}
            </p>
          </div>
        </div>
      </section>

      {/* Date picker card */}
      <Card className="border-0 shadow-soft animate-fade-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-4 w-4 text-brand-turquoise" />
            Choose your dates
          </CardTitle>
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
              className="h-11 rounded-xl"
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
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guests" className="flex items-center gap-1.5">
              <UsersIcon className="h-3.5 w-3.5 text-brand-turquoise" /> Guests
            </Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="opacity-0">Nights</Label>
            <div
              className={cn(
                'flex h-11 items-center rounded-xl border bg-secondary/60 px-3 text-sm',
                !validRange && 'border-destructive bg-destructive/10 text-destructive',
              )}
            >
              <span className="font-semibold text-brand-turquoiseDeep">{nights}</span>
              <span className="ml-1.5 text-muted-foreground">
                {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Room types</h2>
        {availabilityQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : !validRange ? (
          <p className="rounded-2xl border-0 bg-amber-100 px-4 py-3 text-sm text-amber-900">
            Pick valid check-in / check-out dates to see availability.
          </p>
        ) : availabilityQuery.data && availabilityQuery.data.length === 0 ? (
          <p className="rounded-2xl border-0 bg-muted px-4 py-3 text-sm text-muted-foreground">
            This hotel has no rooms yet.
          </p>
        ) : (
          availabilityQuery.data?.map((rt, i) => {
            const totalPrice = Number(rt.basePricePerNight) * nights;
            const soldOut = rt.availableRooms <= 0;
            const disabled = !user || soldOut || !validRange || book.isPending;
            return (
              <Card
                key={rt.id}
                className={cn(
                  'group border-0 shadow-soft animate-fade-up',
                  'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{rt.name}</h3>
                      <Badge variant="outline" className="gap-1 rounded-full">
                        <UsersIcon className="h-3 w-3" /> Sleeps {rt.capacity}
                      </Badge>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          soldOut
                            ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-200'
                            : rt.availableRooms < 3
                              ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200 animate-pulse'
                              : 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            soldOut ? 'bg-rose-500' : rt.availableRooms < 3 ? 'bg-amber-500' : 'bg-emerald-500',
                          )}
                        />
                        {rt.availableRooms} / {rt.totalRooms} available
                      </span>
                    </div>
                    {rt.description ? (
                      <p className="text-sm text-muted-foreground">{rt.description}</p>
                    ) : null}
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(rt.basePricePerNight))}
                      </span>
                      <span className="text-muted-foreground"> / night · </span>
                      <span className="font-semibold text-brand-turquoiseDeep">
                        {formatCurrency(totalPrice)}
                      </span>
                      <span className="text-muted-foreground"> total · {nights} {nights === 1 ? 'night' : 'nights'}</span>
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
                    className={cn(
                      'gap-2 rounded-full px-5 shadow-soft transition-all',
                      !disabled && 'hover:-translate-y-0.5 hover:shadow-lg',
                    )}
                  >
                    {!user
                      ? 'Sign in to book'
                      : book.isPending
                        ? 'Booking…'
                        : soldOut
                          ? 'Sold out'
                          : 'Book now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {hotel.createdAt ? (
        <p className="pt-4 text-center text-xs text-muted-foreground">
          Listed {formatDate(hotel.createdAt)}
        </p>
      ) : null}
    </div>
  );
}
