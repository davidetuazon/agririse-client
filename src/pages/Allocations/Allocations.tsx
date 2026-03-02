import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import PageHeader from "../../components/commons/PageHeader";
import Button from "../../components/commons/Button";
import FairnessDeficitScatter from "../../components/optimization/FairnessDeficitScatter";
import {
    getSelectedSolutionsHistory,
    selectOptimizationSolution,
    type ParetoSolution,
    type SelectedSolutionHistoryItem,
} from "../../services/api";
import { useAllocationRun } from "../../providers/AllocationRunProvider";
import colors from "../../constants/colors";
import cssStyles from "./Allocations.module.css";

type RunFormInputs = {
    totalSeasonalWaterSupplyM3: string;
    scenario: "dry season" | "wet season";
};

type ObjectiveLikeMap =
    | Record<string, { value?: unknown; unit?: string } | undefined>
    | undefined;

function extractObjectiveMetric(objectiveValues: ObjectiveLikeMap, matcher: RegExp) {
    const entry = Object.entries(objectiveValues ?? {}).find(([key]) => matcher.test(key));
    const value = entry?.[1]?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return {
        label: entry?.[0] ?? "",
        value,
        unit: entry?.[1]?.unit ?? "",
    };
}

function formatNumber(value: unknown, maximumFractionDigits = 2): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    });
}

function formatObjectiveValue(value: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) return formatNumber(value, 2);
    return value == null ? "—" : String(value);
}

function prettifyName(value?: string | null): string {
    if (!value) return "—";
    return value.replace(/_/g, " ").trim();
}

export default function Allocations() {
    const { currentRun, runResults, setRunResults, setCurrentRun, startRun } = useAllocationRun();
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [viewingSolution, setViewingSolution] = useState<ParetoSolution | null>(null);
    const [viewMode, setViewMode] = useState<"optimize" | "history">("optimize");
    const [selectedHistory, setSelectedHistory] = useState<SelectedSolutionHistoryItem[]>([]);
    const [viewingHistorySolution, setViewingHistorySolution] = useState<SelectedSolutionHistoryItem | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [scenarioFilter, setScenarioFilter] = useState<"" | "dry season" | "wet season">("");
    const [showSolutions, setShowSolutions] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const completionNotifiedRunRef = useRef<string | null>(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RunFormInputs>({
        defaultValues: { totalSeasonalWaterSupplyM3: "", scenario: "dry season" },
    });

    const onSubmit: SubmitHandler<RunFormInputs> = async (data) => {
        const total = parseFloat(data.totalSeasonalWaterSupplyM3);
        if (Number.isNaN(total) || total <= 0) return;
        // Clear previous run and results immediately so they disappear before the new run starts
        setRunResults(null);
        setShowSolutions(false);
        setShowCompletionModal(false);
        completionNotifiedRunRef.current = null;
        try {
            await startRun({
                totalSeasonalWaterSupplyM3: total,
                scenario: data.scenario,
            });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } }; status?: number };
            const msg = err?.response?.data?.error ?? "Failed to start optimization";
            toast.error(msg);
        }
    };

    const handleSelectSolution = async (runId: string, solutionId: string) => {
        setSelectingId(solutionId);
        try {
            await selectOptimizationSolution(runId, solutionId);
            toast.success("Solution selected and saved.");
            setViewingSolution(null);
            setRunResults(null);
            setCurrentRun(null);
            setShowSolutions(false);
            setShowCompletionModal(false);
            completionNotifiedRunRef.current = null;
            reset({ totalSeasonalWaterSupplyM3: "", scenario: "dry season" });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } }; status?: number };
            const msg = err?.response?.data?.error ?? "Failed to save selection";
            toast.error(msg);
        } finally {
            setSelectingId(null);
        }
    };

    const loadSelectedHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);

        try {
            const params = scenarioFilter ? { scenario: scenarioFilter } : undefined;
            const data = await getSelectedSolutionsHistory(params);
            setSelectedHistory(data ?? []);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } }; message?: string };
            setHistoryError(
                err?.response?.data?.error ??
                    err?.message ??
                    "Failed to load selected solution history."
            );
            setSelectedHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, [scenarioFilter]);

    useEffect(() => {
        if (viewMode !== "history") return;
        loadSelectedHistory();
    }, [viewMode, loadSelectedHistory]);

    useEffect(() => {
        if (!runResults || runResults.optimizationRun.status !== "completed") return;
        const completedRunId = runResults.optimizationRun._id;
        if (completionNotifiedRunRef.current === completedRunId) return;

        completionNotifiedRunRef.current = completedRunId;
        setShowCompletionModal(true);
        setShowSolutions(false);
    }, [runResults]);

    const statusClass =
        currentRun?.status === "completed"
            ? cssStyles.statusCompleted
            : currentRun?.status === "failed"
              ? cssStyles.statusFailed
              : cssStyles.statusPending;

    const statusLabel =
        currentRun?.status === "completed"
            ? "Completed"
            : currentRun?.status === "failed"
              ? "Failed"
              : currentRun?.status === "pending"
                ? "Pending"
                : "Not started";

    return (
        <div className={cssStyles.page}>
            <PageHeader
                title="Allocations"
                subtitle="Configure and run GA optimization, then verify and select a solution."
            />

            <section className={cssStyles.viewSwitchRow} data-tour="allocations-switch">
                <button
                    type="button"
                    className={`${cssStyles.switchBtn} ${viewMode === "optimize" ? cssStyles.switchBtnActive : ""}`}
                    onClick={() => setViewMode("optimize")}
                >
                    Optimization
                </button>
                <button
                    type="button"
                    className={`${cssStyles.switchBtn} ${viewMode === "history" ? cssStyles.switchBtnActive : ""}`}
                    onClick={() => setViewMode("history")}
                >
                    History
                </button>
            </section>

            {viewMode === "optimize" && (
                <>
            <section className={cssStyles.workflowGrid}>
                <article className={cssStyles.formSection} data-tour="allocations-form">
                    <h2 className={cssStyles.formSectionTitle}>1) Configure optimization run</h2>
                    <p className={cssStyles.formSubtext}>
                        Set your seasonal water supply and scenario, then start a fresh run.
                    </p>
                    <form
                        className={cssStyles.form}
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                    >
                        <div className={cssStyles.formRow}>
                            <div className={cssStyles.field}>
                                <label className={cssStyles.label} htmlFor="totalSeasonalWaterSupplyM3">
                                    Total seasonal water supply (m³)
                                </label>
                                <input
                                    id="totalSeasonalWaterSupplyM3"
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    placeholder="e.g. 50000"
                                    className={`${cssStyles.input} ${errors.totalSeasonalWaterSupplyM3 ? cssStyles.inputError : ""}`}
                                    {...register("totalSeasonalWaterSupplyM3", {
                                        required: "Required",
                                        min: {
                                            value: 0.01,
                                            message: "Must be greater than 0",
                                        },
                                        setValueAs: (v) => (v === "" ? "" : v),
                                    })}
                                />
                                {errors.totalSeasonalWaterSupplyM3 && (
                                    <span className={cssStyles.errorText}>
                                        {errors.totalSeasonalWaterSupplyM3.message}
                                    </span>
                                )}
                            </div>
                            <div className={cssStyles.field}>
                                <label className={cssStyles.label} htmlFor="scenario">
                                    Scenario
                                </label>
                                <select
                                    id="scenario"
                                    className={cssStyles.select}
                                    {...register("scenario", { required: true })}
                                >
                                    <option value="dry season">Dry season</option>
                                    <option value="wet season">Wet season</option>
                                </select>
                            </div>
                        </div>
                        <div className={cssStyles.formActions}>
                            <Button
                                type="submit"
                                title={isSubmitting ? "Starting…" : "Run optimization"}
                                disabled={isSubmitting}
                                onButtonPress={() => {}}
                                style={{
                                    margin: 0,
                                    backgroundColor: colors.primaryAction,
                                    color: colors.primaryActionText,
                                    padding: "0.875rem 1.5rem",
                                    borderRadius: "12px",
                                    boxShadow: "0 3px 10px rgba(167, 74, 27, 0.35)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                titleStyle={{ color: colors.primaryActionText, fontSize: "0.9375rem", textAlign: "center" }}
                            />
                        </div>
                    </form>
                </article>

                <article className={cssStyles.runSection} data-tour="allocations-run">
                    <h2 className={cssStyles.formSectionTitle}>2) Run monitor</h2>
                    <div className={cssStyles.runSummary}>
                        <span className={`${cssStyles.statusBadge} ${statusClass}`}>
                            {currentRun?.status === "pending" && (
                                <>
                                    <span className={cssStyles.spinner} aria-hidden />
                                    Pending
                                </>
                            )}
                            {currentRun?.status === "completed" && "Completed"}
                            {currentRun?.status === "failed" && "Failed"}
                            {!currentRun && "Not started"}
                        </span>
                        <p className={cssStyles.runMeta}>
                            {currentRun
                                ? `Run ID: ${currentRun._id}`
                                : "No active run yet. Start from the form on the left."}
                        </p>
                    </div>
                    <div className={cssStyles.runStats}>
                        <div className={cssStyles.runStatCard}>
                            <span className={cssStyles.runStatLabel}>Status</span>
                            <strong className={cssStyles.runStatValue}>{statusLabel}</strong>
                        </div>
                        <div className={cssStyles.runStatCard}>
                            <span className={cssStyles.runStatLabel}>Scenario</span>
                            <strong className={cssStyles.runStatValue}>
                                {currentRun?.inputSnapshot?.scenario ?? "—"}
                            </strong>
                        </div>
                        <div className={cssStyles.runStatCard}>
                            <span className={cssStyles.runStatLabel}>Supply</span>
                            <strong className={cssStyles.runStatValue}>
                                {currentRun?.inputSnapshot?.totalSeasonalWaterSupplyM3 != null
                                    ? `${currentRun.inputSnapshot.totalSeasonalWaterSupplyM3} m³`
                                    : "—"}
                            </strong>
                        </div>
                    </div>

                    {currentRun?.status === "pending" && (
                        <div className={cssStyles.parametersPanel}>
                            <h4 className={cssStyles.parametersTitle}>Optimization is currently running</h4>
                            <p className={cssStyles.message}>
                                Use the global loader to view detailed variables (including
                                each lateral/barangay with TBS by Dam, net demand, seepage,
                                and loss factor). You can minimize that loader and continue
                                working anywhere in the app.
                            </p>
                        </div>
                    )}

                    {currentRun?.status === "failed" && (
                        <p className={cssStyles.message}>
                            This run failed. Start a new run to try again.
                        </p>
                    )}

                    {currentRun?.status === "completed" &&
                        runResults?.paretoSolutions?.length &&
                        !showSolutions && (
                            <div className={cssStyles.formActions}>
                                <button
                                    type="button"
                                    className={cssStyles.historyViewBtn}
                                    onClick={() => setShowSolutions(true)}
                                >
                                    View completed solutions
                                </button>
                            </div>
                        )}
                </article>
            </section>

            {runResults && runResults.paretoSolutions.length > 0 && showSolutions && (
                <section className={cssStyles.resultsSection}>
                    <div className={cssStyles.resultsHeader}>
                        <h3 className={cssStyles.solutionsHeading}>3) Review Pareto solutions</h3>
                        <span className={cssStyles.resultsCount}>
                            {runResults.paretoSolutions.length} solution
                            {runResults.paretoSolutions.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className={cssStyles.resultsParetoWrap}>
                        <p className={cssStyles.previewObjectivesTitle} style={{ marginBottom: "0.5rem" }}>
                            Pareto position (fairness vs deficit)
                        </p>
                        <div className={cssStyles.previewScatterWrap}>
                            <FairnessDeficitScatter
                                solutions={runResults.paretoSolutions}
                                height={220}
                                variant="full"
                            />
                        </div>
                    </div>
                    <div className={cssStyles.solutionsGrid}>
                        {runResults.paretoSolutions.map((sol, idx) => {
                            const coverageValues = (sol.allocationVector ?? [])
                                .map((a) => a.coveragePercentage)
                                .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
                            const avgCoverage =
                                coverageValues.length > 0
                                    ? coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length
                                    : null;
                            const deficitMetric = extractObjectiveMetric(sol.objectiveValues, /deficit/i);
                            const fairnessMetric = extractObjectiveMetric(sol.objectiveValues, /fair/i);

                            return (
                                <div key={sol._id ?? idx} className={cssStyles.solutionCard}>
                                    <div className={cssStyles.solutionCardHeader}>
                                        <span className={cssStyles.solutionCardTitle}>
                                            Solution {idx + 1}
                                        </span>
                                        <Button
                                            title="View this solution"
                                            disabled={selectingId !== null}
                                            onButtonPress={() => setViewingSolution(sol)}
                                            style={{
                                                margin: 0,
                                                backgroundColor: colors.primaryAction,
                                                padding: "0.625rem 1.25rem",
                                                borderRadius: "12px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "0 2px 8px rgba(167, 74, 27, 0.3)",
                                            }}
                                            titleStyle={{ color: colors.primaryActionText, fontSize: "0.875rem", textAlign: "center" }}
                                        />
                                    </div>

                                    <div className={cssStyles.solutionMetaStrip}>
                                        <span className={cssStyles.solutionMetaItem}>
                                            Allocation rows: {sol.allocationVector?.length ?? 0}
                                        </span>
                                        <span className={cssStyles.solutionMetaItem}>
                                            Avg coverage: {avgCoverage != null ? `${avgCoverage.toFixed(1)}%` : "—"}
                                        </span>
                                    </div>

                                    <div className={cssStyles.solutionObjectives}>
                                        {sol.objectiveValues &&
                                            Object.entries(sol.objectiveValues).map(([key, obj]) => (
                                                <span key={key} className={cssStyles.objectiveChip}>
                                                    <strong>{key}:</strong>{" "}
                                                    {formatObjectiveValue(obj?.value)}{" "}
                                                    ({obj?.unit ?? ""})
                                                </span>
                                            ))}
                                    </div>
                                    {(deficitMetric || fairnessMetric) && (
                                        <div className={cssStyles.primaryObjectiveRow}>
                                            {deficitMetric && (
                                                <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveDeficit}`}>
                                                    <span className={cssStyles.primaryObjectiveLabel}>
                                                        {deficitMetric.label || "Deficit"}
                                                    </span>
                                                    <strong className={cssStyles.primaryObjectiveValue}>
                                                        {formatNumber(deficitMetric.value, 2)}
                                                        {deficitMetric.unit ? ` ${deficitMetric.unit}` : ""}
                                                    </strong>
                                                </div>
                                            )}
                                            {fairnessMetric && (
                                                <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveFairness}`}>
                                                    <span className={cssStyles.primaryObjectiveLabel}>
                                                        {fairnessMetric.label || "Fairness"}
                                                    </span>
                                                    <strong className={cssStyles.primaryObjectiveValue}>
                                                        {formatNumber(fairnessMetric.value, 2)}
                                                        {fairnessMetric.unit ? ` ${fairnessMetric.unit}` : ""}
                                                    </strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {currentRun?.status === "completed" && runResults != null && runResults.paretoSolutions.length === 0 && (
                <section className={cssStyles.runSection}>
                    <p className={cssStyles.message}>No solutions returned for this run.</p>
                </section>
            )}
                </>
            )}

            {viewMode === "history" && (
                <section className={cssStyles.historyGrid}>
                    <article className={cssStyles.historyPanel}>
                        <div className={cssStyles.historyPanelHeader}>
                            <h3 className={cssStyles.historyTitle}>Selected solution history</h3>
                            <div className={cssStyles.historyFilters}>
                                <label htmlFor="history-scenario-filter" className={cssStyles.filterLabel}>
                                    Scenario
                                </label>
                                <select
                                    id="history-scenario-filter"
                                    className={cssStyles.scenarioFilterSelect}
                                    value={scenarioFilter}
                                    onChange={(e) =>
                                        setScenarioFilter(
                                            (e.target.value || "") as "" | "dry season" | "wet season"
                                        )
                                    }
                                    title="Filter by scenario"
                                >
                                    <option value="">All scenarios</option>
                                    <option value="dry season">Dry season</option>
                                    <option value="wet season">Wet season</option>
                                </select>
                                <button
                                    type="button"
                                    className={cssStyles.historyRefreshBtn}
                                    onClick={loadSelectedHistory}
                                    disabled={historyLoading}
                                >
                                    {historyLoading ? "Loading..." : "Refresh"}
                                </button>
                            </div>
                        </div>
                        {historyError && <p className={cssStyles.historyError}>{historyError}</p>}
                        {!historyError && selectedHistory.length === 0 && !historyLoading && (
                            <p className={cssStyles.historyEmpty}>
                                No selected solution history yet.
                            </p>
                        )}
                        <div className={cssStyles.historyList}>
                            {selectedHistory.map((item, index) => {
                                const allocationVector = item.solutionSnapshot?.allocationVector ?? [];
                                const objectiveValues = item.solutionSnapshot?.objectiveValues ?? {};
                                const deficitMetric = extractObjectiveMetric(objectiveValues, /deficit/i);
                                const fairnessMetric = extractObjectiveMetric(objectiveValues, /fair/i);
                                const coverageValues = allocationVector
                                    .map((a) => a.coveragePercentage)
                                    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
                                const avgCoverage =
                                    coverageValues.length > 0
                                        ? coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length
                                        : null;

                                const selectedAt = item.createdAt ? new Date(item.createdAt) : null;
                                const selectedDateStr =
                                    selectedAt && Number.isFinite(selectedAt.getTime())
                                        ? selectedAt.toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })
                                        : "—";
                                const selectedTimeStr =
                                    selectedAt && Number.isFinite(selectedAt.getTime())
                                        ? selectedAt.toLocaleTimeString(undefined, {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })
                                        : "—";
                                const chronologicalNumber = index + 1;

                                return (
                                    <div key={item._id} className={cssStyles.historyCard}>
                                        <div className={cssStyles.historyCardTop}>
                                            <span className={cssStyles.historyRunIdBadge}>
                                                Run {item.runId}
                                            </span>
                                            <div className={cssStyles.historyCardBadges}>
                                                <span className={cssStyles.historyChronological}>
                                                    #{chronologicalNumber}
                                                </span>
                                                <span className={cssStyles.historyChip}>
                                                    {item.runSnapshot?.inputSnapshot?.scenario ?? "—"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className={cssStyles.historyMeta}>
                                            <strong>Created at:</strong> {selectedDateStr} at {selectedTimeStr}
                                        </p>
                                        <p className={cssStyles.historyMeta}>
                                            Supply:{" "}
                                            {item.runSnapshot?.inputSnapshot?.totalSeasonalWaterSupplyM3 != null
                                                ? `${item.runSnapshot.inputSnapshot.totalSeasonalWaterSupplyM3} m³`
                                                : "—"}
                                        </p>
                                        <p className={cssStyles.historyMeta}>
                                            Selected by: {item.selectedBy?.name ?? "—"}
                                        </p>
                                        <div className={cssStyles.historyMetricsRow}>
                                            <span className={cssStyles.historyMetricPill}>
                                                Allocation rows: {allocationVector.length}
                                            </span>
                                            <span className={cssStyles.historyMetricPill}>
                                                Avg coverage: {avgCoverage != null ? `${avgCoverage.toFixed(1)}%` : "—"}
                                            </span>
                                        </div>
                                        {Object.keys(objectiveValues).length > 0 && (
                                            <div className={cssStyles.historyObjectives}>
                                                {Object.entries(objectiveValues).slice(0, 3).map(([key, obj]) => (
                                                    <span key={key} className={cssStyles.objectiveChip}>
                                                        <strong>{key}:</strong>{" "}
                                                        {formatObjectiveValue(obj?.value)}{" "}
                                                        ({obj?.unit ?? ""})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {(deficitMetric || fairnessMetric) && (
                                            <div className={cssStyles.primaryObjectiveRow}>
                                                {deficitMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveDeficit}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {deficitMetric.label || "Deficit"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(deficitMetric.value, 2)}
                                                            {deficitMetric.unit ? ` ${deficitMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                                {fairnessMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveFairness}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {fairnessMetric.label || "Fairness"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(fairnessMetric.value, 2)}
                                                            {fairnessMetric.unit ? ` ${fairnessMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className={cssStyles.historyViewBtn}
                                            onClick={() => setViewingHistorySolution(item)}
                                        >
                                            View selected solution
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </article>
                </section>
            )}

            {showCompletionModal && runResults && (
                <div
                    className={cssStyles.previewOverlay}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="completion-ready-title"
                    onClick={(e) => e.target === e.currentTarget && setShowCompletionModal(false)}
                >
                    <div className={cssStyles.completionModal} onClick={(e) => e.stopPropagation()}>
                        <h3 id="completion-ready-title" className={cssStyles.completionTitle}>
                            Optimization finished
                        </h3>
                        <p className={cssStyles.completionText}>
                            Your solutions are ready. Review and compare them before selecting one.
                        </p>
                        <div className={cssStyles.completionStats}>
                            <span className={cssStyles.historyChip}>
                                {runResults.paretoSolutions.length} solution
                                {runResults.paretoSolutions.length > 1 ? "s" : ""}
                            </span>
                            <span className={cssStyles.historyChip}>
                                {runResults.optimizationRun.inputSnapshot?.scenario ?? "—"}
                            </span>
                        </div>
                        <div className={cssStyles.previewActions}>
                            <button
                                type="button"
                                className={cssStyles.btnBack}
                                onClick={() => setShowCompletionModal(false)}
                            >
                                Later
                            </button>
                            <button
                                type="button"
                                className={cssStyles.btnSelectInPreview}
                                onClick={() => {
                                    setShowSolutions(true);
                                    setShowCompletionModal(false);
                                }}
                            >
                                View solutions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingSolution && runResults && (
                <div
                    className={cssStyles.previewOverlay}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="solution-preview-title"
                    onClick={(e) => e.target === e.currentTarget && setViewingSolution(null)}
                >
                    <div className={cssStyles.previewModal} onClick={(e) => e.stopPropagation()}>
                        <div className={cssStyles.previewHeader}>
                            <h2 id="solution-preview-title" className={cssStyles.previewTitle}>
                                Solution preview — Solution{" "}
                                {(runResults.paretoSolutions.findIndex((s) => s._id === viewingSolution._id) + 1) || 1}
                            </h2>
                        </div>
                        <div className={cssStyles.previewBody}>
                            {viewingSolution.objectiveValues &&
                                Object.keys(viewingSolution.objectiveValues).length > 0 && (
                                    <div>
                                        {(() => {
                                            const deficitMetric = extractObjectiveMetric(viewingSolution.objectiveValues, /deficit/i);
                                            const fairnessMetric = extractObjectiveMetric(viewingSolution.objectiveValues, /fair/i);
                                            return (
                                                <>
                                        <p className={cssStyles.previewObjectivesTitle}>Objectives</p>
                                        <div className={cssStyles.previewObjectives}>
                                            {Object.entries(viewingSolution.objectiveValues).map(([key, obj]) => (
                                                <span key={key} className={cssStyles.objectiveChip}>
                                                    <strong>{key}:</strong>{" "}
                                                    {formatObjectiveValue(obj?.value)}{" "}
                                                    {obj?.unit ? `(${obj.unit})` : ""}
                                                </span>
                                            ))}
                                        </div>
                                        {(deficitMetric || fairnessMetric) && (
                                            <div className={cssStyles.primaryObjectiveRow}>
                                                {deficitMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveDeficit}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {deficitMetric.label || "Deficit"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(deficitMetric.value, 2)}
                                                            {deficitMetric.unit ? ` ${deficitMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                                {fairnessMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveFairness}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {fairnessMetric.label || "Fairness"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(fairnessMetric.value, 2)}
                                                            {fairnessMetric.unit ? ` ${fairnessMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            {viewingSolution.allocationVector && viewingSolution.allocationVector.length > 0 && (
                                <div className={cssStyles.previewChartWrap}>
                                    <p className={cssStyles.previewObjectivesTitle} style={{ marginBottom: "0.5rem" }}>
                                        Water allocation by lateral (m³)
                                    </p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart
                                            data={viewingSolution.allocationVector.map((a) => ({
                                                name: prettifyName(a.mainLateralId),
                                                allocated: Number(a.allocatedWaterM3) || 0,
                                                coverage:
                                                    typeof a.coveragePercentage === "number" && Number.isFinite(a.coveragePercentage)
                                                        ? a.coveragePercentage
                                                        : 0,
                                            }))}
                                            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: colors.chartNeutral }}
                                                tickLine={false}
                                                axisLine={{ stroke: colors.border }}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: colors.chartNeutral }}
                                                tickLine={false}
                                                axisLine={{ stroke: colors.border }}
                                                tickFormatter={(v) => (typeof v === "number" ? `${v}` : String(v))}
                                            />
                                            <Tooltip
                                                formatter={(value: unknown) => [formatNumber(value, 2), "Allocated (m³)"]}
                                                labelFormatter={(label) => `Lateral: ${label}`}
                                                contentStyle={{
                                                    borderRadius: "10px",
                                                    border: `1px solid ${colors.border}`,
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                }}
                                            />
                                            <Bar
                                                dataKey="allocated"
                                                fill={colors.chartAnomaly}
                                                radius={[6, 6, 0, 0]}
                                                name="Allocated (m³)"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className={cssStyles.allocationTableWrap}>
                                        <table className={cssStyles.allocationTable}>
                                            <thead>
                                                <tr>
                                                    <th>Lateral</th>
                                                    <th>Allocated (m³)</th>
                                                    <th>Effective (m³)</th>
                                                    <th>Coverage %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewingSolution.allocationVector.map((alloc, i) => {
                                                    const cov = alloc.coveragePercentage;
                                                    const covDisplay =
                                                        typeof cov === "number" && Number.isFinite(cov)
                                                            ? `${cov.toFixed(1)}%`
                                                            : "—";
                                                    return (
                                                        <tr key={i}>
                                                            <td>{prettifyName(alloc.mainLateralId)}</td>
                                                            <td>{formatNumber(alloc.allocatedWaterM3, 2)}</td>
                                                            <td>
                                                                {alloc.effectiveWaterM3 != null &&
                                                                Number.isFinite(Number(alloc.effectiveWaterM3))
                                                                    ? formatNumber(Number(alloc.effectiveWaterM3), 2)
                                                                    : "—"}
                                                            </td>
                                                            <td>{covDisplay}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={cssStyles.previewActions}>
                            <button
                                type="button"
                                className={cssStyles.btnBack}
                                onClick={() => setViewingSolution(null)}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className={cssStyles.btnSelectInPreview}
                                disabled={selectingId !== null}
                                onClick={() =>
                                    handleSelectSolution(runResults.optimizationRun._id, viewingSolution._id)
                                }
                            >
                                {selectingId === viewingSolution._id ? "Saving…" : "Select this solution"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingHistorySolution && (
                <div
                    className={cssStyles.previewOverlay}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="selected-history-title"
                    onClick={(e) => e.target === e.currentTarget && setViewingHistorySolution(null)}
                >
                    <div className={cssStyles.previewModal} onClick={(e) => e.stopPropagation()}>
                        <div className={cssStyles.previewHeader}>
                            <h2 id="selected-history-title" className={cssStyles.previewTitle}>
                                Selected solution history — <span className={cssStyles.previewRunIdBadge}>Run {viewingHistorySolution.runId}</span>
                            </h2>
                            <p className={cssStyles.historyModalMeta}>
                                <strong>Created at:</strong>{" "}
                                {viewingHistorySolution.createdAt
                                    ? new Date(viewingHistorySolution.createdAt).toLocaleString()
                                    : "—"}
                            </p>
                            <p className={cssStyles.historyModalMeta}>
                                Scenario: {viewingHistorySolution.runSnapshot?.inputSnapshot?.scenario ?? "—"}
                            </p>
                            <p className={cssStyles.historyModalMeta}>
                                Selected by {viewingHistorySolution.selectedBy?.name ?? "—"}
                            </p>
                        </div>
                        <div className={cssStyles.previewBody}>
                            {viewingHistorySolution.solutionSnapshot?.objectiveValues &&
                                Object.keys(viewingHistorySolution.solutionSnapshot.objectiveValues).length > 0 && (
                                    <div>
                                        {(() => {
                                            const deficitMetric = extractObjectiveMetric(
                                                viewingHistorySolution.solutionSnapshot?.objectiveValues,
                                                /deficit/i
                                            );
                                            const fairnessMetric = extractObjectiveMetric(
                                                viewingHistorySolution.solutionSnapshot?.objectiveValues,
                                                /fair/i
                                            );
                                            return (
                                                <>
                                        <p className={cssStyles.previewObjectivesTitle}>Objectives</p>
                                        <div className={cssStyles.previewObjectives}>
                                            {Object.entries(viewingHistorySolution.solutionSnapshot.objectiveValues).map(
                                                ([key, obj]) => (
                                                    <span key={key} className={cssStyles.objectiveChip}>
                                                        <strong>{key}:</strong>{" "}
                                                        {formatObjectiveValue(obj?.value)}{" "}
                                                        {obj?.unit ? `(${obj.unit})` : ""}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                        {(deficitMetric || fairnessMetric) && (
                                            <div className={cssStyles.primaryObjectiveRow}>
                                                {deficitMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveDeficit}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {deficitMetric.label || "Deficit"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(deficitMetric.value, 2)}
                                                            {deficitMetric.unit ? ` ${deficitMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                                {fairnessMetric && (
                                                    <div className={`${cssStyles.primaryObjectiveCard} ${cssStyles.primaryObjectiveFairness}`}>
                                                        <span className={cssStyles.primaryObjectiveLabel}>
                                                            {fairnessMetric.label || "Fairness"}
                                                        </span>
                                                        <strong className={cssStyles.primaryObjectiveValue}>
                                                            {formatNumber(fairnessMetric.value, 2)}
                                                            {fairnessMetric.unit ? ` ${fairnessMetric.unit}` : ""}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            {viewingHistorySolution.solutionSnapshot?.allocationVector &&
                                viewingHistorySolution.solutionSnapshot.allocationVector.length > 0 && (
                                    <div className={cssStyles.previewChartWrap}>
                                        <p className={cssStyles.previewObjectivesTitle} style={{ marginBottom: "0.5rem" }}>
                                            Water allocation by lateral (m³)
                                        </p>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart
                                                data={viewingHistorySolution.solutionSnapshot.allocationVector.map((a) => ({
                                                    name: prettifyName(a.mainLateralId),
                                                    allocated: Number(a.allocatedWaterM3) || 0,
                                                }))}
                                                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: colors.chartNeutral }}
                                                    tickLine={false}
                                                    axisLine={{ stroke: colors.border }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: colors.chartNeutral }}
                                                    tickLine={false}
                                                    axisLine={{ stroke: colors.border }}
                                                />
                                                <Tooltip
                                                    formatter={(value: unknown) => [formatNumber(value, 2), "Allocated (m³)"]}
                                                    labelFormatter={(label) => `Lateral: ${label}`}
                                                    contentStyle={{
                                                        borderRadius: "10px",
                                                        border: `1px solid ${colors.border}`,
                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="allocated"
                                                    fill={colors.chartAnomaly}
                                                    radius={[6, 6, 0, 0]}
                                                    name="Allocated (m³)"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className={cssStyles.allocationTableWrap}>
                                            <table className={cssStyles.allocationTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Lateral</th>
                                                        <th>Allocated (m³)</th>
                                                        <th>Effective (m³)</th>
                                                        <th>Coverage %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {viewingHistorySolution.solutionSnapshot.allocationVector.map((alloc, i) => {
                                                        const cov = alloc.coveragePercentage;
                                                        const covDisplay =
                                                            typeof cov === "number" && Number.isFinite(cov)
                                                                ? `${cov.toFixed(1)}%`
                                                                : "—";
                                                        return (
                                                            <tr key={i}>
                                                                <td>{prettifyName(alloc.mainLateralId)}</td>
                                                                <td>{formatNumber(alloc.allocatedWaterM3, 2)}</td>
                                                                <td>
                                                                    {alloc.effectiveWaterM3 != null &&
                                                                    Number.isFinite(Number(alloc.effectiveWaterM3))
                                                                        ? formatNumber(Number(alloc.effectiveWaterM3), 2)
                                                                        : "—"}
                                                                </td>
                                                                <td>{covDisplay}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                        </div>
                        <div className={cssStyles.previewActions}>
                            <button
                                type="button"
                                className={cssStyles.btnBack}
                                onClick={() => setViewingHistorySolution(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
