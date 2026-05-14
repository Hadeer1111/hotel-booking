'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Branded shadcn calendar built on react-day-picker. Tropical Joy palette is
 * applied via tokens: selected cells use --primary, the range middle picks
 * --secondary, today is ringed in --ring. Animations are intentionally
 * subtle so date selection feels light.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-3',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold tracking-tight',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-full',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-8 font-medium text-[0.7rem] uppercase tracking-wider',
        row: 'flex w-full mt-1',
        cell: cn(
          'relative p-0 text-center text-sm',
          'focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-secondary',
          '[&:has([aria-selected].day-range-end)]:rounded-r-full',
          '[&:has([aria-selected].day-range-start)]:rounded-l-full',
          '[&:has([aria-selected].day-outside)]:bg-secondary/40',
          'first:[&:has([aria-selected])]:rounded-l-full',
          'last:[&:has([aria-selected])]:rounded-r-full',
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 font-normal rounded-full transition-all duration-150',
          'aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary',
        ),
        day_range_start:
          'day-range-start !rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-glow',
        day_range_end:
          'day-range-end !rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-glow',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'ring-2 ring-ring ring-offset-1 ring-offset-background',
        day_outside:
          'day-outside text-muted-foreground/60 aria-selected:bg-secondary/40',
        day_disabled: 'text-muted-foreground/40 opacity-50 cursor-not-allowed',
        day_range_middle:
          'aria-selected:bg-secondary aria-selected:text-secondary-foreground !rounded-none',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
