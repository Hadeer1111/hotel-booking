'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Minus,
  Plus,
  Users as UsersIcon,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import type { CreatedBookingResponse } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency, nightsBetween, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';

export function HotelBookingPanel({
  hotelId,
  loginNextPath,
}: {
  hotelId: string;
  /** Where to send guests after sign-in from this flow (encoded into `?next=`). */
  loginNextPath?: string;
}) {
  const router = useRouter();
  const signInNext = loginNextPath ?? `/hotels/${hotelId}`;
  const { user } = useAuth();
  const { toast } = useToast();
  const twinMonthCalendar = useMediaQuery('(min-width: 768px)');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);
  const dayAfter = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }, [today]);

  const [range, setRange] = useState<DateRange | undefined>({
    from: tomorrow,
    to: dayAfter,
  });
  const [guestCount, setGuestCount] = useState(1);

  const checkIn = range?.from ? toIsoDate(range.from) : '';
  const checkOut = range?.to ? toIsoDate(range.to) : '';

  const hotelQuery = useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.detail(hotelId),
  });

  const availabilityRange = { checkIn, checkOut };
  const validRange =
    Boolean(checkIn) && Boolean(checkOut) && new Date(checkOut) > new Date(checkIn);

  const availabilityQuery = useQuery({
    queryKey: queryKeys.hotels.availability(hotelId, availabilityRange),
    queryFn: () => hotelsApi.availability(hotelId, availabilityRange),
    enabled: Boolean(hotelId) && validRange && Boolean(hotelQuery.data),
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
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (hotelQuery.isError || !hotelQuery.data) {
    return (
      <p className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-4 py-6 text-sm text-muted-foreground">
        This hotel is no longer available. Pick another property to continue.
      </p>
    );
  }

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-soft animate-fade-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-4 w-4 text-brand-turquoise" />
            Choose your dates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="dateRange">Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  id="dateRange"
                  type="button"
                  className={cn(
                    'group flex h-11 w-full items-center gap-3 rounded-xl border bg-card px-3.5',
                    'text-left text-sm transition-all duration-200',
                    'hover:border-brand-turquoise/50 hover:shadow-soft',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  aria-label="Pick check-in and check-out dates"
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-turquoise transition-transform duration-200 group-hover:scale-110" />
                  <span className="flex-1 truncate">
                    {range?.from ? (
                      <>
                        <span className="font-medium text-foreground">
                          {format(range.from, 'MMM d, yyyy')}
                        </span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="font-medium text-foreground">
                          {range?.to ? format(range.to, 'MMM d, yyyy') : 'pick check-out'}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Pick your dates</span>
                    )}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-auto max-w-[calc(100vw-1.25rem)] p-0 md:align-start">
                <Calendar
                  mode="range"
                  numberOfMonths={twinMonthCalendar ? 2 : 1}
                  defaultMonth={range?.from ?? today}
                  selected={range}
                  onSelect={setRange}
                  disabled={{ before: today }}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guests">Guests</Label>
            <div
              className={cn(
                'flex h-11 items-center gap-1 rounded-xl border bg-card pl-3.5 pr-1.5',
                'transition-all duration-200 hover:border-brand-turquoise/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              )}
            >
              <UsersIcon className="h-4 w-4 shrink-0 text-brand-turquoise" />
              <span id="guests" className="flex-1 px-1 text-sm font-medium">
                {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </span>
              <button
                type="button"
                aria-label="Decrease guests"
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                disabled={guestCount <= 1}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground',
                  'transition-all duration-150 hover:bg-secondary hover:text-foreground',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Increase guests"
                onClick={() => setGuestCount((g) => Math.min(10, g + 1))}
                disabled={guestCount >= 10}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground',
                  'transition-all duration-150 hover:bg-secondary hover:text-foreground',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stay</Label>
            <div
              className={cn(
                'flex h-11 items-center rounded-xl border bg-secondary/60 px-3.5 text-sm',
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
                      <span className="text-muted-foreground">
                        {' '}
                        total · {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                    </p>
                  </div>
                  <Button
                    disabled={disabled}
                    onClick={() => {
                      if (!user) {
                        router.push(`/login?next=${encodeURIComponent(signInNext)}`);
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
    </div>
  );
}
