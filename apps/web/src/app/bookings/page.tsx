'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarRange, Receipt } from 'lucide-react';
import type { BookingWithPayment, Paginated } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/page-hero';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate, nightsBetween } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function BookingsPage() {
  return (
    <RouteGuard>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const params = { page: 1, limit: 50 };
  const query = useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => api.get<Paginated<BookingWithPayment>>(`/bookings?page=1&limit=50`),
  });

  const bookings = query.data?.data ?? [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHero
        title="Your bookings"
        subtitle="Track stays, payments, and cancellations in one place."
      />

      {query.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {bookings.map((b, i) => (
            <BookingRow key={b.id} booking={b} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, index }: { booking: BookingWithPayment; index: number }) {
  const nights = nightsBetween(new Date(booking.checkIn), new Date(booking.checkOut));
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className={cn(
        'group block animate-fade-up',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl',
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Card
        className={cn(
          'border-0 shadow-soft transition-all duration-300',
          'group-hover:-translate-y-0.5 group-hover:shadow-lg',
        )}
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              {booking.payment ? <StatusBadge status={booking.payment.status} /> : null}
            </div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarRange className="h-4 w-4 text-brand-turquoise" />
              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              <span className="text-muted-foreground">
                · {nights} {nights === 1 ? 'night' : 'nights'} · {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">{booking.id}</p>
          </div>
          <div className="flex w-full shrink-0 items-center justify-between gap-3 pt-1 sm:w-auto sm:justify-end sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold tracking-tight">
                {formatCurrency(Number(booking.totalPrice))}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-turquoiseDeep" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-soft animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-brand-turquoiseDeep">
        <Receipt className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">No bookings yet</h2>
      <p className="text-sm text-muted-foreground">
        Find a hotel you love and your reservations will land here.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Book a stay <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Browse hotels <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
