'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

/**
 * Two-state toggle between light and dark. The provider still defaults to
 * `system` so first-time visitors get their OS preference, but the toggle
 * always flips to an explicit choice — there's no third "system" stop in
 * the click cycle (the icon would have been ambiguous).
 *
 * Icon shown is the *current* resolved mode: sun in light, moon in dark.
 * Hydration: `next-themes` resolves the theme on the client only. We gate
 * the visible icon on a `mounted` flag so the first paint matches SSR.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const label = mounted
    ? `Switch to ${next} mode`
    : 'Toggle theme';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200',
        'hover:bg-secondary hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {isDark ? (
        <Moon key="moon" className="h-4 w-4 animate-pop-in" />
      ) : (
        <Sun key="sun" className="h-4 w-4 animate-pop-in" />
      )}
    </button>
  );
}
