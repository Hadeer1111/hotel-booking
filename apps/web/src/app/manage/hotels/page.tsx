'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BedDouble,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import type { Hotel } from '@hotel-booking/types';
import { fetchHotelsManageCatalog, hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { StaffPageHero } from '@/components/staff-page-hero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ManageHotelsPage() {
  return (
    <RouteGuard allow={['ADMIN', 'MANAGER']}>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const staffRole = isAdmin ? 'ADMIN' : 'MANAGER';

  const listQuery = useQuery({
    queryKey: queryKeys.hotels.manageCatalog(),
    queryFn: fetchHotelsManageCatalog,
    /** Full catalogue scan can lag on large datasets (~100 rows per HTTP round-trip). */
    staleTime: 30_000,
  });

  const hotels = useMemo(() => {
    const all = listQuery.data ?? [];
    if (isAdmin) return all;
    return all.filter((h) => h.managerId === user?.id);
  }, [listQuery.data, isAdmin, user?.id]);

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <StaffPageHero
        staffRole={staffRole}
        title={isAdmin ? 'Hotel directory' : 'Your properties'}
        subtitle={
          isAdmin
            ? 'Create, edit, and remove hotels platform-wide. Assign managers when you onboard a venue.'
            : 'Only venues assigned to you appear here — update listings and inventory for your portfolio.'
        }
      >
        {isAdmin ? (
          <Link href="/manage/hotels/new">
            <Button className="gap-2 rounded-full shadow-soft hover:-translate-y-0.5 transition-transform">
              <Plus className="h-4 w-4" />
              Add hotel
            </Button>
          </Link>
        ) : (
          <p className="text-sm font-medium text-slate-900/70">
            Need another property on your roster? Ask an administrator to assign you as manager.
          </p>
        )}
      </StaffPageHero>

      {listQuery.isError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Could not load the hotel directory. The API may be down, or the request hit a
            validation error. Try refreshing the page.
          </CardContent>
        </Card>
      ) : listQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : hotels.length === 0 ? (
        <Card className={cn('border border-dashed', isAdmin ? 'border-amber-200/70' : 'border-teal-200/70')}>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BedDouble className={cn('h-10 w-10', isAdmin ? 'text-amber-600' : 'text-teal-600')} />
            <p className="max-w-md text-sm text-muted-foreground">
              {isAdmin
                ? 'No hotels in the catalogue yet — add the first venue to get started.'
                : 'No hotels are assigned to you yet. Contact an admin to link your account to a venue.'}
            </p>
            {isAdmin ? (
              <Link href="/manage/hotels/new">
                <Button variant="outline" className="gap-2 rounded-full">
                  <Plus className="h-4 w-4" />
                  Create hotel
                </Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hotels.map((hotel, i) => (
            <HotelManageCard
              key={hotel.id}
              hotel={hotel}
              animationDelay={i * 40}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HotelManageCard({
  hotel,
  animationDelay,
  isAdmin,
}: {
  hotel: Hotel;
  animationDelay?: number;
  isAdmin: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const remove = useMutation({
    mutationFn: () => hotelsApi.remove(hotel.id),
    onSuccess: async () => {
      toast({ title: 'Hotel removed', description: hotel.name });
      await qc.invalidateQueries({ queryKey: queryKeys.hotels.all() });
    },
    onError: (err) =>
      toast({
        title: 'Could not delete',
        description: (err as Error).message,
        variant: 'destructive',
      }),
  });

  return (
    <li
      className="animate-fade-up"
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <Card
        className={cn(
          'h-full overflow-hidden border-0 shadow-soft transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-lg',
          isAdmin
            ? 'ring-1 ring-amber-200/60 dark:ring-amber-900/30'
            : 'ring-1 ring-teal-200/60 dark:ring-teal-900/30',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide',
            isAdmin
              ? 'border-amber-100 bg-amber-50/90 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100'
              : 'border-teal-100 bg-teal-50/90 text-teal-900 dark:border-teal-900/40 dark:bg-teal-950/40 dark:text-teal-100',
          )}
        >
          {isAdmin ? 'Platform catalogue' : 'Your assignment'}
        </div>
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold leading-snug">{hotel.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {hotel.city}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hotel.address}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1 rounded-full font-normal">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {hotel.stars}
            </Badge>
            <Badge variant="outline" className="rounded-full capitalize">
              {hotel.status.toLowerCase()}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href={`/manage/hotels/${hotel.id}/rooms`}>
              <Button variant="outline" size="sm" className="gap-1 rounded-full">
                <BedDouble className="h-3.5 w-3.5" /> Rooms & types
              </Button>
            </Link>
            <Link href={`/manage/hotels/${hotel.id}/edit`}>
              <Button size="sm" className="gap-1 rounded-full">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            {isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${hotel.name}`}
                title="Delete hotel"
                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (
                    typeof window !== 'undefined' &&
                    window.confirm(`Delete "${hotel.name}" permanently? This cannot be undone.`)
                  ) {
                    remove.mutate();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
