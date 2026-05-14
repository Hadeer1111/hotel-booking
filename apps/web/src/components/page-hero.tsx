import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeroProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  /** Optional content rendered below the subtitle (e.g. a search input). */
  children?: React.ReactNode;
}

/**
 * Brand-coloured hero strip used at the top of customer-facing pages. The
 * radial highlight + duotone gradient give the page an immediate "alive" feel
 * without weighing the layout down with imagery.
 */
export function PageHero({
  title,
  subtitle,
  children,
  className,
  ...rest
}: PageHeroProps) {
  return (
    <section
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-soft',
        // 200% background size makes the gradient-shift keyframe visibly pan.
        'bg-gradient-to-br from-cyan-400 via-cyan-300 to-amber-200',
        'bg-[length:200%_200%] animate-gradient-shift',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/20 blur-3xl animate-float"
      />
      <div
        aria-hidden="true"
        className="absolute -top-12 -left-8 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div className="relative p-6 md:p-10 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-slate-800/80">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
