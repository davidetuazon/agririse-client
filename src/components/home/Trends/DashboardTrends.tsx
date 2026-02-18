import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SENSOR_TYPES } from "../../../utils/constants";
import Text from "../../commons/Text";
import cssStyles from "./DashboardTrends.module.css";

type SensorType = keyof typeof SENSOR_TYPES;

type SensorReading = {
  value?: number;
  unit?: string;
  recordedAt?: string;
  sensorType?: string;
  previousValue?: number | null;
  previousRecordedAt?: string | null;
  delta?: number | null;
  percentChange?: number | null;
  timeDifferenceMinutes?: number | null;
};

type IoTReadings = Record<SensorType, SensorReading>;

type Props = {
  data: IoTReadings | null;
};

const CHART_COLORS = {
  previous: "#64748B",
  latest: "#00684A",
  line: "#0F766E",
  grid: "#CBD5E1",
  axis: "#334155",
  positive: "#15803D",
  negative: "#B91C1C",
  neutral: "#475569",
};

function formatUtc(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

function formatTickDate(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function formatNumber(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function getChangeColor(delta?: number | null): string {
  if (typeof delta !== "number" || !Number.isFinite(delta)) return CHART_COLORS.neutral;
  if (delta > 0) return CHART_COLORS.positive;
  if (delta < 0) return CHART_COLORS.negative;
  return CHART_COLORS.neutral;
}

export default function DashboardTrends({ data }: Props) {
  const sensorEntries = useMemo(
    () =>
      (Object.keys(SENSOR_TYPES) as SensorType[]).map((sensor) => ({
        sensor,
        label: SENSOR_TYPES[sensor].label,
        reading: data?.[sensor],
      })),
    [data]
  );

  const firstWithData = useMemo(
    () =>
      sensorEntries.find(
        (entry) =>
          typeof entry.reading?.value === "number" &&
          typeof entry.reading?.previousValue === "number"
      )?.sensor ?? "damWaterLevel",
    [sensorEntries]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorType>(firstWithData);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const selectedReading = data?.[selectedSensor];
  const selectedUnit = selectedReading?.unit ?? SENSOR_TYPES[selectedSensor].unit;
  const selectedLabel = SENSOR_TYPES[selectedSensor].label;
  const selectedChartData = useMemo(
    () => [
      {
        pointLabel: "1 - Previous",
        label: formatTickDate(selectedReading?.previousRecordedAt),
        timestamp: selectedReading?.previousRecordedAt ?? null,
        value:
          typeof selectedReading?.previousValue === "number"
            ? selectedReading.previousValue
            : null,
        fill: CHART_COLORS.previous,
      },
      {
        pointLabel: "2 - Latest",
        label: formatTickDate(selectedReading?.recordedAt),
        timestamp: selectedReading?.recordedAt ?? null,
        value: typeof selectedReading?.value === "number" ? selectedReading.value : null,
        fill: CHART_COLORS.latest,
      },
    ],
    [selectedReading]
  );

  const previewSensor = firstWithData;
  const previewReading = data?.[previewSensor];
  const previewUnit = previewReading?.unit ?? SENSOR_TYPES[previewSensor].unit;
  const previewChartData = useMemo(
    () => [
      {
        pointLabel: "1 - Previous",
        label: formatTickDate(previewReading?.previousRecordedAt),
        timestamp: previewReading?.previousRecordedAt ?? null,
        value:
          typeof previewReading?.previousValue === "number"
            ? previewReading.previousValue
            : null,
        fill: CHART_COLORS.previous,
      },
      {
        pointLabel: "2 - Latest",
        label: formatTickDate(previewReading?.recordedAt),
        timestamp: previewReading?.recordedAt ?? null,
        value: typeof previewReading?.value === "number" ? previewReading.value : null,
        fill: CHART_COLORS.latest,
      },
    ],
    [previewReading]
  );

  const hasPreviewData =
    typeof previewReading?.value === "number" &&
    typeof previewReading?.previousValue === "number";

  const renderChart = (
    chartData: Array<{
      label: string;
      pointLabel: string;
      timestamp: string | null;
      value: number | null;
      fill: string;
    }>,
    unit: string
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickFormatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}${unit}` : String(v))}
        />
        <Tooltip
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as
              | { pointLabel?: string; timestamp?: string | null }
              | undefined;
            if (!p) return "";
            return `${p.pointLabel ?? ""} - ${formatUtc(p.timestamp ?? null)}`;
          }}
          formatter={(value: unknown) =>
            typeof value === "number" ? `${value.toFixed(2)}${unit}` : "—"
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.line}
          strokeWidth={3}
          dot={(dotProps: any) => {
            const index = dotProps?.index ?? 0;
            const fill = chartData[index]?.fill ?? CHART_COLORS.line;
            return (
              <circle
                cx={dotProps.cx}
                cy={dotProps.cy}
                r={5}
                fill={fill}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 6, stroke: "#FFFFFF", strokeWidth: 2 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div
        className={cssStyles.previewCard}
        role="button"
        tabIndex={0}
        onClick={() => {
          setSelectedSensor(previewSensor);
          setModalOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedSensor(previewSensor);
            setModalOpen(true);
          }
        }}
        aria-label="Open trends modal"
      >
        <div className={cssStyles.previewHeader}>
          <Text variant="heading" style={{ margin: 0 }}>
            Trends
          </Text>
          <span className={cssStyles.previewHint}>Click to expand</span>
        </div>

        <div className={cssStyles.previewMeta}>
          <Text variant="caption" style={{ margin: 0 }}>
            Preview sensor: {SENSOR_TYPES[previewSensor].label}
          </Text>
        </div>

        <div className={cssStyles.previewChart}>
          {hasPreviewData ? (
            renderChart(previewChartData, previewUnit)
          ) : (
            <Text variant="caption">No trend data yet.</Text>
          )}
        </div>

        <div className={cssStyles.previewLegend}>
          <span className={cssStyles.legendItem}>
            <span className={cssStyles.legendDot} style={{ background: CHART_COLORS.previous }} />
            <span style={{ color: CHART_COLORS.previous }}>1 = Previous</span>
          </span>
          <span className={cssStyles.legendItem}>
            <span className={cssStyles.legendDot} style={{ background: CHART_COLORS.latest }} />
            <span style={{ color: CHART_COLORS.latest }}>2 = Latest</span>
          </span>
          <span className={cssStyles.legendItem}>
            <span
              style={{
                color: getChangeColor(previewReading?.delta),
                fontFamily: "Poppins-SemiBold",
              }}
            >
              Change: {formatNumber(previewReading?.delta)}
              {previewUnit}
              {typeof previewReading?.percentChange === "number"
                ? ` (${previewReading.percentChange.toFixed(2)}%)`
                : ""}
            </span>
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className={cssStyles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={cssStyles.modalCard} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={cssStyles.modalHeader}>
              <Text variant="heading" style={{ margin: 0 }}>
                Trends
              </Text>
              <button
                type="button"
                className={cssStyles.modalClose}
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={cssStyles.modalControls}>
              <label className={cssStyles.sensorLabel} htmlFor="trends-sensor-select">
                Sensor:
              </label>
              <select
                id="trends-sensor-select"
                className={cssStyles.sensorSelect}
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value as SensorType)}
              >
                {sensorEntries.map((entry) => (
                  <option key={entry.sensor} value={entry.sensor}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={cssStyles.modalChart}>
              {typeof selectedReading?.value === "number" &&
              typeof selectedReading?.previousValue === "number" ? (
                renderChart(selectedChartData, selectedUnit)
              ) : (
                <Text variant="caption">No trend data for this sensor.</Text>
              )}
            </div>

            <div className={cssStyles.modalDetails}>
              <div className={cssStyles.detailRow}>
                <span className={cssStyles.detailKey} style={{ color: CHART_COLORS.previous }}>
                  1 = Previous
                </span>
                <span className={cssStyles.detailValue}>
                  {formatNumber(selectedReading?.previousValue)}
                  {selectedUnit} at {formatUtc(selectedReading?.previousRecordedAt)}
                </span>
              </div>
              <div className={cssStyles.detailRow}>
                <span className={cssStyles.detailKey} style={{ color: CHART_COLORS.latest }}>
                  2 = Latest
                </span>
                <span className={cssStyles.detailValue}>
                  {formatNumber(selectedReading?.value)}
                  {selectedUnit} at {formatUtc(selectedReading?.recordedAt)}
                </span>
              </div>
              <div className={cssStyles.detailRow}>
                <span
                  className={cssStyles.detailKey}
                  style={{ color: getChangeColor(selectedReading?.delta) }}
                >
                  Change
                </span>
                <span className={cssStyles.detailValue}>
                  {formatNumber(selectedReading?.delta)}
                  {selectedUnit}
                  {typeof selectedReading?.percentChange === "number"
                    ? ` (${selectedReading.percentChange.toFixed(2)}%)`
                    : ""}{" "}
                  in {selectedReading?.timeDifferenceMinutes ?? "—"} min
                </span>
              </div>
              <Text variant="caption" style={{ margin: 0 }}>
                Showing {selectedLabel} comparison between previous and latest readings.
              </Text>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
