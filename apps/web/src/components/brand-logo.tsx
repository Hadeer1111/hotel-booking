import * as React from 'react';
import Link from 'next/link';
import { Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  href?: string;
  /** Compact mode hides the wordmark and only shows the icon mark. */
  compact?: boolean;
  className?: string;
}

/**
 * App-wide brand mark: a turquoise rounded square housing a palm icon, paired
 * with a gradient wordmark. Hovering nudges the icon mark and lights up the
 * gradient so the header feels a little playful without being distracting.
 */
export function BrandLogo({ href = '/', compact = false, className }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-2.5 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-cyan-400 via-cyan-300 to-amber-200',
          'shadow-soft transition-transform duration-300',
          'group-hover:-rotate-6 group-hover:scale-105',
        )}
      >
        <Palmtree className="h-5 w-5 text-slate-900" strokeWidth={2.25} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-background" />
      </span>
      {compact ? null : (
        <span
          className={cn(
            'text-lg font-semibold tracking-tight',
            'bg-gradient-to-r from-brand-turquoiseDeep via-brand-turquoise to-amber-500',
            'bg-clip-text text-transparent',
            'transition-[background-position] duration-500',
          )}
        >
          Sojourn
        </span>
      )}
    </Link>
  );
}
