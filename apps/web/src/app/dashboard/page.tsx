'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardStats } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

export default function DashboardPage() {
  return (
    <RouteGuard>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  if (query.isLoading) {
    return (
      <div className="container mx-auto p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (!query.data) return null;
  const stats = query.data;
  const isCustomer = stats.scope === 'customer';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isCustomer
            ? 'Your bookings and spend at a glance.'
            : `Welcome back, ${user?.name}. Here's how things are looking.`}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isCustomer ? (
          <Tile label="Hotels" value={stats.totals.hotels.toString()} />
        ) : null}
        {!isCustomer ? (
          <Tile label="Rooms" value={stats.totals.rooms.toString()} />
        ) : null}
        <Tile
          label={isCustomer ? 'Your bookings' : 'Bookings'}
          value={stats.totals.bookings.toString()}
        />
        <Tile
          label={isCustomer ? 'Your spend' : 'Revenue (confirmed)'}
          value={formatCurrency(stats.totals.revenue)}
        />
        <Tile label="Upcoming" value={stats.upcomingBookings.toString()} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isCustomer ? 'Your booking activity (12 mo)' : 'Bookings & revenue (12 mo)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.revenueByMonth} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | string, name: string) => {
                    if (name === 'revenue') return formatCurrency(Number(value));
                    return String(value);
                  }}
                />
                <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.bookingsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              stats.bookingsByStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <Badge
                    variant={
                      row.status === 'CONFIRMED'
                        ? 'default'
                        : row.status === 'CANCELLED'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {row.status}
                  </Badge>
                  <span className="font-medium">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
