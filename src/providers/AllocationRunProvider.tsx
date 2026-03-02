import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  createOptimizationRun,
  getOptimizationRunResults,
  getOptimizationRunStatus,
  type OptimizationRun,
  type ParetoSolution,
} from "../services/api";
import cssStyles from "./AllocationRunProvider.module.css";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 10 * 60 * 1000;

function formatNumber(value: unknown, maximumFractionDigits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function prettifyName(value?: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").trim();
}

type Scenario = "dry season" | "wet season";

export type AllocationRunResults = {
  optimizationRun: OptimizationRun;
  paretoSolutions: ParetoSolution[];
};

type AllocationRunContextValue = {
  currentRun: OptimizationRun | null;
  runResults: AllocationRunResults | null;
  setCurrentRun: React.Dispatch<React.SetStateAction<OptimizationRun | null>>;
  setRunResults: React.Dispatch<React.SetStateAction<AllocationRunResults | null>>;
  startRun: (params: { totalSeasonalWaterSupplyM3: number; scenario: Scenario }) => Promise<void>;
};

const AllocationRunContext = createContext<AllocationRunContextValue | null>(null);

export function useAllocationRun(): AllocationRunContextValue {
  const context = useContext(AllocationRunContext);
  if (!context) {
    throw new Error("useAllocationRun must be used within AllocationRunProvider");
  }
  return context;
}

export default function AllocationRunProvider({ children }: { children: ReactNode }) {
  const [currentRun, setCurrentRun] = useState<OptimizationRun | null>(null);
  const [runResults, setRunResults] = useState<AllocationRunResults | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const pollStartRef = useRef<number | null>(null);
  const completionNotifiedRunRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const onAllocationsPage = location.pathname.startsWith("/allocations");
  const showGlobalUi = location.pathname !== "/login";

  const startRun = useCallback(
    async ({ totalSeasonalWaterSupplyM3, scenario }: { totalSeasonalWaterSupplyM3: number; scenario: Scenario }) => {
      pollStartRef.current = null;
      completionNotifiedRunRef.current = null;
      setRunResults(null);
      setCurrentRun(null);
      setShowCompletionPopup(false);
      setMinimized(false);
      setShowDetails(false);
      const { optimizationRun } = await createOptimizationRun({
        totalSeasonalWaterSupplyM3,
        scenario,
      });
      setCurrentRun(optimizationRun);
      toast.success("Optimization started. Results will appear when ready.");
    },
    []
  );

  useEffect(() => {
    const run = currentRun;
    if (!run || run.status !== "pending") return;
    const runId = run._id;
    pollStartRef.current = pollStartRef.current ?? Date.now();

    const poll = async () => {
      if (
        pollStartRef.current &&
        Date.now() - pollStartRef.current > POLL_MAX_MS
      ) {
        toast.error("Optimization is taking longer than expected. You can try again later.");
        return;
      }

      try {
        const { status } = await getOptimizationRunStatus(runId);
        setCurrentRun((prev) => (prev ? { ...prev, status } : null));

        if (status === "completed") {
          const data = await getOptimizationRunResults(runId);
          setCurrentRun(data.optimizationRun);
          setRunResults({
            optimizationRun: data.optimizationRun,
            paretoSolutions: data.paretoSolutions ?? [],
          });
          setMinimized(false);
          setShowDetails(false);

          if (!onAllocationsPage && completionNotifiedRunRef.current !== runId) {
            completionNotifiedRunRef.current = runId;
            setShowCompletionPopup(true);
          }
        }
      } catch {
        // Keep polling quietly; page-specific error messages can still appear in Allocations.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentRun?._id, currentRun?.status, onAllocationsPage]);

  useEffect(() => {
    if (onAllocationsPage) {
      setShowCompletionPopup(false);
    }
  }, [onAllocationsPage]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!currentRun || currentRun.status !== "pending") return;
      getOptimizationRunStatus(currentRun._id)
        .then(({ status }) => {
          setCurrentRun((r) => (r ? { ...r, status } : null));
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [currentRun?._id, currentRun?.status]);

  const value = useMemo<AllocationRunContextValue>(
    () => ({
      currentRun,
      runResults,
      setCurrentRun,
      setRunResults,
      startRun,
    }),
    [currentRun, runResults, startRun]
  );

  const pendingCanals = currentRun?.inputSnapshot?.canalInput ?? [];
  const isPending = currentRun?.status === "pending";
  const showFloatingCompletion = Boolean(
    showCompletionPopup &&
      currentRun?.status === "completed" &&
      !onAllocationsPage
  );

  return (
    <AllocationRunContext.Provider value={value}>
      {children}

      {showGlobalUi && isPending && !minimized && (
        <div className={cssStyles.overlay} role="dialog" aria-modal="true" aria-label="Optimization run loader">
          <div className={cssStyles.modal}>
            <div className={cssStyles.titleRow}>
              <div>
                <h3 className={cssStyles.title}>Optimization is running</h3>
                <p className={cssStyles.subTitle}>
                  Run ID: {currentRun?._id ?? "—"} · Status: Pending
                </p>
              </div>
              <div className={cssStyles.actions}>
                <button
                  type="button"
                  className={cssStyles.btn}
                  onClick={() => setShowDetails((prev) => !prev)}
                >
                  {showDetails ? "Hide details" : "View details"}
                </button>
                <button
                  type="button"
                  className={cssStyles.closeBtn}
                  onClick={() => setMinimized(true)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className={cssStyles.loaderBlock}>
              <div className={cssStyles.progressBar}>
                <div className={cssStyles.progressFill} />
              </div>
              <span className={cssStyles.pill}>
                <span className={cssStyles.dot} />
                Processing allocation variables...
              </span>
            </div>

            {showDetails && (
              <div className={cssStyles.detailsWrap}>
                <div className={cssStyles.inputSummary}>
                  <div className={cssStyles.inputSummaryItem}>
                    <span className={cssStyles.inputSummaryLabel}>Water supply (input)</span>
                    <strong className={cssStyles.inputSummaryValue}>
                      {currentRun?.inputSnapshot?.totalSeasonalWaterSupplyM3 != null
                        ? `${Number(currentRun.inputSnapshot.totalSeasonalWaterSupplyM3).toLocaleString()} m³`
                        : "—"}
                    </strong>
                  </div>
                  <div className={cssStyles.inputSummaryItem}>
                    <span className={cssStyles.inputSummaryLabel}>Scenario</span>
                    <strong className={cssStyles.inputSummaryValue}>
                      {currentRun?.inputSnapshot?.scenario ?? "—"}
                    </strong>
                  </div>
                </div>
                <table className={cssStyles.table}>
                  <thead>
                    <tr>
                      <th>Main Lateral</th>
                      <th>Barangays</th>
                      <th>TBS by Dam (ha)</th>
                      <th>Net Water Demand (m³)</th>
                      <th>Seepage (m³)</th>
                      <th>Loss Factor (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCanals.length === 0 ? (
                      <tr>
                        <td colSpan={6}>No variable details available yet.</td>
                      </tr>
                    ) : (
                      pendingCanals.map((canal, index) => {
                        const barangays = canal.coverage?.map((c) => c.barangay).filter(Boolean);
                        const barangayDisplay = barangays?.length
                          ? barangays.map((b) => prettifyName(b)).join(", ")
                          : "—";
                        return (
                          <tr key={canal._id ?? `${canal.mainLateralId}-${index}`}>
                            <td>{prettifyName(canal.mainLateralId)}</td>
                            <td className={cssStyles.barangayCell}>{barangayDisplay}</td>
                            <td>{formatNumber(canal.tbsByDamHa)}</td>
                            <td>{formatNumber(canal.netWaterDemandM3)}</td>
                            <td>{formatNumber(canal.seepageM3)}</td>
                            <td>{formatNumber(canal.lossFactorPercentage)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showGlobalUi && isPending && minimized && (
        <div className={cssStyles.floatingCard} role="status" aria-live="polite">
          <p className={cssStyles.floatingTitle}>Optimization running</p>
          <p className={cssStyles.floatingText}>
            Your allocation run is still processing in the background.
          </p>
          <div className={cssStyles.actions}>
            <button
              type="button"
              className={cssStyles.btn}
              onClick={() => {
                setMinimized(false);
                setShowDetails(true);
              }}
            >
              View details
            </button>
            <button
              type="button"
              className={`${cssStyles.btn} ${cssStyles.btnPrimary}`}
              onClick={() => setMinimized(false)}
            >
              Expand
            </button>
          </div>
        </div>
      )}

      {showGlobalUi && showFloatingCompletion && (
        <div className={cssStyles.floatingCard} role="alert" aria-live="assertive">
          <p className={cssStyles.floatingTitle}>Optimization Run Finished</p>
          <p className={cssStyles.floatingText}>
            Click here to be redirected to the Allocations page or go there manually.
          </p>
          <div className={cssStyles.actions}>
            <button
              type="button"
              className={cssStyles.btn}
              onClick={() => setShowCompletionPopup(false)}
            >
              Dismiss
            </button>
            <button
              type="button"
              className={`${cssStyles.btn} ${cssStyles.btnPrimary}`}
              onClick={() => {
                setShowCompletionPopup(false);
                navigate("/allocations");
              }}
            >
              Go to Allocations
            </button>
          </div>
        </div>
      )}
    </AllocationRunContext.Provider>
  );
}
