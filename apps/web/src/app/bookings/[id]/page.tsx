'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookingWithPayment } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/lib/env';
import { StripeCheckout } from '@/components/payments/stripe-checkout';

export default function BookingDetailPage() {
  return (
    <RouteGuard>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const bookingId = params.id;
  // Stripe redirects back with ?payment_intent_client_secret=...; we just refetch.
  const justReturned = sp.has('payment_intent');

  const query = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => api.get<BookingWithPayment>(`/bookings/${bookingId}`),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      // Poll until payment lands (webhook flips status -> CONFIRMED).
      if (data.status === 'PENDING' && (justReturned || data.payment?.status === 'REQUIRES_PAYMENT')) {
        return 3_000;
      }
      return false;
    },
  });

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
      <div className="container mx-auto p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!query.data) return null;
  const booking = query.data;
  const isPaid = booking.payment?.status === 'SUCCEEDED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';
  const useStripe = env.paymentsProvider === 'stripe';

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Booking</h1>
        </div>
        <Badge
          variant={
            booking.status === 'CONFIRMED'
              ? 'default'
              : booking.status === 'CANCELLED'
                ? 'destructive'
                : 'secondary'
          }
        >
          {booking.status}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Stay</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Check-in</p>
            <p className="font-medium">{formatDate(booking.checkIn)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Check-out</p>
            <p className="font-medium">{formatDate(booking.checkOut)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Guests</p>
            <p className="font-medium">{booking.guestCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">{formatCurrency(Number(booking.totalPrice))}</p>
          </div>
        </CardContent>
      </Card>

      {booking.payment ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium">{booking.payment.provider}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {formatCurrency(Number(booking.payment.amount), booking.payment.currency.toUpperCase())}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    booking.payment.status === 'SUCCEEDED'
                      ? 'default'
                      : booking.payment.status === 'FAILED'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {booking.payment.status}
                </Badge>
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
                  <p className="text-sm text-muted-foreground">
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
        <Button
          variant="outline"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
        </Button>
      ) : null}

      <p>
        <Button variant="ghost" onClick={() => router.push('/bookings')}>
          ← Back to bookings
        </Button>
      </p>
    </div>
  );
}

/**
 * The booking detail endpoint does not echo clientSecret (only the create
 * response does). For now we keep the secret on the URL hash that the
 * /hotels/[id] booking flow sets immediately before redirecting. Falls back
 * to a re-create request in the future if needed.
 */
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
      <p className="text-sm text-muted-foreground">
        Open this page from the hotel listing to launch the Stripe checkout.
      </p>
    );
  }
  return <>{onReady(hashSecret)}</>;
}
