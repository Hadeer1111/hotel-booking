'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Menu } from 'lucide-react';
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
  /** Tint active link + underline for staff-only entries (desktop strip). */
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

function routeActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href.startsWith('/manage')) return pathname.startsWith('/manage');
  return pathname.startsWith(`${href}/`);
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
      <div className="container flex h-14 min-h-[3.25rem] items-center justify-between gap-3 sm:h-16">
        <BrandLogo className="min-w-0 shrink" />
        {/* Desktop */}
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden text-sm md:flex">
          {items.map((item) => (
            <DesktopNavLink key={`${item.href}-${item.label}`} item={item} pathname={pathname} />
          ))}
          <span className="mx-2 hidden h-5 w-px shrink-0 bg-border lg:inline-block" aria-hidden />
          <ThemeToggle />
          <WishlistLink />
          <DesktopAuthControls
            status={status}
            user={user}
            logout={() => logout().then(() => router.push('/'))}
          />
        </nav>

        {/* Mobile */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:hidden">
          <ThemeToggle />
          <WishlistLink />
          <MobileMenu
            pathname={pathname}
            items={[...items]}
            user={user}
            status={status}
            logout={async () => {
              await logout();
              router.push('/');
            }}
          />
        </div>
      </div>
    </header>
  );
}

function DesktopNavLink({
  item,
  pathname,
}: {
  item: AuthedNavItem | (typeof NAV_ITEMS_PUBLIC)[number];
  pathname: string;
}) {
  const v = 'activeVariant' in item ? item.activeVariant : undefined;
  const active = routeActive(pathname, item.href);
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
      href={item.href}
      className={cn(
        'group relative shrink-0 rounded-full px-2.5 py-1.5 font-medium transition-colors sm:px-3',
        activeText ??
          (active ? 'text-brand-turquoiseDeep' : 'text-muted-foreground hover:text-foreground'),
      )}
    >
      {item.label}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full sm:inset-x-3',
          underline,
          'origin-center scale-x-0 transition-transform duration-300',
          active ? 'scale-x-100' : 'group-hover:scale-x-100',
        )}
      />
    </Link>
  );
}

function DesktopAuthControls(props: {
  status: ReturnType<typeof useAuth>['status'];
  user: ReturnType<typeof useAuth>['user'];
  logout: () => Promise<void>;
}) {
  const { status, user, logout } = props;
  if (user) {
    return (
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
          <DropdownMenuLabel className="text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
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
          <DropdownMenuItem className="gap-2" onSelect={() => void logout()}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  if (status === 'loading') return null;
  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm" className="rounded-full">
          Sign in
        </Button>
      </Link>
      <Link href="/register">
        <Button
          size="sm"
          className="rounded-full shadow-soft hover:-translate-y-0.5 transition-transform"
        >
          Sign up
        </Button>
      </Link>
    </>
  );
}

function MobileMenu(props: {
  pathname: string;
  items: AuthedNavItem[] | typeof NAV_ITEMS_PUBLIC;
  user: ReturnType<typeof useAuth>['user'];
  status: ReturnType<typeof useAuth>['status'];
  logout: () => Promise<void>;
}) {
  const { pathname, items, user, status, logout } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 rounded-full border-brand-turquoise/30 md:hidden',
            'focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label="Open menu"
        >
          <Menu className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),18rem)] max-h-[min(80vh,28rem)] overflow-y-auto">
        {items.map((item) => {
          const v = 'activeVariant' in item ? item.activeVariant : undefined;
          const active = routeActive(pathname, item.href);
          return (
            <DropdownMenuItem key={`${item.href}-${item.label}`} asChild>
              <Link
                href={item.href}
                className={cn(
                  'cursor-pointer',
                  active &&
                    v === 'admin' &&
                    'bg-amber-100/80 text-amber-950 focus:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-50',
                  active &&
                    v === 'manager' &&
                    'bg-teal-100/80 text-teal-950 focus:bg-teal-100 dark:bg-teal-950/35 dark:text-teal-50',
                  active &&
                    !v &&
                    'bg-brand-turquoise/15 text-brand-turquoiseDeep focus:bg-brand-turquoise/20',
                )}
              >
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {status === 'loading' ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Loading…
          </DropdownMenuItem>
        ) : user ? (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Signed in as
            </DropdownMenuLabel>
            <DropdownMenuLabel className="truncate pt-0 text-xs font-semibold">{user.email}</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => void logout()}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">Sign in</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register">Sign up</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
