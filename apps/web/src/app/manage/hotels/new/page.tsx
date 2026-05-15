'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { hotelsApi, type HotelUpsertPayload } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { HotelForm } from '@/components/manage/hotel-form';
import { StaffPageHero } from '@/components/staff-page-hero';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function NewHotelPage() {
  return (
    <RouteGuard allow={['ADMIN']}>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: (payload: HotelUpsertPayload) => hotelsApi.create(payload),
    onSuccess: async (hotel) => {
      toast({ title: 'Hotel created', description: hotel.name });
      await qc.invalidateQueries({ queryKey: queryKeys.hotels.all() });
      router.push(`/manage/hotels/${hotel.id}/edit`);
    },
    onError: (err) =>
      toast({
        title: 'Could not create hotel',
        description: (err as Error).message,
        variant: 'destructive',
      }),
  });

  return (
    <div className="container mx-auto max-w-xl space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
        <Link href="/manage/hotels">
          <ArrowLeft className="h-4 w-4" />
          Hotel directory
        </Link>
      </Button>

      <StaffPageHero
        staffRole="ADMIN"
        title="Register a venue"
        subtitle="Admins onboard new listings. Optionally assign an existing manager by UUID."
      />

      <Card className="border-amber-200/50 shadow-soft dark:border-amber-900/30">
        <CardHeader>
          <CardTitle>Hotel details</CardTitle>
          <CardDescription>Required fields mirror the catalogue on the guest site.</CardDescription>
        </CardHeader>
        <CardContent>
          <HotelForm
            submitLabel={create.isPending ? 'Saving…' : 'Create hotel'}
            disabled={create.isPending}
            showManagerField
            onSubmit={(data) =>
              create.mutate({
                ...data,
                managerId:
                  typeof data.managerId === 'string' && data.managerId.trim()
                    ? data.managerId.trim()
                    : undefined,
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
