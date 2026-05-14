import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import type { Hotel } from '@hotel-booking/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { getHotelGradient } from '@/lib/hotel-gradient';
import { getHotelImage } from '@/lib/hotel-image';
import { cn } from '@/lib/utils';

export interface HotelCardProps {
  hotel: Hotel;
  /** Stagger entrance animation (ms) when rendered inside a grid. */
  animationDelay?: number;
  className?: string;
}

export function HotelCard({ hotel, animationDelay, className }: HotelCardProps) {
  const image = getHotelImage(hotel.name);
  const gradient = getHotelGradient(hotel.name);

  return (
    <Link
      href={`/hotels/${hotel.id}`}
      className={cn('block group animate-fade-up focus:outline-none', className)}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <Card
        className={cn(
          'h-full overflow-hidden border-0 bg-card shadow-soft',
          'transition-all duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:shadow-lg',
          'group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2',
        )}
      >
        <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br', gradient)}>
          {/* Image sits on top of the gradient so the gradient acts as both
              loading placeholder and graceful fallback if Unsplash returns 404. */}
          <Image
            src={image.src}
            alt={`${hotel.name} cover image`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              'object-cover',
              'transition-transform duration-700 ease-out',
              'group-hover:scale-110',
            )}
          />
          {/* Bottom-up gradient keeps the badge readable on bright photos. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
          />
          <Badge className="absolute right-3 top-3 gap-1 border-0 bg-white/95 px-2.5 py-1 text-slate-900 shadow-sm backdrop-blur transition-transform duration-300 group-hover:scale-105">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium">{hotel.stars}</span>
          </Badge>
          {typeof hotel.minNightlyPrice === 'number' && (
            <div
              className={cn(
                'absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-slate-900',
                'shadow-sm backdrop-blur transition-transform duration-300 group-hover:scale-105',
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">from</span>{' '}
              <span className="font-semibold text-brand-turquoiseDeep">
                {formatCurrency(hotel.minNightlyPrice)}
              </span>
              <span className="text-xs text-muted-foreground"> / night</span>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg leading-tight transition-colors group-hover:text-brand-turquoiseDeep">
            {hotel.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-turquoise" />
            <span className="font-medium text-foreground">{hotel.city}</span>
          </p>
          <p className="line-clamp-1">{hotel.address}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function HotelCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-0 shadow-soft">
      <Skeleton className="h-44 w-full rounded-none" />
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3.5 w-3/4" />
      </CardContent>
    </Card>
  );
}
