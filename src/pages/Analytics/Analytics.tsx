import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../../services/api";
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
import { toCsv, downloadTextFile } from "../../utils/exportCsv";
import { buildAnalyticsPdf } from "../../utils/exportPdf";

const MAX_BUCKETS = 2000;
const PREVIEW_CHART_HEIGHT = 280;
const MODAL_CHART_HEIGHT = 420;

type AnalyticsData = AnalyticsBucket & { timestamp: string };

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<AnalyticsData[] | null>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [chartFitMode, setChartFitMode] = useState<"fit" | "wide">("fit");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("avg");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [getExportChartPng, { ref: exportChartRef, isLoading: exportPngLoading }] =
    useGenerateImage<HTMLDivElement>({
      // html2canvas Options typing is strict; we only need a few options.
      options: { backgroundColor: "#FFFFFF", scale: 2 } as any,
      type: "image/png",
    });

  const sensorType = searchParams.get("sensorType") ?? "damWaterLevel";
  const endDate =
    searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
  const startDate =
    searchParams.get("startDate") ??
    new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  const setDateRange = (from: string, to: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("startDate", from);
      next.set("endDate", to);
      return next;
    });
  };

  const fetchAllPages = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    let allSeries: AnalyticsData[] = [];
    let meta: any = null;
    let cursor = "";

    while (true) {
      const res = await getAnalytics({
        sensorType,
        startDate,
        endDate,
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
      meta = res.meta;
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
    setLoading(false);
  }, [sensorType, startDate, endDate]);

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

  const hasData = data && data.length > 0;
  const latest = hasData ? data[data.length - 1] : null;

  const unit = metaData?.unit ?? "";

  const exportDisabled = loading || Boolean(error) || !hasData || !latest;
  const exportTitle = `Analytics: ${metaData?.sensorType ?? sensorType}`;
  const exportFilenameBase = `analytics_${sensorType}_${startDate}_${endDate}`;

  const handleDownloadAnalyticsCsv = async () => {
    if (!data || !data.length) return;
    const csv = toCsv(data as any, [
      "timestamp",
      "total",
      "avg",
      "min",
      "max",
      "stdDev",
      "count",
    ]);
    downloadTextFile(`${exportFilenameBase}.csv`, "text/csv", csv);
  };

  const handleDownloadAnalyticsPdf = async () => {
    if (!latest) return;
    setExportBusy(true);
    try {
      const chartPng = await getExportChartPng();
      const doc = buildAnalyticsPdf({
        title: exportTitle,
        startDate,
        endDate,
        metric: metaData?.metric,
        granularity: metaData?.granularity,
        unit,
        summary: {
          avg: latest.avg,
          min: latest.min,
          max: latest.max,
          stdDev: latest.stdDev,
        },
        chartPngDataUrl: chartPng,
      });
      doc.save(`${exportFilenameBase}.pdf`);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Analytics:"
        chipValue={metaData?.sensorType}
        subtitle={
          metaData?.sensorType
            ? `Aggregated metrics for ${metaData?.sensorType}`
            : undefined
        }
        actions={
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={exportDisabled}
            className={cssStyles.exportButton}
            title={exportDisabled ? "Load analytics data first" : "Export"}
          >
            Export
          </button>
        }
      />

      <Section>
        {loading ? (
          <div className={cssStyles.loadingState}>
            <Text variant="subtitle">Loading analytics…</Text>
          </div>
        ) : error ? (
          <div className={cssStyles.errorState}>
            <Text variant="subtitle" style={{ color: "#B91C1C" }}>
              {typeof error === "string" ? error : JSON.stringify(error)}
            </Text>
          </div>
        ) : latest ? (
          <div key={latest.timestamp} style={styles.summary}>
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
                  value={latest.avg}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="min"
                  label="Minimum Value"
                  value={latest.min}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="max"
                  label="Maximum Value"
                  value={latest.max}
                  unit={unit}
                />
              </div>
              <div className={cssStyles.analyticsCard}>
                <AnalyticsMetricCard
                  type="stdDev"
                  label="Variability (σ)"
                  value={latest.stdDev}
                />
              </div>
            </div>

            <div className={cssStyles.analyticsMetaData}>
              <div className={cssStyles.dateRangeInline}>
                <span className={cssStyles.metaLabel}>From</span>
                <input
                  type="date"
                  className={cssStyles.dateInput}
                  value={startDate}
                  onChange={(e) => setDateRange(e.target.value, endDate)}
                  max={endDate}
                />
              </div>
              <div className={cssStyles.dateRangeInline}>
                <span className={cssStyles.metaLabel}>To</span>
                <input
                  type="date"
                  className={cssStyles.dateInput}
                  value={endDate}
                  onChange={(e) => setDateRange(startDate, e.target.value)}
                  min={startDate}
                />
              </div>
              <Text variant="subtitle" style={{ margin: 0 }}>
                <span style={{ color: "#00684A" }}>Metric:&nbsp;</span>
                {metaData?.metric}
              </Text>
              <Text variant="subtitle" style={{ margin: 0 }}>
                <span style={{ color: "#00684A" }}>Granularity:&nbsp;</span>
                {metaData?.granularity}
              </Text>
            </div>
          </div>
        ) : (
          <div className={cssStyles.emptyState}>
            <Text variant="title">No data available.</Text>
            <div className={cssStyles.analyticsMetaData}>
              <div className={cssStyles.dateRangeInline}>
                <span className={cssStyles.metaLabel}>From</span>
                <input
                  type="date"
                  className={cssStyles.dateInput}
                  value={startDate}
                  onChange={(e) => setDateRange(e.target.value, endDate)}
                  max={endDate}
                />
              </div>
              <div className={cssStyles.dateRangeInline}>
                <span className={cssStyles.metaLabel}>To</span>
                <input
                  type="date"
                  className={cssStyles.dateInput}
                  value={endDate}
                  onChange={(e) => setDateRange(startDate, e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section style={styles.chartsSection}>
        <div className={cssStyles.chartSectionHeader}>
          <Text variant="title" style={{ margin: 0 }}>
            Time series chart
          </Text>
          <Text variant="caption" style={{ color: "#6B7280", margin: 0 }}>
            Scroll horizontally if needed · click chart to open full screen
          </Text>
        </div>
        {loading ? (
          <div className={cssStyles.chartLoading}>
            <Text variant="caption">Loading chart…</Text>
          </div>
        ) : hasData && metaData ? (
          <>
            <div className={cssStyles.chartControls}>
              <MetricToggle value={selectedMetric} onChange={setSelectedMetric} />
              <Text variant="caption" style={{ color: "#6B7280", margin: 0 }}>
                Granularity: {metaData.granularity}
              </Text>
            </div>
            <div
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
                series={data}
                unit={unit}
                granularity={metaData.granularity}
                selectedMetric={selectedMetric}
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
              <span className={cssStyles.modalTitle}>
                {metaData.sensorType} – Chart
              </span>
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
              <MetricToggle value={selectedMetric} onChange={setSelectedMetric} />
            </div>
            <div className={cssStyles.modalChartWrapper}>
              <AnalyticsChart
                series={data}
                unit={unit}
                granularity={metaData.granularity}
                selectedMetric={selectedMetric}
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
        subtitle={`${startDate} → ${endDate} · ${metaData?.granularity ?? "—"}`}
        onClose={() => setExportOpen(false)}
        onDownloadCsv={handleDownloadAnalyticsCsv}
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
            <AnalyticsMetricCard type="avg" label="Average Value" value={latest.avg} unit={unit} />
            <AnalyticsMetricCard type="min" label="Minimum Value" value={latest.min} unit={unit} />
            <AnalyticsMetricCard type="max" label="Maximum Value" value={latest.max} unit={unit} />
            <AnalyticsMetricCard type="stdDev" label="Variability (σ)" value={latest.stdDev} />
          </div>
        )}

        <div ref={exportChartRef} className={cssStyles.exportPreviewChart}>
          {hasData && metaData ? (
            <AnalyticsChart
              series={data}
              unit={unit}
              granularity={metaData.granularity}
              selectedMetric={selectedMetric}
              mode="fit"
              height={320}
            />
          ) : (
            <Text variant="caption">No chart available.</Text>
          )}
        </div>
      </ExportPreviewModal>
    </>
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
