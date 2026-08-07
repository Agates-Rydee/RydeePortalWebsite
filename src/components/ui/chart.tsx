import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/components/ui/utils";

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />");
  return ctx;
}

export function ChartContainer({
  id,
  config,
  className,
  children,
}: {
  id?: string;
  config: ChartConfig;
  className?: string;
  children: React.ReactElement;
}) {
  const uid = React.useId();
  const chartId = `chart-${id ?? uid.replace(/:/g, "")}`;
  const cssVars = Object.entries(config)
    .map(([key, v]) => `--color-${key}: ${v.color};`)
    .join(" ");
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-square justify-center text-xs",
          "[&_.recharts-sector[stroke=#fff]]:stroke-transparent",
          "[&_.recharts-layer]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className,
        )}
      >
        <style>{`[data-chart='${chartId}'] { ${cssVars} }`}</style>
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

interface PayloadEntry {
  name?: string | number;
  value?: number;
  dataKey?: string | number;
  payload?: { fill?: string; name?: string; [k: string]: unknown };
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel,
  hideItemLabel,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string | number;
  hideLabel?: boolean;
  hideItemLabel?: boolean;
}) {
  const { config } = useChart();
  if (!active || !payload || payload.length === 0) return null;
  const titleLabel = label ?? payload[0]?.payload?.name;
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md text-popover-foreground">
      {!hideLabel && titleLabel !== undefined && titleLabel !== "" && (
        <div className="pb-1 font-medium text-foreground">{titleLabel}</div>
      )}
      {payload.map((item, i) => {
        const key = String(item.dataKey ?? item.name ?? "");
        const cfg = config[key];
        const itemLabel = cfg?.label ?? item.payload?.name ?? key;
        const color = item.payload?.fill ?? cfg?.color;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: color }}
            />
            {!hideItemLabel && <span className="text-muted-foreground">{itemLabel}</span>}
            <span className="ms-auto font-medium tabular-nums">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

interface LegendPayloadEntry {
  value?: string;
  color?: string;
  dataKey?: string | number;
  payload?: { fill?: string; value?: number; name?: string; [k: string]: unknown };
}

export function ChartLegendContent({
  payload,
  hideCount,
}: {
  payload?: LegendPayloadEntry[];
  hideCount?: boolean;
}) {
  const { config } = useChart();
  if (!payload || payload.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-xs">
      {payload.map((item, i) => {
        const key = String(item.dataKey ?? item.value ?? "");
        const cfg = config[key];
        const label = cfg?.label ?? item.value ?? key;
        const color = item.color ?? item.payload?.fill ?? cfg?.color;
        const count = item.payload?.value;
        return (
          <li key={i} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: color }}
            />
            <span className="text-muted-foreground">{label}</span>
            {!hideCount && typeof count === "number" && (
              <span className="font-medium tabular-nums">{count}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
