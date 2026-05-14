import * as React from 'react';
import { CheckCircle2, Clock, CreditCard, RefreshCcw, XCircle } from 'lucide-react';
import type { BookingStatus, PaymentStatus } from '@hotel-booking/types';
import { cn } from '@/lib/utils';

type Status = BookingStatus | PaymentStatus;

interface StatusVisual {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the chip body. */
  classes: string;
  /** When true, render with a soft pulse to signal something in-flight. */
  pulse?: boolean;
}

const VISUALS: Record<Status, StatusVisual> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200',
    pulse: true,
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle2,
    classes: 'bg-cyan-100 text-brand-turquoiseDeep ring-1 ring-cyan-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    classes: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200',
  },
  REQUIRES_PAYMENT: {
    label: 'Awaiting payment',
    icon: CreditCard,
    classes: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200',
    pulse: true,
  },
  SUCCEEDED: {
    label: 'Paid',
    icon: CheckCircle2,
    classes: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    classes: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: RefreshCcw,
    classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  },
};

export interface StatusBadgeProps {
  status: Status;
  className?: string;
  /** Hide the icon if you just want the textual chip. */
  iconOnly?: boolean;
}

export function StatusBadge({ status, className, iconOnly = false }: StatusBadgeProps) {
  const visual = VISUALS[status] ?? {
    label: status,
    icon: Clock,
    classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  };
  const Icon = visual.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        visual.classes,
        visual.pulse && 'animate-pulse',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {iconOnly ? <span className="sr-only">{visual.label}</span> : visual.label}
    </span>
  );
}
