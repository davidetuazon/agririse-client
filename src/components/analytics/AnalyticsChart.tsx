import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricKey } from "./MetricToggle";
import cssStyles from "./AnalyticsChart.module.css";

/* Chart colors: darker for clear visibility on light background */
const CHART_COLORS = {
  avgLine: "#064E3B", /* dark teal – stands out clearly */
  rangeFill: "rgba(6, 78, 59, 0.2)", /* visible band */
  grid: "#D1D5DB",
  axis: "#374151",
  metricLine: "#4F46E5", /* strong indigo for emphasized metric */
};

const PX_PER_BUCKET = 24;
const MIN_WIDE_WIDTH = 400;

export type AnalyticsBucket = {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
  total?: number;
};

type Props = {
  series: AnalyticsBucket[];
  unit: string;
  granularity: string;
  selectedMetric: MetricKey;
  mode: "fit" | "wide";
  height: number;
  className?: string;
};

function formatTickByGranularity(ts: string, granularity: string): string {
  const d = new Date(ts);
  if (granularity === "hourly") {
    return d.toISOString().slice(11, 16);
  }
  if (granularity === "daily") {
    return `${d.toISOString().slice(8, 10)} ${d.toISOString().slice(5, 7)}`;
  }
  return d.toISOString().slice(5, 10);
}

export default function AnalyticsChart({
  series,
  unit,
  granularity,
  selectedMetric,
  mode,
  height,
  className,
}: Props) {
  const chartData = useMemo(() => {
    const sorted = [...(series ?? [])].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const baseline = sorted.length ? Math.min(...sorted.map((r) => r.min)) : 0;
    return sorted.map((row) => ({
      ...row,
      timestamp: row.timestamp,
      name: formatTickByGranularity(row.timestamp, granularity),
      _baseline: baseline,
    }));
  }, [series, granularity]);

  const wideWidth = useMemo(() => {
    const count = chartData.length;
    return Math.max(MIN_WIDE_WIDTH, count * PX_PER_BUCKET);
  }, [chartData.length]);

  const yAxisUnit = unit ? ` (${unit})` : "";

  const tooltipContent = (props: unknown) => {
    const { active, payload } =
      (props as {
        active?: boolean;
        payload?: Array<{ payload?: AnalyticsBucket }>;
      }) ?? {};
    if (!active || !payload?.length || !payload[0].payload) return null;
    const p = payload[0].payload;
    const ts = new Date(p.timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    return (
      <div className={cssStyles.tooltip}>
        <div className={cssStyles.tooltipTime}>{ts} UTC</div>
        <div>
          avg: {p.avg?.toFixed(2)}
          {unit}
        </div>
        <div>
          min: {p.min?.toFixed(2)}
          {unit}
        </div>
        <div>
          max: {p.max?.toFixed(2)}
          {unit}
        </div>
        <div>σ: {p.stdDev != null ? p.stdDev.toFixed(2) : "—"}</div>
        <div>count: {p.count ?? "—"}</div>
        {p.total != null && (
          <div>
            total: {p.total.toFixed(2)}
            {unit}
          </div>
        )}
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div
        className={`${cssStyles.empty} ${className ?? ""}`}
        style={{ height }}
      >
        No data to display
      </div>
    );
  }

  const chart = (
    <AreaChart
      data={chartData}
      margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke={CHART_COLORS.grid}
        vertical
        horizontal
      />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(ts) => formatTickByGranularity(ts, granularity)}
        tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
        stroke={CHART_COLORS.axis}
        axisLine={{ stroke: CHART_COLORS.grid }}
      />
      <YAxis
        tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
        stroke={CHART_COLORS.axis}
        axisLine={{ stroke: CHART_COLORS.grid }}
        tickFormatter={(v) => (typeof v === "number" ? v.toFixed(1) : v)}
        label={
          yAxisUnit
            ? {
                value: yAxisUnit,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: CHART_COLORS.axis },
              }
            : undefined
        }
      />
      <Tooltip content={tooltipContent} />
      <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" iconSize={8} />
      <Area
        type="monotone"
        dataKey="max"
        baseValue={chartData[0]?._baseline ?? 0}
        stroke="transparent"
        fill={CHART_COLORS.rangeFill}
      />
      <Area
        type="monotone"
        dataKey="min"
        baseValue={chartData[0]?._baseline ?? 0}
        stroke="transparent"
        fill="#FFFFFF"
      />
      <Line
        type="monotone"
        dataKey="avg"
        stroke={CHART_COLORS.avgLine}
        strokeWidth={2}
        dot={false}
        name="Average"
      />
      {selectedMetric !== "avg" && (
        <Line
          type="monotone"
          dataKey={selectedMetric}
          stroke={CHART_COLORS.metricLine}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          name={selectedMetric}
        />
      )}
    </AreaChart>
  );

  const innerWidth = mode === "wide" ? wideWidth : "100%";

  return (
    <div
      className={`${cssStyles.scrollWrapper} ${className ?? ""}`}
      style={{ height }}
    >
      <div style={{ width: innerWidth, minWidth: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
