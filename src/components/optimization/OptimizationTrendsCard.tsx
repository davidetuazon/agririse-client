import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SelectedSolutionHistoryItem } from "../../services/api";
import cssStyles from "../../pages/Home/Home.module.css";
import colors from "../../constants/colors";
import Text from "../commons/Text";

type Props = {
  history: SelectedSolutionHistoryItem[];
  loading: boolean;
};

const BAR_COLOR_LATEST = "#16A34A";
const BAR_COLOR_PREVIOUS = colors.chartPrevious;

function computeAvgCoverage(item: SelectedSolutionHistoryItem | null): number | null {
  const values =
    item?.solutionSnapshot?.allocationVector
      ?.map((row) => row.coveragePercentage)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? [];
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDateTime(value?: string): { date: string; time: string } {
  if (!value) return { date: "—", time: "—" };
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { date: "—", time: "—" };
  return {
    date: date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

export default function OptimizationTrendsCard({ history, loading }: Props) {
  const scenarioOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    history.forEach((item) => {
      const scenario = item.runSnapshot?.inputSnapshot?.scenario?.trim() || "Unspecified";
      if (!seen.has(scenario)) {
        seen.add(scenario);
        options.push(scenario);
      }
    });
    return options;
  }, [history]);

  const [manualScenario, setManualScenario] = useState<string | null>(null);
  const selectedScenario = useMemo(() => {
    if (!scenarioOptions.length) return "";
    if (manualScenario && scenarioOptions.includes(manualScenario)) return manualScenario;
    return scenarioOptions[0];
  }, [scenarioOptions, manualScenario]);

  const scenarioHistory = useMemo(
    () =>
      history.filter(
        (item) =>
          (item.runSnapshot?.inputSnapshot?.scenario?.trim() || "Unspecified") === selectedScenario
      ),
    [history, selectedScenario]
  );

  const latest = scenarioHistory[0] ?? null;
  const previous = scenarioHistory[1] ?? null;

  const objectiveKeys = useMemo(
    () => Object.keys(latest?.solutionSnapshot?.objectiveValues ?? {}),
    [latest]
  );
  const [manualObjectiveKey, setManualObjectiveKey] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const selectedObjectiveKey = useMemo(() => {
    if (!objectiveKeys.length) return "";
    if (manualObjectiveKey && objectiveKeys.includes(manualObjectiveKey)) {
      return manualObjectiveKey;
    }
    return objectiveKeys[0];
  }, [objectiveKeys, manualObjectiveKey]);

  const selectedObjective = selectedObjectiveKey
    ? latest?.solutionSnapshot?.objectiveValues?.[selectedObjectiveKey]
    : undefined;
  const objectiveUnit = selectedObjective?.unit ? ` (${selectedObjective.unit})` : "";
  const objectiveDirection = selectedObjective?.direction;

  const latestObjectiveValue = normalizeNumber(selectedObjective?.value);
  const previousObjectiveValue = normalizeNumber(
    selectedObjectiveKey
      ? previous?.solutionSnapshot?.objectiveValues?.[selectedObjectiveKey]?.value
      : null
  );
  const objectiveDelta =
    latestObjectiveValue != null && previousObjectiveValue != null
      ? latestObjectiveValue - previousObjectiveValue
      : null;

  const latestCoverage = computeAvgCoverage(latest);
  const previousCoverage = computeAvgCoverage(previous);
  const coverageDelta =
    latestCoverage != null && previousCoverage != null
      ? latestCoverage - previousCoverage
      : null;

  const objectiveDeltaClass =
    objectiveDelta == null
      ? cssStyles.optimizationDeltaNeutral
      : objectiveDirection === "maximize"
        ? objectiveDelta >= 0
          ? cssStyles.optimizationDeltaGood
          : cssStyles.optimizationDeltaBad
        : objectiveDirection === "minimize"
          ? objectiveDelta <= 0
            ? cssStyles.optimizationDeltaGood
            : cssStyles.optimizationDeltaBad
          : cssStyles.optimizationDeltaNeutral;

  const coverageDeltaClass =
    coverageDelta == null
      ? cssStyles.optimizationDeltaNeutral
      : coverageDelta >= 0
        ? cssStyles.optimizationDeltaGood
        : cssStyles.optimizationDeltaBad;

  const chartPoints = useMemo(() => {
    if (!selectedObjectiveKey) return [];
    const candidates = scenarioHistory.slice(0, 2);
    return candidates
      .map((item, index) => {
        const value = normalizeNumber(
          item.solutionSnapshot?.objectiveValues?.[selectedObjectiveKey]?.value
        );
        if (value == null) return null;
        const objectiveValues = item.solutionSnapshot?.objectiveValues ?? {};
        const deficitEntry = Object.entries(objectiveValues).find(([key]) =>
          /deficit/i.test(key)
        );
        const fairnessEntry = Object.entries(objectiveValues).find(([key]) =>
          /fair/i.test(key)
        );
        const deficitValue = normalizeNumber(deficitEntry?.[1]?.value);
        const fairnessValue = normalizeNumber(fairnessEntry?.[1]?.value);

        return {
          key: item._id,
          label: index === 0 ? "Latest" : "Previous",
          value,
          color: index === 0 ? BAR_COLOR_LATEST : BAR_COLOR_PREVIOUS,
          createdAt: item.createdAt,
          dateTime: formatDateTime(item.createdAt),
          chronologicalNumber: index + 1,
          deficitLabel: deficitEntry?.[0] ?? "Deficit",
          deficitValue,
          fairnessLabel: fairnessEntry?.[0] ?? "Fairness",
          fairnessValue,
        };
      })
      .filter((point): point is NonNullable<typeof point> => point != null)
      .reverse();
  }, [scenarioHistory, selectedObjectiveKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const renderChart = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: colors.chartNeutral }}
          axisLine={{ stroke: colors.border }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: colors.chartNeutral }}
          axisLine={{ stroke: colors.border }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as
              | {
                  label: string;
                  value: number;
                  dateTime: { date: string; time: string };
                  chronologicalNumber: number;
                  deficitLabel: string;
                  deficitValue: number | null;
                  fairnessLabel: string;
                  fairnessValue: number | null;
                }
              | undefined;
            if (!active || !point) return null;
            return (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: "0.5rem 0.65rem",
                  fontSize: "0.78rem",
                }}
              >
                <div><strong>{point.label}</strong> (#{point.chronologicalNumber})</div>
                <div>Date: {point.dateTime.date}</div>
                <div>Time: {point.dateTime.time}</div>
                <div>{selectedObjectiveKey}: {point.value.toFixed(2)}</div>
                {point.deficitValue != null && (
                  <div>{point.deficitLabel}: {point.deficitValue.toFixed(2)}</div>
                )}
                {point.fairnessValue != null && (
                  <div>{point.fairnessLabel}: {point.fairnessValue.toFixed(2)}</div>
                )}
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartPoints.map((point) => (
            <Cell key={point.key} fill={point.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return <p className={cssStyles.optimizationMeta}>Loading…</p>;
  }

  if (!latest || !objectiveKeys.length) {
    return (
      <p className={cssStyles.optimizationEmpty}>
        No optimization run selected yet. Run one from Allocations and select a solution to see your latest score here.
      </p>
    );
  }

  const hasChart = chartPoints.length >= 2;
  const hasObjectiveFilter = objectiveKeys.length > 1;
  const hasScenarioFilter = scenarioOptions.length > 1;

  const innerContent = (
    <>
      {(hasObjectiveFilter || hasScenarioFilter) && (
        <>
          <div className={cssStyles.optimizationSelectorRow}>
            {hasObjectiveFilter && (
              <>
                <label htmlFor="optimization-objective-select" className={cssStyles.optimizationSelectorLabel}>
                  Objective
                </label>
                <select
                  id="optimization-objective-select"
                  className={cssStyles.optimizationObjectiveSelect}
                  value={selectedObjectiveKey}
                  onChange={(event) => setManualObjectiveKey(event.target.value)}
                >
                  {objectiveKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </>
            )}
            {hasScenarioFilter && (
              <>
                <label htmlFor="optimization-scenario-select" className={cssStyles.optimizationSelectorLabel}>
                  Scenario
                </label>
                <select
                  id="optimization-scenario-select"
                  className={cssStyles.optimizationObjectiveSelect}
                  value={selectedScenario}
                  onChange={(event) => setManualScenario(event.target.value)}
                >
                  {scenarioOptions.map((scenario) => (
                    <option key={scenario} value={scenario}>
                      {scenario}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <Text variant="caption" style={{ margin: 0, color: "#6B7280" }}>
            {hasObjectiveFilter ? "Objective shows which score metric is being compared. " : ""}
            {hasScenarioFilter
              ? "Scenario lets you choose which season/scenario to compare latest and previous scores."
              : ""}
          </Text>
        </>
      )}

      <div className={cssStyles.optimizationKpiGrid}>
        <div className={cssStyles.optimizationKpiCard}>
          <span className={cssStyles.optimizationKpiLabel}>Latest {selectedObjectiveKey}</span>
          <strong className={cssStyles.optimizationKpiValue}>
            {latestObjectiveValue != null ? latestObjectiveValue.toFixed(2) : "—"}
            {objectiveUnit}
          </strong>
          {objectiveDelta != null && (
            <span className={`${cssStyles.optimizationDeltaPill} ${objectiveDeltaClass}`}>
              {objectiveDelta >= 0 ? "+" : ""}
              {objectiveDelta.toFixed(2)} vs previous
            </span>
          )}
        </div>

        <div className={cssStyles.optimizationKpiCard}>
          <span className={cssStyles.optimizationKpiLabel}>Average coverage</span>
          <strong className={cssStyles.optimizationKpiValue}>
            {latestCoverage != null ? `${latestCoverage.toFixed(1)}%` : "—"}
          </strong>
          {coverageDelta != null && (
            <span className={`${cssStyles.optimizationDeltaPill} ${coverageDeltaClass}`}>
              {coverageDelta >= 0 ? "+" : ""}
              {coverageDelta.toFixed(1)}% vs previous
            </span>
          )}
        </div>
      </div>

      {hasChart ? (
        <div className={cssStyles.optimizationChartWrap}>
          {renderChart(180)}
          <p className={cssStyles.optimizationChartHint}>
            Previous (slate) vs Latest (green)
          </p>
        </div>
      ) : (
        <p className={cssStyles.optimizationMeta}>
          Need at least 2 selected solutions to render the comparison chart.
        </p>
      )}
    </>
  );

  if (hasChart) {
    return (
      <>
        <div
          className={cssStyles.optimizationPreviewCard}
          role="button"
          tabIndex={0}
          onClick={() => setModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setModalOpen(true);
            }
          }}
          aria-label="Open optimization chart"
        >
          <div className={cssStyles.optimizationPreviewHeader}>
            <Text variant="heading" style={{ margin: 0 }}>
              Selected Solution Trend
            </Text>
            <span className={cssStyles.optimizationPreviewHint}>Click to expand</span>
          </div>
          <div className={cssStyles.optimizationPreviewChart}>
            {renderChart(180)}
          </div>
          <p className={cssStyles.optimizationChartHint}>
            Previous (slate) vs Latest (green)
          </p>
        </div>

        {modalOpen && (
          <div
            className={cssStyles.optimizationModalOverlay}
            onClick={() => setModalOpen(false)}
          >
            <div
              className={cssStyles.optimizationModalCard}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="optimization-modal-title"
            >
              <div className={cssStyles.optimizationModalHeader}>
                <h2 id="optimization-modal-title" className={cssStyles.optimizationModalTitle}>
                  Selected Solution Trend
                </h2>
                <button
                  type="button"
                  className={cssStyles.optimizationModalClose}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {(hasObjectiveFilter || hasScenarioFilter) && (
                <>
                  <div className={cssStyles.optimizationSelectorRow}>
                    {hasObjectiveFilter && (
                      <>
                        <label htmlFor="optimization-modal-objective" className={cssStyles.optimizationSelectorLabel}>
                          Objective
                        </label>
                        <select
                          id="optimization-modal-objective"
                          className={cssStyles.optimizationObjectiveSelect}
                          value={selectedObjectiveKey}
                          onChange={(event) => setManualObjectiveKey(event.target.value)}
                        >
                          {objectiveKeys.map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {hasScenarioFilter && (
                      <>
                        <label htmlFor="optimization-modal-scenario" className={cssStyles.optimizationSelectorLabel}>
                          Scenario
                        </label>
                        <select
                          id="optimization-modal-scenario"
                          className={cssStyles.optimizationObjectiveSelect}
                          value={selectedScenario}
                          onChange={(event) => setManualScenario(event.target.value)}
                        >
                          {scenarioOptions.map((scenario) => (
                            <option key={scenario} value={scenario}>
                              {scenario}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  <Text variant="caption" style={{ margin: 0, color: "#6B7280" }}>
                    {hasObjectiveFilter ? "Objective shows which score metric is being compared. " : ""}
                    {hasScenarioFilter
                      ? "Scenario lets you choose which season/scenario to compare latest and previous scores."
                      : ""}
                  </Text>
                </>
              )}
              <div className={cssStyles.optimizationKpiGrid}>
                <div className={cssStyles.optimizationKpiCard}>
                  <span className={cssStyles.optimizationKpiLabel}>Latest {selectedObjectiveKey}</span>
                  <strong className={cssStyles.optimizationKpiValue}>
                    {latestObjectiveValue != null ? latestObjectiveValue.toFixed(2) : "—"}
                    {objectiveUnit}
                  </strong>
                  {objectiveDelta != null && (
                    <span className={`${cssStyles.optimizationDeltaPill} ${objectiveDeltaClass}`}>
                      {objectiveDelta >= 0 ? "+" : ""}
                      {objectiveDelta.toFixed(2)} vs previous
                    </span>
                  )}
                </div>
                <div className={cssStyles.optimizationKpiCard}>
                  <span className={cssStyles.optimizationKpiLabel}>Average coverage</span>
                  <strong className={cssStyles.optimizationKpiValue}>
                    {latestCoverage != null ? `${latestCoverage.toFixed(1)}%` : "—"}
                  </strong>
                  {coverageDelta != null && (
                    <span className={`${cssStyles.optimizationDeltaPill} ${coverageDeltaClass}`}>
                      {coverageDelta >= 0 ? "+" : ""}
                      {coverageDelta.toFixed(1)}% vs previous
                    </span>
                  )}
                </div>
              </div>
              <div className={cssStyles.optimizationModalChartWrap}>
                {renderChart(320)}
              </div>
              <p className={cssStyles.optimizationChartHint}>
                Previous (slate) vs Latest (green)
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <div className={cssStyles.optimizationVizRoot}>{innerContent}</div>;
}
