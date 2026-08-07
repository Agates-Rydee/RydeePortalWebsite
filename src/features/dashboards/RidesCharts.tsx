import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RidesSummary } from "@/api/rides";

interface Props {
  summary: RidesSummary;
}

interface PieSlice {
  key: "completed" | "canceled" | "live" | "upcoming";
  name: string;
  value: number;
  fill: string;
}

export function RidesOverviewChart({ summary }: Props) {
  const { t } = useTranslation();

  const config: ChartConfig = {
    completed: { label: t("dashboards.ridesOverview.slices.completed"), color: "var(--chart-completed)" },
    canceled: { label: t("dashboards.ridesOverview.slices.canceled"), color: "var(--chart-canceled)" },
    live: { label: t("dashboards.ridesOverview.slices.live"), color: "var(--chart-live)" },
    upcoming: { label: t("dashboards.ridesOverview.slices.upcoming"), color: "var(--chart-upcoming)" },
  };

  const slices = useMemo<PieSlice[]>(
    () => [
      { key: "completed", name: config.completed.label, value: summary.completedTotal, fill: "var(--color-completed)" },
      { key: "canceled", name: config.canceled.label, value: summary.canceledTotal, fill: "var(--color-canceled)" },
      { key: "live", name: config.live.label, value: summary.liveTotal, fill: "var(--color-live)" },
      { key: "upcoming", name: config.upcoming.label, value: summary.upcomingTotal, fill: "var(--color-upcoming)" },
    ],
    [summary, config.completed.label, config.canceled.label, config.live.label, config.upcoming.label],
  );

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const nonZero = slices.filter((s) => s.value > 0);

  const monthly = summary.monthly;
  const trend = useMemo(() => {
    if (monthly.length < 2) return { pct: 0, dir: "flat" as const };
    const prev = monthly[monthly.length - 2].completed;
    const curr = monthly[monthly.length - 1].completed;
    if (prev === 0 && curr === 0) return { pct: 0, dir: "flat" as const };
    if (prev === 0) return { pct: 100, dir: "up" as const };
    const pct = ((curr - prev) / prev) * 100;
    return { pct: Math.abs(pct), dir: pct > 0.5 ? ("up" as const) : pct < -0.5 ? ("down" as const) : ("flat" as const) };
  }, [monthly]);

  const trendLabel =
    trend.dir === "up"
      ? t("dashboards.ridesOverview.trendUp", { pct: trend.pct.toFixed(1) })
      : trend.dir === "down"
        ? t("dashboards.ridesOverview.trendDown", { pct: trend.pct.toFixed(1) })
        : t("dashboards.ridesOverview.trendFlat");

  const lang = t("common.localeCode", { defaultValue: "en" });
  const monthName = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };
  const rangeLabel =
    monthly.length > 0
      ? t("dashboards.ridesOverview.range", {
          from: monthName(monthly[0].month),
          to: monthName(monthly[monthly.length - 1].month),
        })
      : t("dashboards.ridesOverview.subtitle");

  const TrendIcon = trend.dir === "up" ? TrendingUp : trend.dir === "down" ? TrendingDown : Minus;

  const srSummary = t("dashboards.ridesOverview.srSummary", {
    completed: summary.completedTotal,
    canceled: summary.canceledTotal,
    live: summary.liveTotal,
    upcoming: summary.upcomingTotal,
  });

  return (
    <Card className="rounded-xl flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("dashboards.ridesOverview.title")}</CardTitle>
        <CardDescription>{rangeLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <span className="sr-only">{srSummary}</span>
        {total === 0 || nonZero.length === 0 ? (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            {t("dashboards.ridesOverview.empty")}
          </div>
        ) : (
          <ChartContainer config={config} className="mx-auto aspect-square max-h-[240px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={nonZero} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={2} isAnimationActive={false}>
                {nonZero.map((s) => (
                  <Cell key={s.key} fill={s.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {trendLabel}
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="leading-none text-muted-foreground">
          {t("dashboards.ridesOverview.caption", { total })}
        </div>
      </CardFooter>
    </Card>
  );
}

export function BusyAreasChart({ summary }: Props) {
  const { t } = useTranslation();
  const areas = summary.areas.slice(0, 6);

  const config: ChartConfig = {
    rides: { label: t("dashboards.busyAreas.axisLabel"), color: "var(--chart-live)" },
  };

  const srSummary =
    areas.length === 0
      ? t("dashboards.busyAreas.empty")
      : areas.map((a) => t("dashboards.busyAreas.srItem", { label: a.label, count: a.rides })).join(", ");

  const maxIdx = areas.length > 0 ? 0 : -1;

  return (
    <Card className="rounded-xl flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("dashboards.busyAreas.title")}</CardTitle>
        <CardDescription>{t("dashboards.busyAreas.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <span className="sr-only">{srSummary}</span>
        {areas.length === 0 ? (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            {t("dashboards.busyAreas.empty")}
          </div>
        ) : (
          <ChartContainer config={config} className="mx-auto aspect-square max-h-[240px] w-full">
            <BarChart data={areas} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="rides" radius={4} isAnimationActive={false}>
                {areas.map((_, i) => (
                  <Cell key={i} fill={i === maxIdx ? "var(--color-rides)" : "var(--chart-upcoming)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      {areas.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 pb-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: "var(--chart-live)" }}
            />
            <span className="text-muted-foreground">{t("dashboards.busyAreas.legendBusiest")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: "var(--chart-upcoming)" }}
            />
            <span className="text-muted-foreground">{t("dashboards.busyAreas.legendOther")}</span>
          </span>
        </div>
      )}
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          {t("dashboards.busyAreas.caption")}
        </div>
      </CardFooter>
    </Card>
  );
}
