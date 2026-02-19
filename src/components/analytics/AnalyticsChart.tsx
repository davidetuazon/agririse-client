import { useMemo } from "react";
import {
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricKey } from "./MetricToggle";
import cssStyles from "./AnalyticsChart.module.css";

/* Red min/max edges, green band, distinct average line */
const CHART_COLORS = {
  avgLine: "#1E40AF",         /* blue – main line (average) */
  rangeFill: "rgba(22, 163, 74, 0.35)",  /* green – band between min and max */
  rangeFillBottom: "#FFFFFF",
  minLine: "#DC2626",         /* red – bottom of band */
  maxLine: "#B91C1C",         /* darker red – top of band */
  grid: "#94A3B8",
  axis: "#1E293B",
  metricLine: "#6B21A8",      /* purple – emphasized metric (min/max/σ) */
};

const PX_PER_BUCKET = 24;
const MIN_WIDE_WIDTH = 400;

export type AnomalyItem = {
  type: string;
  severity: string;
  value?: number;
  threshold?: number;
  message?: string;
};

export type AnomalySummary = {
  total: number;
  critical: number;
  warning: number;
  info: number;
  types: Record<string, number>;
};

export type AnalyticsBucket = {
  timestamp: string;
  avg: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
  count: number | null;
  total?: number | null;
  anomalies?: AnomalyItem[];
};

type Props = {
  series: AnalyticsBucket[];
  unit: string;
  granularity: string;
  selectedMetric: MetricKey;
  mode: "fit" | "wide";
  height: number;
  className?: string;
  startDate?: string;
  endDate?: string;
  /** "data" = x-axis from first to last data point only; "range" = full selected startDate–endDate */
  domainMode?: "data" | "range";
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTickByGranularity(tsMs: number, granularity: string): string {
  const d = new Date(tsMs);
  if (granularity === "hourly") {
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${pad2(d.getUTCHours())}:${pad2(
      d.getUTCMinutes()
    )}`;
  }
  if (granularity === "daily") {
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  }
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

function formatUtcTimestamp(ts: string): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate()
  )} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(
    d.getUTCSeconds()
  )} UTC`;
}

export default function AnalyticsChart({
  series,
  unit,
  granularity,
  selectedMetric,
  mode,
  height,
  className,
  startDate,
  endDate,
  domainMode = "range",
}: Props) {
  const chartData = useMemo(() => {
    const sorted = [...(series ?? [])].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const numericMins = sorted
      .map((r) => r.min)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const baseline = numericMins.length ? Math.min(...numericMins) : 0;
    return sorted.map((row) => {
      const minVal = row.min != null && Number.isFinite(row.min) ? row.min : null;
      const maxVal = row.max != null && Number.isFinite(row.max) ? row.max : null;
      const mid =
        minVal != null && maxVal != null ? (minVal + maxVal) / 2 : null;
      /* Per-point lower edge of the band so the white mask always draws (avoids green extending below min when min is null). */
      const _bandBottom =
        minVal != null ? minVal : (maxVal != null ? maxVal : baseline);
      return {
        ...row,
        timestamp: row.timestamp,
        tsMs: new Date(row.timestamp).getTime(),
        _baseline: baseline,
        _bandBottom,
        _mid: mid,
      };
    });
  }, [series, granularity]);

  const rangeStartMs = useMemo(() => {
    if (!startDate) return null;
    const ms = new Date(`${startDate}T00:00:00.000Z`).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [startDate]);

  const rangeEndMs = useMemo(() => {
    if (!endDate) return null;
    const ms = new Date(`${endDate}T23:59:59.999Z`).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [endDate]);

  const xDomain: [number | "dataMin", number | "dataMax"] = useMemo(() => {
    if (domainMode === "data") return ["dataMin", "dataMax"];
    if (
      rangeStartMs != null &&
      rangeEndMs != null &&
      Number.isFinite(rangeStartMs) &&
      Number.isFinite(rangeEndMs) &&
      rangeEndMs >= rangeStartMs
    ) {
      return [rangeStartMs, rangeEndMs];
    }
    return ["dataMin", "dataMax"];
  }, [domainMode, rangeStartMs, rangeEndMs]);

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
    const ts = formatUtcTimestamp(p.timestamp);
    const isNoDataBucket =
      p.avg == null &&
      p.min == null &&
      p.max == null &&
      p.stdDev == null &&
      p.count == null &&
      p.total == null;
    return (
      <div className={cssStyles.tooltip}>
        <div className={cssStyles.tooltipTime}>{ts}</div>
        {isNoDataBucket ? (
          <div>No data in this bucket</div>
        ) : (
          <>
            <div>
              avg: {p.avg != null ? p.avg.toFixed(2) : "—"}
              {unit}
            </div>
            <div>
              min: {p.min != null ? p.min.toFixed(2) : "—"}
              {unit}
            </div>
            <div>
              max: {p.max != null ? p.max.toFixed(2) : "—"}
              {unit}
            </div>
            <div>
              mid (min–max): {p.min != null && p.max != null ? ((p.min + p.max) / 2).toFixed(2) : "—"}
              {unit}
            </div>
            <div>σ: {p.stdDev != null ? p.stdDev.toFixed(2) : "—"}</div>
            <div>count: {p.count ?? "—"}</div>
          </>
        )}
        {p.total != null && !isNoDataBucket && (
          <div>
            total: {p.total.toFixed(2)}
            {unit}
          </div>
        )}
        {(p as AnalyticsBucket).anomalies && (p as AnalyticsBucket).anomalies!.length > 0 && (
          <div className={cssStyles.tooltipAnomalies}>
            <div className={cssStyles.tooltipAnomaliesTitle}>Anomalies</div>
            {(p as AnalyticsBucket).anomalies!.map((a, i) => (
              <div key={i} className={cssStyles.tooltipAnomalyItem}>
                [{a.severity}] {a.message ?? a.type}
              </div>
            ))}
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
    <ComposedChart
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
        dataKey="tsMs"
        type="number"
        scale="time"
        domain={xDomain}
        tickFormatter={(ts) => formatTickByGranularity(Number(ts), granularity)}
        tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
        stroke={CHART_COLORS.axis}
        axisLine={{ stroke: CHART_COLORS.grid }}
        interval="preserveStartEnd"
        minTickGap={28}
        tickMargin={10}
        label={{
          value: "Timestamp (UTC)",
          position: "insideBottom",
          offset: -8,
          style: { fontSize: 10, fill: CHART_COLORS.axis },
        }}
      />
      <YAxis
        tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
        stroke={CHART_COLORS.axis}
        axisLine={{ stroke: CHART_COLORS.grid }}
        tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)}
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
      <Legend
        content={(props) => {
          const { payload } = props as { payload?: Array<{ value: string; color?: string }> };
          const withBand = [
            { value: "Range (min–max)", color: CHART_COLORS.rangeFill },
            ...(payload ?? []),
          ];
          return (
            <ul className={cssStyles.colorLegend} aria-label="Chart legend">
              {withBand.map((entry, i) => {
                const color = entry.color ?? CHART_COLORS.axis;
                return (
                  <li key={i} className={cssStyles.colorLegendItem}>
                    <span className={cssStyles.colorLegendIcon} style={{ backgroundColor: color }} aria-hidden />
                    <span style={{ color }}>{entry.value}</span>
                  </li>
                );
              })}
            </ul>
          );
        }}
      />
      {/* Band: one ReferenceArea per bucket so fill is strictly between min and max (never below min) */}
      {chartData.map((row, i) => {
        const minY = row.min != null && Number.isFinite(row.min) ? row.min : null;
        const maxY = row.max != null && Number.isFinite(row.max) ? row.max : null;
        if (minY == null || maxY == null || minY >= maxY) return null;
        const x1 = row.tsMs;
        const next = chartData[i + 1];
        const x2 = next ? next.tsMs : x1 + (i > 0 ? row.tsMs - chartData[i - 1].tsMs : 1);
        return (
          <ReferenceArea
            key={`band-${i}-${row.tsMs}`}
            x1={x1}
            x2={x2}
            y1={minY}
            y2={maxY}
            fill={CHART_COLORS.rangeFill}
            isAnimationActive={false}
          />
        );
      })}
      {/* Lines drawn after Areas so they render on top of the band */}
      <Line
        type="monotone"
        dataKey="min"
        stroke={CHART_COLORS.minLine}
        strokeWidth={2.5}
        strokeDasharray="4 3"
        connectNulls={false}
        dot={{ r: 4, fill: CHART_COLORS.minLine, strokeWidth: 0 }}
        activeDot={{ r: 5, fill: CHART_COLORS.minLine, stroke: "#fff", strokeWidth: 2 }}
        name="Min (bottom)"
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="max"
        stroke={CHART_COLORS.maxLine}
        strokeWidth={2.5}
        strokeDasharray="4 3"
        connectNulls={false}
        dot={{ r: 4, fill: CHART_COLORS.maxLine, strokeWidth: 0 }}
        activeDot={{ r: 5, fill: CHART_COLORS.maxLine, stroke: "#fff", strokeWidth: 2 }}
        name="Max (top)"
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="avg"
        stroke={CHART_COLORS.avgLine}
        strokeWidth={4}
        connectNulls={false}
        dot={{ r: 5, fill: CHART_COLORS.avgLine, strokeWidth: 0 }}
        activeDot={{ r: 6, fill: CHART_COLORS.avgLine, stroke: "#fff", strokeWidth: 2 }}
        name="Average"
        isAnimationActive={false}
      />
      {selectedMetric !== "avg" && (
        <Line
          type="monotone"
          dataKey={selectedMetric}
          stroke={CHART_COLORS.metricLine}
          strokeWidth={2.5}
          strokeDasharray="5 4"
          connectNulls={false}
          dot={{ r: 4, fill: CHART_COLORS.metricLine, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: CHART_COLORS.metricLine, stroke: "#fff", strokeWidth: 2 }}
          name={selectedMetric}
          isAnimationActive={false}
        />
      )}
      {/* Anomaly markers: small dots on buckets that have anomalies */}
      {chartData.map((row, i) => {
        const bucket = row as AnalyticsBucket;
        const hasAnomalies = bucket.anomalies && bucket.anomalies.length > 0;
        const yVal = row.avg ?? row.max ?? row.min;
        if (!hasAnomalies || yVal == null || !Number.isFinite(yVal)) return null;
        return (
          <ReferenceDot
            key={`anomaly-${i}-${row.tsMs}`}
            x={row.tsMs}
            y={yVal}
            r={5}
            fill="#B45309"
            stroke="#fff"
            strokeWidth={1.5}
          />
        );
      })}
    </ComposedChart>
  );

  const innerWidth = mode === "wide" ? wideWidth : "100%";

  return (
    <div className={cssStyles.chartBlock}>
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
    </div>
  );
}
