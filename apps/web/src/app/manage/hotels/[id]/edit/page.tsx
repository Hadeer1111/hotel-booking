'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { hotelsApi, type HotelUpsertPayload } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { HotelForm } from '@/components/manage/hotel-form';
import { StaffPageHero } from '@/components/staff-page-hero';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function EditHotelPage() {
  return (
    <RouteGuard allow={['ADMIN', 'MANAGER']}>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const hotelId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const isAdmin = user?.role === 'ADMIN';
  const staffRole = isAdmin ? 'ADMIN' : 'MANAGER';

  const hotelQuery = useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.detail(hotelId),
  });

  useEffect(() => {
    const h = hotelQuery.data;
    if (!user || !h || hotelQuery.isPending) return;
    if (user.role === 'MANAGER' && h.managerId !== user.id) {
      toast({
        title: 'Not authorized',
        description: 'Managers can only edit hotels assigned to them.',
        variant: 'destructive',
      });
      router.replace('/manage/hotels');
    }
  }, [hotelQuery.data, hotelQuery.isPending, router, toast, user]);

  const update = useMutation({
    mutationFn: (payload: Partial<HotelUpsertPayload>) =>
      hotelsApi.update(hotelId, payload),
    onSuccess: async (hotel) => {
      toast({ title: 'Saved', description: hotel.name });
      await qc.invalidateQueries({ queryKey: queryKeys.hotels.all() });
      await qc.invalidateQueries({ queryKey: queryKeys.hotels.detail(hotelId) });
    },
    onError: (err) =>
      toast({
        title: 'Could not update',
        description: (err as Error).message,
        variant: 'destructive',
      }),
  });

  if (hotelQuery.isLoading || !hotelQuery.data) {
    return (
      <div className="container mx-auto max-w-xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const hotel = hotelQuery.data;

  return (
    <div className="container mx-auto max-w-xl space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
        <Link href="/manage/hotels">
          <ArrowLeft className="h-4 w-4" />
          {isAdmin ? 'Hotel directory' : 'My properties'}
        </Link>
      </Button>

      <StaffPageHero
        staffRole={staffRole}
        title={isAdmin ? 'Edit catalogue listing' : 'Update your venue'}
        subtitle={
          isAdmin
            ? 'Changes apply globally for every guest browsing the catalogue.'
            : 'Polish listing details guests see for your assigned properties.'
        }
      />

      <Card
        className={cn(
          'shadow-soft',
          isAdmin
            ? 'border-amber-200/50 dark:border-amber-900/30'
            : 'border-teal-200/60 dark:border-teal-900/35',
        )}
      >
        <CardHeader>
          <CardTitle>{hotel.name}</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Full control across name, geography, tier, lifecycle, and manager assignment.'
              : 'You maintain how this venue looks on the storefront. Contact an admin to change ownership.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotelForm
            key={hotel.updatedAt}
            initial={{
              name: hotel.name,
              city: hotel.city,
              address: hotel.address,
              stars: hotel.stars,
              status: hotel.status,
              managerId: hotel.managerId ?? undefined,
            }}
            disabled={update.isPending}
            submitLabel={update.isPending ? 'Saving…' : 'Save changes'}
            showManagerField={isAdmin}
            onSubmit={(data) => {
              const payload: Partial<HotelUpsertPayload> = {
                name: data.name,
                city: data.city,
                address: data.address,
                stars: data.stars,
                status: data.status,
              };
              if (isAdmin) {
                payload.managerId = data.managerId?.trim() ? data.managerId.trim() : null;
              }
              update.mutate(payload);
            }}
          />
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2 border-t pt-4 sm:flex-row sm:justify-between">
          <Button variant="outline" asChild className="rounded-full">
            <Link href={`/manage/hotels/${hotelId}/rooms`}>Manage rooms & types</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full text-muted-foreground">
            <Link href={`/hotels/${hotelId}`}>View public page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
