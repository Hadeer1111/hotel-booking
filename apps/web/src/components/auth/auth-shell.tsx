import * as React from 'react';
import Link from 'next/link';
import { Palmtree, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthShellProps {
  /** Right-side form content. */
  children: React.ReactNode;
  /** Big tagline shown on the branded panel. */
  tagline: string;
  /** Short paragraph under the tagline. */
  blurb: string;
}

/**
 * Two-column shell for /login and /register. On md+ the left panel shows a
 * branded animated gradient + tagline; on small screens the panel collapses
 * away and the form takes the full viewport.
 */
export function AuthShell({ children, tagline, blurb }: AuthShellProps) {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid overflow-hidden rounded-3xl shadow-soft md:grid-cols-2">
        <aside className="relative hidden min-h-[640px] overflow-hidden md:block">
          <div
            aria-hidden="true"
            className={cn(
              'absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-300 to-amber-200',
              'bg-[length:200%_200%] animate-gradient-shift',
            )}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/25 blur-3xl animate-float"
          />
          <div
            aria-hidden="true"
            className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-float"
            style={{ animationDelay: '2.5s' }}
          />

          <div className="relative flex h-full flex-col justify-between p-10 text-slate-900">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-sm font-semibold"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-soft">
                <Palmtree className="h-5 w-5 text-brand-turquoiseDeep" strokeWidth={2.25} />
              </span>
              <span className="tracking-tight">Sojourn</span>
            </Link>

            <div className="animate-fade-up space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand-turquoiseDeep shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Tropical Joy
              </span>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {tagline}
              </h2>
              <p className="max-w-md text-slate-800/85">{blurb}</p>
            </div>

            <p className="animate-fade-up text-xs text-slate-800/70" style={{ animationDelay: '120ms' }}>
              Trusted by guests, managers, and admins worldwide.
            </p>
          </div>
        </aside>

        <main className="relative flex items-center justify-center bg-card p-6 md:p-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
