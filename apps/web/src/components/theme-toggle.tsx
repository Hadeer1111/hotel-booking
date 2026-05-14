'use client';

import * as React from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const ORDER = ['light', 'dark', 'system'] as const;
type ThemeChoice = (typeof ORDER)[number];

/**
 * Three-state cycle button: light → dark → system → light. We mirror the
 * `next-themes` choices instead of a two-state toggle so users keep their
 * OS-driven preference without a settings page.
 *
 * Hydration: `next-themes` resolves the theme on the client only. We gate
 * the visible state on a `mounted` flag so the first paint matches the
 * server output (a neutral sun icon).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current: ThemeChoice = mounted && ORDER.includes(theme as ThemeChoice)
    ? (theme as ThemeChoice)
    : 'system';

  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  const Icon = current === 'light' ? Sun : current === 'dark' ? Moon : Laptop;
  const label = mounted
    ? `Theme: ${current}. Click to switch to ${next}.`
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
      <Icon
        // Remount when the resolved theme changes so the swap animates.
        key={current}
        className="h-4 w-4 animate-pop-in"
      />
    </button>
  );
}
