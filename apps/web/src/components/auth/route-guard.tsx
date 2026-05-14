'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { Role } from '@hotel-booking/types';
import { useAuth } from '@/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteGuardProps {
  /** When provided, only these roles can see the route. */
  allow?: Role[];
  /** Where to send unauthenticated users; defaults to /login. */
  fallback?: string;
  children: ReactNode;
}

export function RouteGuard({ allow, fallback = '/login', children }: RouteGuardProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(fallback);
      return;
    }
    if (allow && user && !allow.includes(user.role)) {
      router.replace('/');
    }
  }, [allow, fallback, router, status, user]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (allow && user && !allow.includes(user.role)) return null;
  return <>{children}</>;
}
