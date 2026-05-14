'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Lightweight shadcn-style wrapper around Recharts.
 * Exposes a ChartContainer + ChartTooltip + ChartLegend for theme-consistent dashboards.
 * Charts derive colors from CSS variables defined in chart configs so dark mode just works.
 */

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: { light: string; dark: string };
  }
>;

type ChartContextValue = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart(): ChartContextValue {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within <ChartContainer />');
  return context;
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className,
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = 'Chart';

function ChartStyle({ id, config }: { id: string; config: ChartConfig }): React.ReactElement | null {
  const colorConfig = Object.entries(config).filter(([, c]) => c.color ?? c.theme);
  if (!colorConfig.length) return null;
  const styles = colorConfig
    .map(([key, item]) => {
      const color = item.theme?.light ?? item.color;
      const dark = item.theme?.dark ?? item.color;
      return `[data-chart=${id}] { --color-${key}: ${color}; }\n.dark [data-chart=${id}] { --color-${key}: ${dark}; }`;
    })
    .join('\n');
  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    { active, payload, className, indicator = 'dot', hideLabel = false, hideIndicator = false, label },
    ref,
  ) => {
    const { config } = useChart();
    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className,
        )}
      >
        {hideLabel || !label ? null : <div className="font-medium">{label}</div>}
        <div className="grid gap-1.5">
          {payload.map((item, idx) => {
            const key = (item.dataKey ?? item.name ?? '') as string;
            const itemConfig = config[key];
            const color = item.color ?? itemConfig?.color;
            return (
              <div key={idx} className="flex w-full items-center gap-2">
                {!hideIndicator ? (
                  <div
                    className={cn('shrink-0 rounded-[2px]', {
                      'h-2.5 w-2.5': indicator === 'dot',
                      'h-0.5 w-3': indicator === 'line',
                      'h-0.5 w-3 border border-dashed bg-transparent': indicator === 'dashed',
                    })}
                    style={{ backgroundColor: color }}
                  />
                ) : null}
                <div className="flex flex-1 justify-between leading-none">
                  <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value?.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, useChart };
