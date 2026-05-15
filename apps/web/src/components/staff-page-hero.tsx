import * as React from 'react';
import { Shield, Trees } from 'lucide-react';
import type { Role } from '@hotel-booking/types';
import { cn } from '@/lib/utils';

export interface StaffPageHeroProps extends React.HTMLAttributes<HTMLElement> {
  /** Drives accent gradient, badge, and iconography. */
  staffRole: Extract<Role, 'ADMIN' | 'MANAGER'>;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const ADMIN_GRADIENT =
  'from-amber-400 via-orange-300 to-rose-200 bg-[length:200%_200%] animate-gradient-shift';
const MANAGER_GRADIENT =
  'from-teal-400 via-cyan-300 to-emerald-200 bg-[length:200%_200%] animate-gradient-shift';

/**
 * Hero strip for ADMIN vs MANAGER surfaces: distinct gradients and badges so
 * staff never confuse platform-wide control with property-scoped operations.
 */
export function StaffPageHero({
  staffRole,
  title,
  subtitle,
  children,
  className,
  ...rest
}: StaffPageHeroProps) {
  const Icon = staffRole === 'ADMIN' ? Shield : Trees;

  return (
    <section
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-soft transition-colors sm:rounded-2xl',
        staffRole === 'ADMIN'
          ? 'border-amber-200/80 dark:border-amber-900/40'
          : 'border-teal-200/80 dark:border-teal-900/40',
        'bg-gradient-to-br',
        staffRole === 'ADMIN' ? ADMIN_GRADIENT : MANAGER_GRADIENT,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.5),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-white/25 blur-2xl"
      />
      <div className="relative p-4 animate-fade-up sm:p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur',
              staffRole === 'ADMIN'
                ? 'bg-amber-950/10 text-amber-950 dark:bg-amber-500/15 dark:text-amber-50'
                : 'bg-teal-950/10 text-teal-950 dark:bg-teal-500/15 dark:text-teal-50',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {staffRole === 'ADMIN' ? 'Administrator' : 'Property manager'}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-900 sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-slate-800/85 dark:text-slate-800/85">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
