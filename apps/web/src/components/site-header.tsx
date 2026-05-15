'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';
import { WishlistLink } from '@/components/wishlist/wishlist-link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const NAV_ITEMS_PUBLIC = [{ href: '/hotels', label: 'Hotels' }] as const;

type AuthedNavItem = {
  href: string;
  label: string;
  /** Tint active link + underline for staff-only entries. */
  activeVariant?: 'default' | 'admin' | 'manager';
};

function authedNavItems(role: string | undefined): readonly AuthedNavItem[] {
  const base: AuthedNavItem[] = [
    { href: '/hotels', label: 'Hotels' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/bookings', label: 'Bookings' },
  ];
  if (role === 'ADMIN') {
    return [...base, { href: '/manage/hotels', label: 'Hotel admin', activeVariant: 'admin' }];
  }
  if (role === 'MANAGER') {
    return [...base, { href: '/manage/hotels', label: 'My properties', activeVariant: 'manager' }];
  }
  return base;
}

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const items = user ? authedNavItems(user.role) : NAV_ITEMS_PUBLIC;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/60',
        'bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70',
        'transition-colors',
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <BrandLogo />
        <nav className="flex items-center gap-1 text-sm">
          {items.map((item) => {
            const v = 'activeVariant' in item ? item.activeVariant : undefined;
            const active =
              pathname === item.href ||
              (item.href.startsWith('/manage') ? pathname.startsWith('/manage') : pathname.startsWith(`${item.href}/`));
            const activeText =
              active && v === 'admin'
                ? 'text-amber-900 dark:text-amber-100'
                : active && v === 'manager'
                  ? 'text-teal-900 dark:text-teal-100'
                  : active
                    ? 'text-brand-turquoiseDeep'
                    : undefined;
            const underline =
              active && v === 'admin'
                ? 'bg-amber-500 dark:bg-amber-400'
                : active && v === 'manager'
                  ? 'bg-teal-500 dark:bg-teal-400'
                  : 'bg-brand-turquoise';
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  'relative rounded-full px-3 py-1.5 font-medium transition-colors',
                  activeText ??
                    (active ? 'text-brand-turquoiseDeep' : 'text-muted-foreground hover:text-foreground'),
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full',
                    underline,
                    'origin-center scale-x-0 transition-transform duration-300',
                    active ? 'scale-x-100' : 'group-hover:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
          <span className="mx-2 hidden h-5 w-px bg-border md:inline-block" />
          <ThemeToggle />
          <WishlistLink />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2 rounded-full border-brand-turquoise/30 bg-card px-3',
                    'hover:bg-secondary hover:border-brand-turquoise/50 hover:-translate-y-0.5',
                    'transition-all duration-200',
                  )}
                >
                  <UserAvatar name={user.name} role={user.role} />
                  <span className="max-w-[10ch] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuLabel className="flex items-center gap-2 pt-0 text-xs">
                  <span
                    className={cn(
                      'inline-flex h-1.5 w-1.5 rounded-full',
                      user.role === 'ADMIN'
                        ? 'bg-amber-400'
                        : user.role === 'MANAGER'
                          ? 'bg-brand-turquoise'
                          : 'bg-emerald-400',
                    )}
                  />
                  {user.role}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={async () => {
                    await logout();
                    router.push('/');
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === 'loading' ? null : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full shadow-soft hover:-translate-y-0.5 transition-transform">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function UserAvatar({ name, role }: { name: string; role?: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
  const gradient =
    role === 'ADMIN'
      ? 'from-amber-300 via-orange-200 to-rose-100'
      : role === 'MANAGER'
        ? 'from-teal-300 via-cyan-200 to-emerald-100'
        : 'from-cyan-300 to-amber-200';
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full',
        `bg-gradient-to-br ${gradient} text-[10px] font-semibold text-slate-900`,
      )}
    >
      {initials || '?'}
    </span>
  );
}
