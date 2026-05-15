'use client';

import Link from 'next/link';
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
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarCheck,
  DollarSign,
  Shield,
  Trees,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/page-hero';
import { StatusBadge } from '@/components/status-badge';
import { useCountUp } from '@/hooks/use-count-up';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@hotel-booking/types';

// Brand-tinted Recharts colours — turquoise primary, sunshine secondary.
const CHART_PRIMARY = '#06B6D4';
const CHART_SECONDARY = '#F59E0B';

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
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (!query.data) return null;
  const stats = query.data;
  const isCustomer = stats.scope === 'customer';
  const isHotelAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const staffManageHref = '/manage/hotels';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHero
        title="Dashboard"
        subtitle={
          isCustomer
            ? 'Your bookings and spend at a glance.'
            : `Welcome back, ${user?.name}. Here's how things are looking.`
        }
      />

      {isHotelAdmin || isManager ? (
        <Link
          href={staffManageHref}
          className={cn(
            'group relative flex overflow-hidden rounded-2xl border p-6 shadow-soft transition-all',
            'hover:-translate-y-0.5 hover:shadow-md',
            isHotelAdmin
              ? 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20'
              : 'border-teal-200/80 bg-gradient-to-br from-teal-50 to-emerald-50 dark:border-teal-900/40 dark:from-teal-950/30 dark:to-emerald-950/20',
          )}
        >
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm',
                    isHotelAdmin
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100'
                      : 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-100',
                  )}
                >
                  {isHotelAdmin ? (
                    <Shield className="h-5 w-5" aria-hidden />
                  ) : (
                    <Trees className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isHotelAdmin ? 'Administrator' : 'Property manager'}
                </p>
              </div>
              <p className="text-lg font-semibold tracking-tight">
                {isHotelAdmin ? 'Open hotel catalogue control' : 'Manage your assigned venues'}
              </p>
              <p className="max-w-xl text-sm text-muted-foreground">
                {isHotelAdmin
                  ? 'Create venues, delegate managers, prune listings across the marketplace.'
                  : 'Review availability, tweak storefront copy for your portfolio, maintain room plans.'}
              </p>
            </div>
            <span
              className={cn(
                'mt-4 inline-flex items-center gap-1 text-sm font-medium sm:mt-0',
                isHotelAdmin ? 'text-amber-900 dark:text-amber-200' : 'text-teal-900 dark:text-teal-200',
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isCustomer ? (
          <Tile
            label="Hotels"
            value={stats.totals.hotels}
            icon={Building2}
            tone="turquoise"
            delay={0}
          />
        ) : null}
        {!isCustomer ? (
          <Tile
            label="Rooms"
            value={stats.totals.rooms}
            icon={BedDouble}
            tone="sky"
            delay={60}
          />
        ) : null}
        <Tile
          label={isCustomer ? 'Your bookings' : 'Bookings'}
          value={stats.totals.bookings}
          icon={CalendarCheck}
          tone="emerald"
          delay={120}
        />
        <Tile
          label={isCustomer ? 'Your spend' : 'Revenue (confirmed)'}
          value={stats.totals.revenue}
          icon={DollarSign}
          tone="amber"
          format="currency"
          delay={180}
        />
        <Tile
          label="Upcoming"
          value={stats.upcomingBookings}
          icon={TrendingUp}
          tone="rose"
          delay={240}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card
          className="lg:col-span-2 border-0 shadow-soft animate-fade-up"
          style={{ animationDelay: '320ms' }}
        >
          <CardHeader>
            <CardTitle className="text-lg">
              {isCustomer ? 'Your booking activity (12 mo)' : 'Bookings & revenue (12 mo)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={stats.revenueByMonth}
                margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 8px 24px -8px rgba(6, 182, 212, 0.2)',
                  }}
                  formatter={(value: number | string, name: string) => {
                    if (name === 'revenue') return formatCurrency(Number(value));
                    return String(value);
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="bookings"
                  fill="url(#bookingsGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_SECONDARY}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_SECONDARY, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-soft animate-fade-up"
          style={{ animationDelay: '380ms' }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Booking status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.bookingsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              stats.bookingsByStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between text-sm"
                >
                  <StatusBadge status={row.status as BookingStatus} />
                  <span className="text-base font-semibold tracking-tight">
                    {row.count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const TONES = {
  turquoise: 'from-cyan-100 to-cyan-50 text-brand-turquoiseDeep ring-cyan-200',
  sky: 'from-sky-100 to-sky-50 text-sky-700 ring-sky-200',
  emerald: 'from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'from-amber-100 to-amber-50 text-amber-700 ring-amber-200',
  rose: 'from-rose-100 to-rose-50 text-rose-700 ring-rose-200',
} as const;

interface TileProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  format?: 'currency' | 'integer';
  delay: number;
}

function Tile({ label, value, icon: Icon, tone, format = 'integer', delay }: TileProps) {
  const animated = useCountUp(value);
  const display =
    format === 'currency'
      ? formatCurrency(animated)
      : Math.round(animated).toLocaleString();

  return (
    <Card
      className={cn(
        'group border-0 shadow-soft animate-fade-up',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{display}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1',
            TONES[tone],
            'transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
