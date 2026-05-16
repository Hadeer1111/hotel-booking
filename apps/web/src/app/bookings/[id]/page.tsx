'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BedDouble, CalendarDays, CreditCard, Users as UsersIcon } from 'lucide-react';
import type { BookingWithPayment } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate, nightsBetween } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/lib/env';
import { StripeCheckout } from '@/components/payments/stripe-checkout';
import { cn } from '@/lib/utils';

export default function BookingDetailPage() {
  return (
    <Suspense fallback={null}>
      <RouteGuard>
        <Inner />
      </RouteGuard>
    </Suspense>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const bookingId = params.id;
  const justReturned = sp.has('payment_intent');

  // Stripe `return_url` is a full navigation: in-memory access tokens are gone until
  // /auth/refresh runs. Invalidate so we don’t show a stale booking while the webhook
  // applies, and drop PI query params once payment is confirmed (avoids odd reload state).
  useEffect(() => {
    if (!justReturned || !bookingId) return;
    void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    void qc.invalidateQueries({ queryKey: queryKeys.bookings.all() });
  }, [bookingId, justReturned, qc]);

  const query = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => api.get<BookingWithPayment>(`/bookings/${bookingId}`),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      if (data.status === 'PENDING' && (justReturned || data.payment?.status === 'REQUIRES_PAYMENT')) {
        return 3_000;
      }
      return false;
    },
  });

  useEffect(() => {
    const b = query.data;
    if (!b || !justReturned) return;
    const paid = b.payment?.status === 'SUCCEEDED' || b.status === 'CONFIRMED';
    if (paid) {
      router.replace(`/bookings/${bookingId}`, { scroll: false });
    }
  }, [query.data, bookingId, justReturned, router]);

  const cancel = useMutation({
    mutationFn: () =>
      api.patch<BookingWithPayment>(`/bookings/${bookingId}/status`, { status: 'CANCELLED' }),
    onSuccess: () => {
      toast({ title: 'Booking cancelled' });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
    onError: (err) =>
      toast({
        title: 'Could not cancel',
        description: (err as Error).message,
        variant: 'destructive',
      }),
  });

  if (query.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }
  if (!query.data) return null;
  const booking = query.data;
  const isPaid = booking.payment?.status === 'SUCCEEDED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';
  const useStripe = env.paymentsProvider === 'stripe';
  const nights = nightsBetween(new Date(booking.checkIn), new Date(booking.checkOut));

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/bookings')}
        className="gap-2 self-start text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Button>

      {/* Hero summary card with gradient background */}
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-soft animate-fade-up',
          'bg-gradient-to-br from-cyan-400 via-cyan-300 to-amber-200',
          'bg-[length:200%_200%] animate-gradient-shift',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_55%)]"
        />
        <div className="relative flex flex-col gap-4 text-slate-900 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-800/70">{booking.id}</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {nights} {nights === 1 ? 'night' : 'nights'} stay
            </h1>
            <p className="text-slate-800/80">
              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <StatusBadge status={booking.status} />
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(Number(booking.totalPrice))}
            </p>
          </div>
        </div>
      </section>

      <Card className="border-0 shadow-soft animate-fade-up" style={{ animationDelay: '60ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BedDouble className="h-4 w-4 text-brand-turquoise" /> Stay details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow icon={CalendarDays} label="Check-in" value={formatDate(booking.checkIn)} />
          <DetailRow icon={CalendarDays} label="Check-out" value={formatDate(booking.checkOut)} />
          <DetailRow icon={UsersIcon} label="Guests" value={String(booking.guestCount)} />
          <DetailRow icon={BedDouble} label="Nights" value={String(nights)} />
        </CardContent>
      </Card>

      {booking.payment ? (
        <Card className="border-0 shadow-soft animate-fade-up" style={{ animationDelay: '120ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-4 w-4 text-brand-turquoise" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <DetailRow label="Provider" value={booking.payment.provider} />
              <DetailRow
                label="Amount"
                value={formatCurrency(
                  Number(booking.payment.amount),
                  booking.payment.currency.toUpperCase(),
                )}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={booking.payment.status} />
              </div>
            </div>

            {isPending && !isPaid ? (
              <>
                <Separator />
                {useStripe && booking.payment.status === 'REQUIRES_PAYMENT' ? (
                  <ClientSecretGate
                    bookingId={booking.id}
                    onReady={(secret) => (
                      <StripeCheckout
                        clientSecret={secret}
                        returnUrl={`${window.location.origin}/bookings/${booking.id}`}
                      />
                    )}
                  />
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                    Mock provider: payment confirmation arrives via the API webhook
                    when the simulator fires the success event. You can also cancel
                    the booking below.
                  </p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!isCancelled ? (
        <div className="flex justify-end animate-fade-up" style={{ animationDelay: '180ms' }}>
          <Button
            variant="outline"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="rounded-full"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ClientSecretGate({
  onReady,
}: {
  bookingId: string;
  onReady: (clientSecret: string) => React.ReactNode;
}) {
  if (typeof window === 'undefined') return null;
  const hashSecret = window.location.hash.startsWith('#secret=')
    ? decodeURIComponent(window.location.hash.slice('#secret='.length))
    : null;
  if (!hashSecret) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        Open this page from the hotel listing to launch the Stripe checkout.
      </p>
    );
  }
  return <>{onReady(hashSecret)}</>;
}
