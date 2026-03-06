import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics, getSensorDataBoundsByHistory } from "../../services/api";
import Text from "../../components/commons/Text";
import Section from "../../components/commons/Section";
import PageHeader from "../../components/commons/PageHeader";
import AnalyticsChart from "../../components/analytics/AnalyticsChart";
import type { AnalyticsBucket } from "../../components/analytics/AnalyticsChart";
import AnalyticsMetricCard from "../../components/analytics/AnalyticsMetricCard";
import MetricToggle, { type MetricKey } from "../../components/analytics/MetricToggle";
import ExportPreviewModal from "../../components/export/ExportPreviewModal";
import cssStyles from "./Analytics.module.css";
import { useGenerateImage } from "recharts-to-png";
import { downloadTextFile } from "../../utils/exportCsv";
import { buildAnalyticsPdf } from "../../utils/exportPdf";
import { normalizeAnalyticsSeries } from "../../utils/analyticsBuckets";
import { SENSOR_TYPES } from "../../utils/constants";
import ImportModal from "../../components/import/ImportModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MAX_BUCKETS = 2000;
const PREVIEW_CHART_HEIGHT = 280;
const MODAL_CHART_HEIGHT = 420;

type AnalyticsData = AnalyticsBucket & { timestamp: string };
type AnomalySeverity = "critical" | "warning" | "info" | "unknown";
type TimelineAnomaly = {
  id: string;
  timestamp: string;
  severity: AnomalySeverity;
  type: string;
  message: string;
};
type TimelineAnomalyGroup = {
  timestamp: string;
  label: string;
  total: number;
  counts: Record<AnomalySeverity, number>;
  items: TimelineAnomaly[];
};

/** YYYY-MM-DD -> "M/D/YYYY" for display */
function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

function formatAnomalyTimestamp(ts: string): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function normalizeSeverity(value?: string): AnomalySeverity {
  if (value === "critical" || value === "warning" || value === "info") {
    return value;
  }
  return "unknown";
}

/** Returns human-readable "no data" range(s) when selected range extends beyond actual data. */
function getDataRangeGapMessages(
  data: { timestamp: string }[] | null,
  startDate: string,
  endDate: string
): string[] {
  if (!data || data.length === 0) return [];
  const dates = data.map((r) => new Date(r.timestamp).toISOString().slice(0, 10));
  const first = dates.reduce((a, b) => (a < b ? a : b));
  const last = dates.reduce((a, b) => (a > b ? a : b));
  const messages: string[] = [];
  if (first > startDate || last < endDate) {
    messages.push(`Last data recorded is at ${formatDateLabel(last)}`);
  }
  return messages;
}

type TrendPayload = {
  direction?: string | null;
  slope?: number | null;
  percentChange?: number | null;
  projection?: number | null;
  rSquared?: number | null;
  confidence?: number | string | null;
  dataPoints?: number | null;
  dataCompleteness?: number | null;
  timeSpanDays?: number | null;
};

function TrendOverview({ trend, unit }: { trend: TrendPayload; unit: string }) {
  const hasAny =
    trend.direction != null ||
    trend.slope != null ||
    trend.percentChange != null ||
    trend.projection != null ||
    trend.rSquared != null ||
    trend.confidence != null ||
    trend.dataPoints != null ||
    trend.timeSpanDays != null;
  if (!hasAny) {
    return (
      <Text variant="caption" style={{ margin: 0, color: "#6B7280" }}>
        No trend summary available for this range.
      </Text>
    );
  }
  const dir = typeof trend.direction === "string" ? trend.direction.toLowerCase() : "";
  const directionLabel =
    dir === "up" || dir === "increasing"
      ? "Increasing"
      : dir === "down" || dir === "decreasing"
        ? "Decreasing"
        : dir === "stable"
          ? "Stable"
          : trend.direction ?? "—";
  const directionColorClass =
    dir === "up" || dir === "increasing"
      ? cssStyles.trendDirectionUp
      : dir === "down" || dir === "decreasing"
        ? cssStyles.trendDirectionDown
        : dir === "stable"
          ? cssStyles.trendDirectionStable
          : "";
  const confidenceStr = typeof trend.confidence === "string" ? trend.confidence.toLowerCase() : "";
  const confidenceColorClass =
    confidenceStr === "high"
      ? cssStyles.trendConfidenceHigh
      : confidenceStr === "medium"
        ? cssStyles.trendConfidenceMedium
        : confidenceStr === "low"
          ? cssStyles.trendConfidenceLow
          : "";
  return (
    <div className={cssStyles.trendOverview}>
      <div className={cssStyles.trendRow}>
        <span className={cssStyles.trendLabel}>Direction</span>
        <span className={`${cssStyles.trendValue} ${directionColorClass}`}>{directionLabel}</span>
      </div>
      {trend.percentChange != null && Number.isFinite(trend.percentChange) && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>Percent change</span>
          <span className={cssStyles.trendValue}>
            {trend.percentChange >= 0 ? "+" : ""}
            {trend.percentChange.toFixed(2)}%
          </span>
        </div>
      )}
      {trend.slope != null && Number.isFinite(trend.slope) && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>Slope</span>
          <span className={cssStyles.trendValue}>
            {(trend.slope >= 0 ? "+" : "") + trend.slope.toFixed(4)}
            {unit ? ` ${unit}/bucket` : ""}
          </span>
        </div>
      )}
      {trend.projection != null && Number.isFinite(trend.projection) && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>Projection (next bucket)</span>
          <span className={cssStyles.trendValue}>
            {trend.projection.toFixed(2)}
            {unit}
          </span>
        </div>
      )}
      {trend.rSquared != null && Number.isFinite(trend.rSquared) && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>R²</span>
          <span className={cssStyles.trendValue}>{trend.rSquared.toFixed(4)}</span>
        </div>
      )}
      {trend.confidence != null && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>Confidence</span>
          <span className={`${cssStyles.trendValue} ${confidenceColorClass}`}>
            {typeof trend.confidence === "number" && Number.isFinite(trend.confidence)
              ? `${(trend.confidence * 100).toFixed(1)}%`
              : String(trend.confidence)}
          </span>
        </div>
      )}
      {(trend.dataPoints != null || trend.timeSpanDays != null) && (
        <div className={cssStyles.trendRow}>
          <span className={cssStyles.trendLabel}>Data</span>
          <span className={cssStyles.trendValue}>
            {trend.dataPoints != null ? `${trend.dataPoints} points` : ""}
            {trend.dataPoints != null && trend.timeSpanDays != null ? " · " : ""}
            {trend.timeSpanDays != null ? `${trend.timeSpanDays} days` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function DateRangeInput({
  value,
  min,
  max,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const date = value ? new Date(value + "T12:00:00.000Z") : null;
  const minDate = min ? new Date(min + "T00:00:00.000Z") : undefined;
  const maxDate = max ? new Date(max + "T23:59:59.999Z") : undefined;
  return (
    <DatePicker
      selected={date}
      onChange={(d: Date | null) => onChange(d ? d.toISOString().slice(0, 10) : value)}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="yyyy-MM-dd"
      className={cssStyles.dateInput}
      wrapperClassName={cssStyles.datePickerWrapper}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      placeholderText="Select date"
      ariaLabelledBy={ariaLabel}
      disabled={disabled}
    />
  );
}

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<AnalyticsData[] | null>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [chartFitMode, setChartFitMode] = useState<"fit" | "wide">("fit");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("avg");
  const [hoveredMetric, setHoveredMetric] = useState<MetricKey | null>(null);
  const [focusedAnomalyTimestamp, setFocusedAnomalyTimestamp] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [getExportChartPng, { ref: exportChartRef, isLoading: exportPngLoading }] =
    useGenerateImage<HTMLDivElement>({
      // html2canvas Options typing is strict; we only need a few options.
      options: { backgroundColor: "#FFFFFF", scale: 2 } as any,
      type: "image/png",
    });

  const sensorType = searchParams.get("sensorType") ?? "damWaterLevel";
  const sensorLabel = (SENSOR_TYPES as Record<string, { label: string }>)[sensorType]?.label ?? sensorType;
  const todayIso = new Date().toISOString().split("T")[0];
  const defaultEndDate = "2026-01-16";
  const endDate = searchParams.get("endDate") ?? defaultEndDate;
  const [boundsDateRange, setBoundsDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [boundsLoading, setBoundsLoading] = useState(false);
  const [boundsError, setBoundsError] = useState<string | null>(null);
  const startDate = searchParams.get("startDate") ?? boundsDateRange?.startDate ?? "";
  const effectiveEndDate = endDate || boundsDateRange?.endDate || todayIso;

  // Draft date state — only committed to URL (and triggers fetch) when "Set Dates" is clicked
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const setDateRange = (from: string, to: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("startDate", from);
      if (to) next.set("endDate", to);
      else next.delete("endDate");
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrapBounds = async () => {
      setBoundsLoading(true);
      setBoundsError(null);
      const bounds = await getSensorDataBoundsByHistory(sensorType);
      if (cancelled) return;
      if (bounds?.error || !bounds?.startDate || !bounds?.endDate) {
        setBoundsLoading(false);
        setBoundsError(
          typeof bounds?.error === "string" ? bounds.error : "Could not load date range"
        );
        return;
      }
      setBoundsDateRange({ startDate: bounds.startDate, endDate: bounds.endDate });
      const initialEnd = bounds.endDate || defaultEndDate;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("startDate", bounds.startDate);
        next.set("endDate", initialEnd);
        return next;
      });
      setLocalStartDate(bounds.startDate);
      setLocalEndDate(initialEnd);
      setBoundsError(null);
      setBoundsLoading(false);
    };
    bootstrapBounds();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorType]);

  const fetchAllPages = useCallback(async () => {
    if (!startDate || !effectiveEndDate) return;
    setLoading(true);
    setError(null);
    setData(null);
    setMetaData(null);
    let allSeries: AnalyticsData[] = [];
    let meta: any = null;
    let cursor = "";

    while (true) {
      const res = await getAnalytics({
        sensorType,
        startDate,
        endDate: effectiveEndDate,
        limit: 100,
        cursor,
      });

      if (res.error) {
        setData(null);
        setMetaData(null);
        setError(res.error);
        setLoading(false);
        return;
      }

      const nextSeries = res.series ?? [];
      const rawAnomalies = (res as { anomalies?: { total?: number; critical?: number; warning?: number; info?: number; types?: Record<string, number> } }).anomalies;
      const anomaliesSummary = rawAnomalies
        ? {
            total: Number(rawAnomalies.total) || 0,
            critical: Number(rawAnomalies.critical) || 0,
            warning: Number(rawAnomalies.warning) || 0,
            info: Number(rawAnomalies.info) || 0,
            types: typeof rawAnomalies.types === "object" && rawAnomalies.types != null ? rawAnomalies.types : {},
          }
        : { total: 0, critical: 0, warning: 0, info: 0, types: {} };
      // API may return trend at top level (res.trend) or inside meta (res.meta.trend)
      const trendFromResponse = (res as { trend?: TrendPayload }).trend ?? res.meta?.trend;
      if (trendFromResponse != null) {
        console.log("[Analytics] Trend from API:", trendFromResponse);
      } else {
        console.log("[Analytics] No trend in response. res.trend =", (res as { trend?: unknown }).trend, "res.meta?.trend =", res.meta?.trend);
      }
      meta = {
        ...res.meta,
        trend: trendFromResponse ?? res.meta?.trend,
        anomalies: anomaliesSummary,
      };
      allSeries = [...allSeries, ...nextSeries];

      if (!res.pageInfo?.hasNext || !res.pageInfo?.nextCursor) break;
      if (allSeries.length >= MAX_BUCKETS) break;

      cursor = res.pageInfo.nextCursor;
    }

    allSeries.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setData(allSeries);
    setMetaData(meta);
    console.log("[Analytics] metaData set, trend present:", meta?.trend != null, "trend =", meta?.trend);
    setLoading(false);
  }, [sensorType, startDate, effectiveEndDate]);

  useEffect(() => {
    fetchAllPages();
  }, [fetchAllPages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    if (modalOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Reset draft dates to committed URL dates when sensor type changes
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  const hasData = data && data.length > 0;
  const latest = hasData ? data[data.length - 1] : null;
  const chartSeries = useMemo(
    () =>
      metaData?.granularity
        ? normalizeAnalyticsSeries(data ?? [], startDate, effectiveEndDate, metaData.granularity)
        : data ?? [],
    [data, startDate, effectiveEndDate, metaData?.granularity]
  );
  const { anomalyEntries, anomalyGroups } = useMemo(() => {
    const entries: TimelineAnomaly[] = [];
    const groups: TimelineAnomalyGroup[] = [];

    for (const bucket of data ?? []) {
      const bucketAnomalies = (bucket as AnalyticsBucket & {
        anomalies?: { message?: string; type?: string; severity?: string }[];
      }).anomalies ?? [];
      if (!bucketAnomalies.length) continue;

      const items = bucketAnomalies.map((anomaly, index) => {
        const severity = normalizeSeverity(anomaly.severity);
        const type = anomaly.type ?? "unknown";
        const message = anomaly.message ?? anomaly.type ?? "Unspecified anomaly";
        const item: TimelineAnomaly = {
          id: `${bucket.timestamp}-${index}-${type}-${severity}`,
          timestamp: bucket.timestamp,
          severity,
          type,
          message,
        };
        entries.push(item);
        return item;
      });

      const counts: Record<AnomalySeverity, number> = {
        critical: 0,
        warning: 0,
        info: 0,
        unknown: 0,
      };

      for (const item of items) counts[item.severity] += 1;

      groups.push({
        timestamp: bucket.timestamp,
        label: formatAnomalyTimestamp(bucket.timestamp),
        total: items.length,
        counts,
        items,
      });
    }

    groups.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { anomalyEntries: entries, anomalyGroups: groups };
  }, [data]);

  const anomalySummary = useMemo(() => {
    const raw = (metaData as {
      anomalies?: {
        total?: number;
        critical?: number;
        warning?: number;
        info?: number;
        types?: Record<string, number>;
      };
    } | null)?.anomalies;

    if (raw) {
      return {
        total: Number(raw.total) || 0,
        critical: Number(raw.critical) || 0,
        warning: Number(raw.warning) || 0,
        info: Number(raw.info) || 0,
        types: raw.types ?? {},
      };
    }

    const fallback = {
      total: anomalyEntries.length,
      critical: 0,
      warning: 0,
      info: 0,
      types: {} as Record<string, number>,
    };
    for (const anomaly of anomalyEntries) {
      if (anomaly.severity === "critical") fallback.critical += 1;
      else if (anomaly.severity === "warning") fallback.warning += 1;
      else fallback.info += 1;
      fallback.types[anomaly.type] = (fallback.types[anomaly.type] || 0) + 1;
    }
    return fallback;
  }, [metaData, anomalyEntries]);

  const topAnomalyTypes = useMemo(
    () =>
      Object.entries(anomalySummary.types)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [anomalySummary.types]
  );

  const focusedAnomalyGroup = useMemo(
    () => anomalyGroups.find((group) => group.timestamp === focusedAnomalyTimestamp) ?? null,
    [anomalyGroups, focusedAnomalyTimestamp]
  );

  useEffect(() => {
    if (!focusedAnomalyTimestamp) return;
    const stillExists = anomalyGroups.some(
      (group) => group.timestamp === focusedAnomalyTimestamp
    );
    if (!stillExists) setFocusedAnomalyTimestamp(null);
  }, [anomalyGroups, focusedAnomalyTimestamp]);

  const unit = metaData?.unit ?? "";

  const exportDisabled = loading || Boolean(error) || !hasData || !latest;
  const exportTitle = `Analytics: ${metaData?.sensorType ?? sensorType}`;
  const exportFilenameBase = `analytics_${sensorType}_${startDate}_${effectiveEndDate}`;
  const totalBucketCount = chartSeries.length;
  const dataPointCount = data?.length ?? 0;

  const dataRangeGapMessages = useMemo(
    () => (endDate ? getDataRangeGapMessages(data ?? [], startDate, endDate) : []),
    [data, startDate, endDate]
  );
  const showDataRangeGapPrompt = dataRangeGapMessages.length > 0;

  const handleDownloadAnalyticsJson = () => {
    if (!data || !metaData) return;
    const series = data.map((b) => ({
      timestamp: new Date(b.timestamp).toISOString(),
      total: b.total ?? null,
      avg: b.avg ?? null,
      min: b.min ?? null,
      max: b.max ?? null,
      stdDev: b.stdDev ?? null,
      variance: (b as any).variance ?? null,
      median: (b as any).median ?? null,
      percentile25: (b as any).percentile25 ?? null,
      percentile75: (b as any).percentile75 ?? null,
      count: b.count ?? null,
      anomalies: (b as any).anomalies ?? [],
    }));
    const payload = {
      series,
      trend: (metaData as any).trend ?? {
        direction: null,
        slope: null,
        percentChange: null,
        projection: null,
        rSquared: null,
        confidence: null,
        dataPoints: data.length,
        dataCompleteness: null,
        timeSpanDays: null,
      },
      anomalies: (metaData as any).anomalies ?? {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        types: {},
      },
      meta: {
        dateRange: {
          startDate: new Date(startDate + "T00:00:00.000Z").toISOString(),
          endDate: new Date(effectiveEndDate + "T23:59:59.999Z").toISOString(),
        },
        granularity: metaData.granularity ?? null,
        unit: metaData.unit ?? null,
        sensorType: metaData.sensorType ?? null,
        metric: metaData.metric ?? null,
      },
    };
    downloadTextFile(
      `${exportFilenameBase}.json`,
      "application/json",
      JSON.stringify(payload, null, 2)
    );
  };

  const handleDownloadAnalyticsPdf = async () => {
    if (!latest) return;
    setExportBusy(true);
    try {
      const chartPng = await getExportChartPng();
      const doc = buildAnalyticsPdf({
        title: exportTitle,
        sensorLabel: metaData?.sensorType,
        startDate,
        endDate: effectiveEndDate,
        metric: metaData?.metric,
        granularity: metaData?.granularity,
        unit,
        summary: {
          avg: latest.avg ?? 0,
          min: latest.min ?? 0,
          max: latest.max ?? 0,
          stdDev: latest.stdDev ?? 0,
        },
        chartPngDataUrl: chartPng,
        anomalies: {
          summary: anomalySummary,
          groups: anomalyGroups.map((g) => ({
            timestamp: g.timestamp,
            label: g.label,
            total: g.total,
            counts: g.counts,
            items: g.items.map((item) => ({
              severity: item.severity,
              type: item.type,
              message: item.message,
            })),
          })),
        },
      });
      doc.save(`${exportFilenameBase}.pdf`);
    } finally {
      setExportBusy(false);
    }
  };

  const isDateDirty = localStartDate !== startDate || localEndDate !== endDate;

  const DateRangeControls = ({ extra }: { extra?: React.ReactNode }) => (
    <div className={cssStyles.analyticsMetaData} data-tour="analytics-date-range">
      <div className={cssStyles.dateRangeInline}>
        <span className={cssStyles.metaLabel}>From</span>
        <DateRangeInput
          value={localStartDate}
          max={localEndDate || boundsDateRange?.endDate}
          onChange={setLocalStartDate}
          ariaLabel="Start date"
          disabled={boundsLoading}
        />
      </div>
      <div className={cssStyles.dateRangeInline}>
        <span className={cssStyles.metaLabel}>To</span>
        <DateRangeInput
          value={localEndDate}
          min={localStartDate}
          onChange={setLocalEndDate}
          ariaLabel="End date"
          disabled={boundsLoading}
        />
      </div>
      {boundsLoading && (
        <Text variant="caption" style={{ margin: 0, color: "#6B7280" }}>
          Loading first and last available dates...
        </Text>
      )}
      {!boundsLoading && boundsError && (
        <Text variant="caption" style={{ margin: 0, color: "#B91C1C" }}>
          {boundsError}
        </Text>
      )}
      {extra}
      <button
        type="button"
        onClick={() => setDateRange(localStartDate, localEndDate)}
        disabled={boundsLoading || !localStartDate || !localEndDate}
        className={`${cssStyles.setDatesButton}${isDateDirty ? ` ${cssStyles.setDatesButtonDirty}` : ""}`}
        title={
          boundsLoading
            ? "Loading first and last available dates"
            : isDateDirty
              ? "You have unsaved date changes — click to apply"
              : "Apply current date range"
        }
      >
        Set Dates
      </button>
    </div>
  );

  return (
    <div className={cssStyles.pageScroll}>
      <PageHeader
        title="Analytics:"
        chipValue={sensorLabel}
        subtitle={`Aggregated metrics for ${sensorLabel}`}
        actions={
          <div className={cssStyles.headerActions} data-tour="import-export-actions">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className={cssStyles.exportButton}
              title="Import data for this sensor"
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              disabled={exportDisabled}
              className={cssStyles.exportButton}
              title={exportDisabled ? "Load analytics data first" : "Export"}
            >
              Export
            </button>
          </div>
        }
      />

      <Section data-tour="analytics-content">
        {loading ? (
          <div className={cssStyles.loadingState}>
            <Text variant="subtitle">Loading analytics…</Text>
          </div>
        ) : error ? (
            <div className={cssStyles.errorState}>
            <Text variant="subtitle" style={{ color: "#B91C1C" }}>
              {typeof error === "string" ? error : JSON.stringify(error)}
            </Text>
            <div className={cssStyles.dateRangeBlock}>
              <DateRangeControls />
            </div>
          </div>
        ) : latest ? (
          <div key={latest.timestamp} style={styles.summary}>
            {showDataRangeGapPrompt && (
              <div className={cssStyles.dataRangeGapBanner} role="alert">
                <p className={cssStyles.dataRangeGapText}>
                  {dataRangeGapMessages.join(". ")}. Adjust the date range to see only dates with data.
                </p>
              </div>
            )}
            <div style={{ padding: "0px clamp(0.75rem, 2vw, 1.25rem)" }}>
              <Text variant="title" style={{ margin: 0 }}>
                Aggregated Metrics
              </Text>
            </div>

            <div
              style={styles.cardsContainer}
              className={cssStyles.analyticsCardsContainer}
            >
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="avg"
                  label="Average Value"
                  value={latest.avg ?? undefined}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="min"
                  label="Minimum Value"
                  value={latest.min ?? undefined}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="max"
                  label="Maximum Value"
                  value={latest.max ?? undefined}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="stdDev"
                  label="Variability (σ)"
                  value={latest.stdDev ?? undefined}
                />
              </div>
            </div>

            <div className={cssStyles.dateRangeBlock}>
              <DateRangeControls extra={
                <>
                  <Text variant="subtitle" style={{ margin: 0 }}>
                    <span style={{ color: "#00684A" }}>Metric:&nbsp;</span>
                    {metaData?.metric}
                  </Text>
                  <Text variant="subtitle" style={{ margin: 0 }}>
                    <span style={{ color: "#00684A" }}>Granularity:&nbsp;</span>
                    {metaData?.granularity}
                  </Text>
                </>
              } />
            </div>

            {metaData?.anomalies && (
              <div className={cssStyles.anomaliesSection}>
                <div className={cssStyles.anomaliesHeader}>
                  <Text variant="title" style={{ margin: 0 }}>
                    Anomalies
                  </Text>
                  {focusedAnomalyGroup && (
                    <button
                      type="button"
                      className={cssStyles.anomalyClearFocus}
                      onClick={() => setFocusedAnomalyTimestamp(null)}
                    >
                      Clear chart focus ({focusedAnomalyGroup.label})
                    </button>
                  )}
                </div>
                {anomalySummary.total ? (
                  <>
                    <div className={cssStyles.anomalyOverviewGrid}>
                      <div className={cssStyles.anomalyOverviewCard}>
                        <span className={cssStyles.anomalyOverviewLabel}>Total</span>
                        <span className={cssStyles.anomalyOverviewValue}>
                          {anomalySummary.total}
                        </span>
                      </div>
                      <div className={cssStyles.anomalyOverviewCard}>
                        <span className={cssStyles.anomalyOverviewLabel}>Critical</span>
                        <span className={cssStyles.anomalyOverviewValueCritical}>
                          {anomalySummary.critical}
                        </span>
                      </div>
                      <div className={cssStyles.anomalyOverviewCard}>
                        <span className={cssStyles.anomalyOverviewLabel}>Warning</span>
                        <span className={cssStyles.anomalyOverviewValueWarning}>
                          {anomalySummary.warning}
                        </span>
                      </div>
                      <div className={cssStyles.anomalyOverviewCard}>
                        <span className={cssStyles.anomalyOverviewLabel}>Info</span>
                        <span className={cssStyles.anomalyOverviewValueInfo}>
                          {anomalySummary.info}
                        </span>
                      </div>
                    </div>
                    {topAnomalyTypes.length > 0 && (
                      <div className={cssStyles.anomalyTypesRow}>
                        <span className={cssStyles.anomalyTypesLabel}>Top types:</span>
                        <div className={cssStyles.anomalyTypeChips}>
                          {topAnomalyTypes.map(([type, count]) => (
                            <span key={type} className={cssStyles.anomalyTypeChip}>
                              {type}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={cssStyles.anomalyTimeline}>
                      <Text variant="subtitle" style={{ margin: "0 0 0.5rem 0" }}>
                        Grouped timeline
                      </Text>
                      <ul className={cssStyles.anomalyTimelineList}>
                        {anomalyGroups.map((group) => {
                          const isFocused = focusedAnomalyTimestamp === group.timestamp;
                          return (
                            <li key={group.timestamp} className={cssStyles.anomalyTimelineItem}>
                              <button
                                type="button"
                                onClick={() =>
                                  setFocusedAnomalyTimestamp((current) =>
                                    current === group.timestamp ? null : group.timestamp
                                  )
                                }
                                className={`${cssStyles.anomalyTimelineHeader}${isFocused ? ` ${cssStyles.anomalyTimelineHeaderFocused}` : ""}`}
                              >
                                <span className={cssStyles.anomalyListTime}>
                                  {group.label}
                                </span>
                                <span className={cssStyles.anomalyTimelineTotal}>
                                  {group.total} event{group.total > 1 ? "s" : ""}
                                </span>
                                <span className={cssStyles.anomalySeverityBadges}>
                                  {group.counts.critical > 0 && (
                                    <span className={cssStyles.anomalyBadgeCritical}>
                                      Critical: {group.counts.critical}
                                    </span>
                                  )}
                                  {group.counts.warning > 0 && (
                                    <span className={cssStyles.anomalyBadgeWarning}>
                                      Warning: {group.counts.warning}
                                    </span>
                                  )}
                                  {group.counts.info > 0 && (
                                    <span className={cssStyles.anomalyBadgeInfo}>
                                      Info: {group.counts.info}
                                    </span>
                                  )}
                                </span>
                              </button>
                              <ul className={cssStyles.anomalyListMessages}>
                                {group.items.map((item) => (
                                  <li key={item.id} className={cssStyles.anomalyMessage}>
                                    <span
                                      className={
                                        item.severity === "critical"
                                          ? cssStyles.anomalySeverityCritical
                                          : item.severity === "warning"
                                            ? cssStyles.anomalySeverityWarning
                                            : cssStyles.anomalySeverityInfo
                                      }
                                    >
                                      [{item.severity}]
                                    </span>{" "}
                                    {item.message}
                                  </li>
                                ))}
                              </ul>
                              </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Text variant="caption" style={{ margin: 0, color: "#6B7280" }}>
                    No anomalies detected for this date range.
                  </Text>
                )}
              </div>
            )}
          </div>
        ) : showDataRangeGapPrompt ? (
          <div className={cssStyles.gapOnlyView}>
            <div className={cssStyles.dataRangeGapBanner} role="alert">
              <p className={cssStyles.dataRangeGapText}>
                {dataRangeGapMessages.join(". ")}. Adjust the date range to see only dates with data.
              </p>
            </div>
            <div className={cssStyles.dateRangeBlock}>
              <DateRangeControls />
            </div>
          </div>
        ) : (
          <div className={cssStyles.emptyState}>
            <Text variant="title">No data available for this date range.</Text>
            <div className={cssStyles.dateRangeBlock}>
              <DateRangeControls />
            </div>
          </div>
        )}
      </Section>

      {(latest || loading) && (
      <Section style={styles.chartsSection}>
        <div className={cssStyles.chartSectionHeader}>
          <Text variant="title" style={{ margin: 0 }}>
            Time series chart
          </Text>
          <Text variant="caption" style={{ color: "#6B7280", margin: 0 }}>
            Scroll horizontally if needed · click chart to open full screen
          </Text>
          {metaData?.granularity && (
            <span className={cssStyles.rangeCoverage}>
              <Text variant="caption">
                Selected: {startDate} to {endDate || "Not set"} · Granularity: {metaData.granularity} · Buckets:{" "}
                {totalBucketCount} · Data points: {dataPointCount}
              </Text>
            </span>
          )}
        </div>
        {loading ? (
          <div className={cssStyles.chartLoading}>
            <Text variant="caption">Loading chart…</Text>
          </div>
        ) : hasData && metaData ? (
          <>
            <div className={cssStyles.chartControls}>
              <MetricToggle value={selectedMetric} onChange={setSelectedMetric} onHover={setHoveredMetric} />
              <Text variant="caption" style={{ color: "#6B7280", margin: 0 }}>
                Granularity: {metaData.granularity}
              </Text>
            </div>
            <div
              key={`chart-${startDate}-${effectiveEndDate}`}
              className={cssStyles.chartPreviewWrapper}
              onClick={() => setModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setModalOpen(true);
                }
              }}
              aria-label="Open chart in full screen"
            >
              <AnalyticsChart
                series={data ?? []}
                unit={unit}
                granularity={metaData.granularity}
                selectedMetric={selectedMetric}
                hoveredMetric={hoveredMetric}
                focusedTimestamp={focusedAnomalyTimestamp}
                startDate={startDate}
                endDate={effectiveEndDate}
                domainMode="data"
                mode="wide"
                height={PREVIEW_CHART_HEIGHT}
                className={cssStyles.chartPreview}
              />
              <span className={cssStyles.chartClickHint}>Click to expand</span>
            </div>
          </>
        ) : !loading && !error ? (
          <div className={cssStyles.chartEmpty}>
            <Text variant="caption">No data to chart.</Text>
          </div>
        ) : null}
      </Section>
      )}

      {(latest || loading) && (metaData as any)?.trend != null && (
        <Section>
          <div className={cssStyles.trendSection}>
            <h3 className={cssStyles.trendSectionTitle}>Trend</h3>
            <TrendOverview trend={(metaData as any).trend} unit={unit} />
          </div>
        </Section>
      )}

      {modalOpen && hasData && metaData && (
        <div
          className={cssStyles.modalOverlay}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Chart full screen"
        >
          <div
            className={cssStyles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cssStyles.modalHeader}>
              <div className={cssStyles.modalHeaderText}>
                <span className={cssStyles.modalTitle}>
                  {metaData.sensorType} - Chart
                </span>
                <span className={cssStyles.modalSubtitle}>
                  Date range: {startDate} to {endDate || "Not set"} | Granularity: {metaData.granularity}
                </span>
              </div>
              <div className={cssStyles.modalHeaderActions}>
                <button
                  type="button"
                  className={cssStyles.zoomButton}
                  onClick={() =>
                    setChartFitMode((m) => (m === "fit" ? "wide" : "fit"))
                  }
                  title={chartFitMode === "fit" ? "Show full range (scrollable)" : "Fit to width"}
                  aria-label={chartFitMode === "fit" ? "Show full range" : "Fit to width"}
                >
                  <ZoomIcon fit={chartFitMode === "fit"} />
                </button>
                <button
                  type="button"
                  className={cssStyles.modalClose}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={cssStyles.modalMetricToggle}>
              <MetricToggle value={selectedMetric} onChange={setSelectedMetric} onHover={setHoveredMetric} />
            </div>
            <div key={`modal-chart-${startDate}-${effectiveEndDate}`} className={cssStyles.modalChartWrapper}>
              <AnalyticsChart
                series={data ?? []}
                unit={unit}
                granularity={metaData.granularity}
                selectedMetric={selectedMetric}
                hoveredMetric={hoveredMetric}
                focusedTimestamp={focusedAnomalyTimestamp}
                startDate={startDate}
                endDate={effectiveEndDate}
                domainMode="data"
                mode={chartFitMode}
                height={MODAL_CHART_HEIGHT}
              />
            </div>
          </div>
        </div>
      )}

      <ExportPreviewModal
        open={exportOpen}
        title={`Export – ${exportTitle}`}
        subtitle={`${startDate} → ${endDate || "Not set"} · ${metaData?.granularity ?? "—"}`}
        onClose={() => setExportOpen(false)}
        onDownloadJson={handleDownloadAnalyticsJson}
        onDownloadPdf={handleDownloadAnalyticsPdf}
        busy={exportBusy || exportPngLoading}
      >
        <div className={cssStyles.exportPreviewMeta}>
          <div><strong>Sensor</strong>: {metaData?.sensorType ?? "—"}</div>
          <div><strong>Metric</strong>: {metaData?.metric ?? "—"}</div>
          <div><strong>Granularity</strong>: {metaData?.granularity ?? "—"}</div>
          <div><strong>Unit</strong>: {unit || "—"}</div>
          <div><strong>Buckets</strong>: {data?.length ?? 0}</div>
        </div>

        {latest && (
          <div className={cssStyles.exportPreviewCards}>
            <AnalyticsMetricCard type="avg" label="Average Value" value={latest.avg ?? undefined} unit={unit} />
            <AnalyticsMetricCard type="min" label="Minimum Value" value={latest.min ?? undefined} unit={unit} />
            <AnalyticsMetricCard type="max" label="Maximum Value" value={latest.max ?? undefined} unit={unit} />
            <AnalyticsMetricCard type="stdDev" label="Variability (σ)" value={latest.stdDev ?? undefined} />
          </div>
        )}

        {anomalySummary.total > 0 && (
          <div className={cssStyles.anomaliesSection}>
            <div className={cssStyles.anomaliesHeader}>
              <Text variant="title" style={{ margin: 0 }}>
                Anomalies
              </Text>
            </div>
            <div className={cssStyles.anomalyOverviewGrid}>
              <div className={cssStyles.anomalyOverviewCard}>
                <span className={cssStyles.anomalyOverviewLabel}>Total</span>
                <span className={cssStyles.anomalyOverviewValue}>{anomalySummary.total}</span>
              </div>
              <div className={cssStyles.anomalyOverviewCard}>
                <span className={cssStyles.anomalyOverviewLabel}>Critical</span>
                <span className={cssStyles.anomalyOverviewValueCritical}>{anomalySummary.critical}</span>
              </div>
              <div className={cssStyles.anomalyOverviewCard}>
                <span className={cssStyles.anomalyOverviewLabel}>Warning</span>
                <span className={cssStyles.anomalyOverviewValueWarning}>{anomalySummary.warning}</span>
              </div>
              <div className={cssStyles.anomalyOverviewCard}>
                <span className={cssStyles.anomalyOverviewLabel}>Info</span>
                <span className={cssStyles.anomalyOverviewValueInfo}>{anomalySummary.info}</span>
              </div>
            </div>
            {topAnomalyTypes.length > 0 && (
              <div className={cssStyles.anomalyTypesRow}>
                <span className={cssStyles.anomalyTypesLabel}>Top types:</span>
                <div className={cssStyles.anomalyTypeChips}>
                  {topAnomalyTypes.map(([type, count]) => (
                    <span key={type} className={cssStyles.anomalyTypeChip}>
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={cssStyles.anomalyTimeline}>
              <Text variant="subtitle" style={{ margin: "0 0 0.5rem 0" }}>
                Grouped timeline
              </Text>
              <ul className={cssStyles.anomalyTimelineList}>
                {anomalyGroups.map((group) => (
                  <li key={group.timestamp} className={cssStyles.anomalyTimelineItem}>
                    <div className={cssStyles.anomalyTimelineHeader}>
                      <span className={cssStyles.anomalyListTime}>{group.label}</span>
                      <span className={cssStyles.anomalyTimelineTotal}>
                        {group.total} event{group.total > 1 ? "s" : ""}
                      </span>
                      <span className={cssStyles.anomalySeverityBadges}>
                        {group.counts.critical > 0 && (
                          <span className={cssStyles.anomalyBadgeCritical}>
                            Critical: {group.counts.critical}
                          </span>
                        )}
                        {group.counts.warning > 0 && (
                          <span className={cssStyles.anomalyBadgeWarning}>
                            Warning: {group.counts.warning}
                          </span>
                        )}
                        {group.counts.info > 0 && (
                          <span className={cssStyles.anomalyBadgeInfo}>
                            Info: {group.counts.info}
                          </span>
                        )}
                      </span>
                    </div>
                    <ul className={cssStyles.anomalyListMessages}>
                      {group.items.map((item) => (
                        <li key={item.id} className={cssStyles.anomalyMessage}>
                          <span
                            className={
                              item.severity === "critical"
                                ? cssStyles.anomalySeverityCritical
                                : item.severity === "warning"
                                  ? cssStyles.anomalySeverityWarning
                                  : cssStyles.anomalySeverityInfo
                            }
                          >
                            [{item.severity}]
                          </span>{" "}
                          {item.message}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div ref={exportChartRef} className={cssStyles.exportPreviewChart}>
          {hasData && metaData ? (
            <AnalyticsChart
              key={`export-chart-${startDate}-${effectiveEndDate}`}
              series={data ?? []}
              unit={unit}
              granularity={metaData.granularity}
              selectedMetric={selectedMetric}
              startDate={startDate}
              endDate={effectiveEndDate}
              domainMode="data"
              mode="fit"
              height={320}
            />
          ) : (
            <Text variant="caption">No chart available.</Text>
          )}
        </div>
      </ExportPreviewModal>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        sensorType={sensorType}
        sensorLabel={(SENSOR_TYPES as Record<string, { label: string }>)[sensorType]?.label ?? sensorType}
      />
    </div>
  );
}

function ZoomIcon({ fit }: { fit: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {fit ? (
        <>
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="M21 3l-7 7" />
          <path d="M3 21l7-7" />
        </>
      ) : (
        <>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </>
      )}
    </svg>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  summary: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(0.75rem, 2vw, 1.25rem)",
    width: "100%",
    minWidth: 0,
  },
  cardsContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    height: "fit-content",
    gap: "clamp(0.75rem, 2vw, 1.25rem)",
    padding: "0px clamp(0.75rem, 2vw, 1.25rem)",
    width: "100%",
    boxSizing: "border-box",
  },
  chartsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(0.75rem, 2vw, 1.25rem)",
    flex: 1,
    width: "100%",
    minWidth: 0,
  },
};
