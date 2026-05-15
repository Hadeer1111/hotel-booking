'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getHotelImage } from '@/lib/hotel-image';
import { getHotelGradient } from '@/lib/hotel-gradient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { HotelBookingPanel } from '@/components/booking/hotel-booking-panel';

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const hotelId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const hotelQuery = useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.detail(hotelId),
  });

  if (hotelQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }
  if (hotelQuery.isError || !hotelQuery.data) {
    const staff = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    return (
      <div className="container mx-auto max-w-lg space-y-4 p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/hotels')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to hotels
        </Button>
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-12 text-center">
          <p className="font-semibold tracking-tight">This listing is unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {staff
              ? 'If this hotel is inactive, open it from your staff dashboard to preview or publish it again.'
              : 'It may be inactive or no longer visible on our catalogue.'}
          </p>
        </div>
      </div>
    );
  }
  const hotel = hotelQuery.data;
  const image = getHotelImage(hotel.name, 1600);
  const gradient = getHotelGradient(hotel.name);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 self-start text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <section className={cn('relative overflow-hidden rounded-3xl shadow-soft bg-gradient-to-br', gradient)}>
        <div className="relative min-h-[14rem] h-52 sm:h-72 md:h-96">
          <Image
            src={image.src}
            alt={`${hotel.name} cover image`}
            fill
            priority
            sizes="(min-width: 1024px) 80vw, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent"
          />
          <WishlistButton
            hotelId={hotel.id}
            hotelName={hotel.name}
            size="md"
            className="absolute right-5 top-5 z-10"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 border-0 bg-white/95 text-slate-900 backdrop-blur">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{hotel.stars}</span>
              </Badge>
              <Badge
                variant="secondary"
                className="border-0 bg-white/20 text-white backdrop-blur"
              >
                {hotel.status}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-5xl">
              {hotel.name}
            </h1>
            <p className="mt-2 flex items-start gap-2 text-sm text-white/85 sm:text-base md:items-center">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 md:mt-0" aria-hidden />
              <span className="break-words">
                {hotel.city} · {hotel.address}
              </span>
            </p>
          </div>
        </div>
      </section>

      <HotelBookingPanel hotelId={hotel.id} />

      {hotel.createdAt ? (
        <p className="pt-4 text-center text-xs text-muted-foreground">
          Listed {formatDate(hotel.createdAt)}
        </p>
      ) : null}
    </div>
  );
}
