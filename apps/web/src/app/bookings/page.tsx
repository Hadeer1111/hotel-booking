'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { BookingWithPayment, Paginated } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';

const STATUS_VARIANT = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  CANCELLED: 'destructive',
} as const;

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Your bookings (or all bookings you can manage as a manager / admin).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (query.data?.data ?? []).length === 0 ? (
            <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.data.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">
                      <Link className="underline" href={`/bookings/${b.id}`}>
                        {b.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(b.totalPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
