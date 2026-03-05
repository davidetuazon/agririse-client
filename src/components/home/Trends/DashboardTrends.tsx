import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import colors from "../../../constants/colors";
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
  previous: colors.primary,
  latest: colors.primaryLight,
  grid: colors.chartGrid,
  axis: colors.chartAxis,
  positive: colors.chartPositive,
  negative: colors.chartAnomaly,
  neutral: colors.chartNeutral,
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

function getMinRangeForUnit(unit: string): number {
  // Define minimum ranges for different unit types to prevent over-zooming
  switch (unit) {
    case '%':
      return 2; // 2% minimum range for percentages
    case '°C':
    case '°F':
      return 2; // 2 degrees minimum range for temperature
    case 'K':
      return 2; // 2 Kelvin minimum range
    case 'mm':
      return 1; // 1mm minimum range for rainfall
    case 'm':
      return 0.001; // 1mm (0.001m) minimum range for rainfall in meters
    case 'in':
      return 0.04; // ~1mm (0.04in) minimum range for rainfall in inches
    case 'g/m³':
      return 0.5; // 0.5 g/m³ minimum range for absolute humidity
    case 'g/kg':
      return 0.2; // 0.2 g/kg minimum range for specific humidity
    case 'MCM':
      return 1; // 1 MCM minimum range for dam volume
    case 'ft':
      return 6; // ~2m (6ft) minimum range for dam depth in feet
    default:
      return 2; // Default 2 unit minimum range
  }
}

function calculateYAxisRange(previousValue: number, currentValue: number, unit: string): [number, number] {
  // Handle invalid values gracefully
  if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue)) {
    const minRange = getMinRangeForUnit(unit);
    return [0, minRange];
  }
  
  const min = Math.min(previousValue, currentValue);
  const max = Math.max(previousValue, currentValue);
  const range = max - min;
  
  // Get minimum range to prevent over-zooming
  const minRange = getMinRangeForUnit(unit);
  const actualRange = Math.max(range, minRange);
  
  // Add padding (15% of actual range)
  const padding = actualRange * 0.15;
  
  const rangeMin = min - padding;
  const rangeMax = max + padding;
  
  // For percentage units, don't go below 0 or above 100
  if (unit === '%') {
    return [Math.max(0, rangeMin), Math.min(100, rangeMax)];
  }
  
  // For other units, don't go below 0 unless both values are negative
  if (min >= 0) {
    return [Math.max(0, rangeMin), rangeMax];
  }
  
  // If we have negative values, allow the range to include them
  return [rangeMin, rangeMax];
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
  const selectedChartData = useMemo(() => {
    const previousValue = typeof selectedReading?.previousValue === "number" ? selectedReading.previousValue : 0;
    const currentValue = typeof selectedReading?.value === "number" ? selectedReading.value : 0;
    
    return [
      {
        name: "Previous",
        label: "Previous",
        timestamp: selectedReading?.previousRecordedAt ?? null,
        value: previousValue,
        fill: CHART_COLORS.previous,
      },
      {
        name: "Latest",
        label: "Latest", 
        timestamp: selectedReading?.recordedAt ?? null,
        value: currentValue,
        fill: CHART_COLORS.latest,
      },
    ];
  }, [selectedReading]);

  const previewSensor = firstWithData;
  const previewReading = data?.[previewSensor];
  const previewUnit = previewReading?.unit ?? SENSOR_TYPES[previewSensor].unit;
  const previewChartData = useMemo(() => {
    const previousValue = typeof previewReading?.previousValue === "number" ? previewReading.previousValue : 0;
    const currentValue = typeof previewReading?.value === "number" ? previewReading.value : 0;
    
    return [
      {
        name: "Previous",
        label: "Previous",
        timestamp: previewReading?.previousRecordedAt ?? null,
        value: previousValue,
        fill: CHART_COLORS.previous,
      },
      {
        name: "Latest",
        label: "Latest",
        timestamp: previewReading?.recordedAt ?? null,
        value: currentValue,
        fill: CHART_COLORS.latest,
      },
    ];
  }, [previewReading]);

  const hasPreviewData =
    typeof previewReading?.value === "number" &&
    typeof previewReading?.previousValue === "number";

  const renderChart = (
    chartData: Array<{
      name: string;
      label: string;
      timestamp: string | null;
      value: number;
      fill: string;
    }>,
    unit: string,
    previousValue: number,
    currentValue: number
  ) => {
    const yAxisRange = calculateYAxisRange(previousValue, currentValue, unit);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
          />
          <YAxis
            domain={yAxisRange}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}${unit}` : String(v))}
          />
          <Tooltip
            labelFormatter={(label, payload) => {
              const p = payload?.[0]?.payload as
                | { name?: string; timestamp?: string | null }
                | undefined;
              if (!p) return "";
              return `${p.name ?? ""} - ${formatUtc(p.timestamp ?? null)}`;
            }}
            formatter={(value: unknown) =>
              typeof value === "number" ? `${value.toFixed(2)}${unit}` : "—"
            }
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            shape={(props: any) => {
              const { fill, ...rest } = props;
              const dataPoint = chartData[props.index];
              return <rect {...rest} fill={dataPoint?.fill || CHART_COLORS.neutral} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

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
        title="Trends – Click to expand"
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
            renderChart(
              previewChartData, 
              previewUnit, 
              previewReading?.previousValue ?? 0, 
              previewReading?.value ?? 0
            )
          ) : (
            <Text variant="caption">No trend data yet.</Text>
          )}
        </div>

        <div className={cssStyles.previewLegend}>
          <span className={cssStyles.legendItem}>
            <span className={cssStyles.legendDot} style={{ background: CHART_COLORS.previous }} />
            <span style={{ color: CHART_COLORS.previous }}>Previous</span>
          </span>
          <span className={cssStyles.legendItem}>
            <span 
              className={cssStyles.legendDot} 
              style={{ background: CHART_COLORS.latest }} 
            />
            <span style={{ color: CHART_COLORS.latest }}>
              Latest
            </span>
          </span>
          <span className={cssStyles.legendItem}>
            <span
              style={{
                color: getChangeColor(previewReading?.value && previewReading?.previousValue 
                  ? previewReading.value - previewReading.previousValue 
                  : previewReading?.delta),
                fontFamily: "Poppins-SemiBold",
              }}
            >
              {(() => {
                const calculatedDelta = previewReading?.value && previewReading?.previousValue 
                  ? previewReading.value - previewReading.previousValue 
                  : previewReading?.delta;
                return `Change: ${calculatedDelta && calculatedDelta > 0 ? "↗" : calculatedDelta && calculatedDelta < 0 ? "↘" : "→"} ${calculatedDelta && calculatedDelta > 0 ? "+" : ""}${formatNumber(calculatedDelta)}${previewUnit}`;
              })()}
              {typeof previewReading?.percentChange === "number"
                ? ` (${previewReading.percentChange >= 0 ? "+" : ""}${previewReading.percentChange.toFixed(2)}%)`
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
                renderChart(
                  selectedChartData, 
                  selectedUnit, 
                  selectedReading.previousValue, 
                  selectedReading.value
                )
              ) : (
                <Text variant="caption">No trend data for this sensor.</Text>
              )}
            </div>

            <div className={cssStyles.modalDetails}>
              <div className={cssStyles.detailRow}>
                <span className={cssStyles.detailKey} style={{ color: CHART_COLORS.previous }}>
                  Previous
                </span>
                <span className={cssStyles.detailValue}>
                  {formatNumber(selectedReading?.previousValue)}
                  {selectedUnit} at {formatUtc(selectedReading?.previousRecordedAt)}
                </span>
              </div>
              <div className={cssStyles.detailRow}>
                <span 
                  className={cssStyles.detailKey} 
                  style={{ color: CHART_COLORS.latest }}
                >
                  Latest
                </span>
                <span className={cssStyles.detailValue}>
                  {formatNumber(selectedReading?.value)}
                  {selectedUnit} at {formatUtc(selectedReading?.recordedAt)}
                </span>
              </div>
              <div className={cssStyles.detailRow}>
                <span
                  className={cssStyles.detailKey}
                  style={{ color: getChangeColor(selectedReading?.value && selectedReading?.previousValue 
                    ? selectedReading.value - selectedReading.previousValue 
                    : selectedReading?.delta) }}
                >
                  Change
                </span>
                <span className={cssStyles.detailValue}>
                  {(() => {
                    const calculatedDelta = selectedReading?.value && selectedReading?.previousValue 
                      ? selectedReading.value - selectedReading.previousValue 
                      : selectedReading?.delta;
                    return `${calculatedDelta && calculatedDelta > 0 ? "↗" : calculatedDelta && calculatedDelta < 0 ? "↘" : "→"} ${calculatedDelta && calculatedDelta > 0 ? "+" : ""}${formatNumber(calculatedDelta)}${selectedUnit}`;
                  })()}
                  {typeof selectedReading?.percentChange === "number"
                    ? ` (${selectedReading.percentChange >= 0 ? "+" : ""}${selectedReading.percentChange.toFixed(2)}%)`
                    : ""}{" "}
                  in {selectedReading?.timeDifferenceMinutes ?? "—"} min
                </span>
              </div>
              <Text variant="caption" style={{ margin: 0 }}>
                Showing {selectedLabel} comparison between previous and latest readings. 
                <span style={{ color: CHART_COLORS.axis }}>
                  {" Previous is dark green and latest is light green."}
                </span>
              </Text>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
