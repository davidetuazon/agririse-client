import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricKey } from "./MetricToggle";
import cssStyles from "./AnalyticsChart.module.css";

/* Range = solid green; min/max lines, average, grid */
const CHART_COLORS = {
  avgLine: "#1D4ED8",
  minLine: "#DC2626",
  maxLine: "#B91C1C",
  grid: "#E2E8F0",
  axis: "#334155",
  metricLine: "#7C3AED",
  /** Single green for min–max range band */
  rangeFill: "rgba(34, 197, 94, 0.35)",
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
  /** When user hovers a metric in the toggle, highlight that line and dim others. */
  hoveredMetric?: MetricKey | null;
  /** Optional bucket timestamp to emphasize (used by "View on chart" from anomalies list). */
  focusedTimestamp?: string | null;
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
  hoveredMetric = null,
  focusedTimestamp = null,
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
    return sorted.map((row) => {
      const minVal = row.min != null && Number.isFinite(row.min) ? row.min : null;
      const maxVal = row.max != null && Number.isFinite(row.max) ? row.max : null;
      const hasValidRange =
        minVal != null && maxVal != null && Number.isFinite(minVal) && Number.isFinite(maxVal) && maxVal > minVal;
      return {
        ...row,
        timestamp: row.timestamp,
        tsMs: new Date(row.timestamp).getTime(),
        _rangeBase: hasValidRange ? minVal : null,
        _rangeSpan: hasValidRange ? maxVal - minVal : null,
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

  /** Y domain from data so the range band stays within chart bounds (no overflow) */
  const yDomain = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of chartData) {
      for (const key of ["min", "max", "avg"] as const) {
        const v = row[key];
        if (typeof v === "number" && Number.isFinite(v)) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
    }
    if (minVal === Infinity) minVal = 0;
    if (maxVal === -Infinity) maxVal = 1;
    if (minVal === maxVal) {
      minVal = minVal - 1;
      maxVal = maxVal + 1;
    }
    const padding = Math.max((maxVal - minVal) * 0.05, 0.5);
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [chartData]);

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
      margin={{ top: 20, right: 20, left: 12, bottom: 28 }}
    >
      <CartesianGrid
        strokeDasharray="4 4"
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
        domain={yDomain}
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
          const entries = (payload ?? []).map((entry) => ({
            ...entry,
            color: entry.value === "Range (min–max)" ? "#22c55e" : entry.color,
          }));
          return (
            <ul className={cssStyles.colorLegend} aria-label="Chart legend">
              {entries.map((entry, i) => {
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
      {/* Continuous min-max range band using stacked areas (single green color). */}
      <Area
        type="monotone"
        dataKey="_rangeBase"
        stackId="range"
        fill="transparent"
        stroke="none"
        connectNulls={false}
        isAnimationActive={false}
      />
      <Area
        type="monotone"
        dataKey="_rangeSpan"
        stackId="range"
        fill={CHART_COLORS.rangeFill}
        stroke="none"
        connectNulls={false}
        isAnimationActive={false}
        name="Range (min–max)"
      />
      {/* Lines drawn after Areas so they render on top of the band. Hover on toggle highlights one. */}
      {(["min", "max", "avg"] as const).map((key) => {
        const isHovered = hoveredMetric === key;
        const isDimmed = hoveredMetric != null && hoveredMetric !== key;
        const opacity = isDimmed ? 0.35 : 1;
        const strokeW = key === "avg" ? 4 : 2.5;
        const stroke = key === "min" ? CHART_COLORS.minLine : key === "max" ? CHART_COLORS.maxLine : CHART_COLORS.avgLine;
        const name = key === "min" ? "Min (bottom)" : key === "max" ? "Max (top)" : "Average";
        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={stroke}
            strokeWidth={isHovered ? strokeW + 1 : strokeW}
            strokeOpacity={opacity}
            strokeDasharray={key === "avg" ? undefined : "4 3"}
            connectNulls={false}
            dot={{ r: key === "avg" ? 5 : 4, fill: stroke, strokeWidth: 0, opacity }}
            activeDot={{ r: key === "avg" ? 6 : 5, fill: stroke, stroke: "#fff", strokeWidth: 2 }}
            name={name}
            isAnimationActive={false}
          />
        );
      })}
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
        const isFocused = focusedTimestamp != null && bucket.timestamp === focusedTimestamp;
        return (
          <ReferenceDot
            key={`anomaly-${i}-${row.tsMs}`}
            x={row.tsMs}
            y={yVal}
            r={isFocused ? 7 : 5}
            fill={isFocused ? "#7C3AED" : "#B45309"}
            stroke="#fff"
            strokeWidth={isFocused ? 2 : 1.5}
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
