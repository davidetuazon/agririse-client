import { useMemo } from "react";
import {
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParetoSolution } from "../../services/api";
import colors from "../../constants/colors";

type Variant = "compact" | "full";

type Props = {
  solutions: ParetoSolution[];
  highlightSolutionId?: string | null;
  height: number;
  variant?: Variant;
};

type ChartPoint = {
  solutionId: string;
  solutionLabel: string;
  solutionNumber: number;
  deficit: number;
  fairness: number;
};

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeDeficitForX(value: number): number {
  return Math.abs(value);
}

function normalizeFairnessForY(value: number): number {
  return Math.abs(value);
}

function getObjectiveValue(
  objectiveValues: ParetoSolution["objectiveValues"],
  matcher: RegExp
): number | null {
  const entry = Object.entries(objectiveValues ?? {}).find(([key]) => matcher.test(key));
  return toNumber(entry?.[1]?.value);
}

export default function FairnessDeficitScatter({
  solutions,
  highlightSolutionId = null,
  height,
  variant = "compact",
}: Props) {
  const points = useMemo<ChartPoint[]>(
    () =>
      (solutions ?? [])
        .map((solution, index) => {
          const deficitRaw = getObjectiveValue(solution.objectiveValues, /deficit/i);
          const fairnessRaw = getObjectiveValue(solution.objectiveValues, /fair/i);
          if (deficitRaw == null || fairnessRaw == null) return null;
          return {
            solutionId: solution._id,
            solutionLabel: `Solution ${index + 1}`,
            solutionNumber: index + 1,
            deficit: normalizeDeficitForX(deficitRaw),
            fairness: normalizeFairnessForY(fairnessRaw),
          };
        })
        .filter((point): point is ChartPoint => point != null),
    [solutions]
  );

  const highlighted = useMemo(
    () => points.filter((point) => point.solutionId === highlightSolutionId),
    [points, highlightSolutionId]
  );
  const linePoints = useMemo(
    () => [...points].sort((a, b) => a.deficit - b.deficit),
    [points]
  );
  const fairnessDomain = useMemo<[number, number]>(() => {
    if (!points.length) return [0, 1];
    const values = points.map((point) => point.fairness);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      const pad = Math.max(Math.abs(min) * 0.05, 0.01);
      return [min - pad, max + pad];
    }
    const range = max - min;
    const pad = Math.max(range * 0.05, 0.01);
    return [min - pad, max + pad];
  }, [points]);

  if (!points.length) {
    return (
      <div
        style={{
          height,
          border: `1px dashed ${colors.border}`,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.chartNeutral,
          fontSize: "0.8rem",
          background: "#fff",
        }}
      >
        No fairness/deficit points available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height, marginBottom: 25, }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={linePoints} margin={{ top: 16, right: 24, bottom: 42, left: 36 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.borderMedium} />
          <XAxis
            type="number"
            dataKey="deficit"
            tick={{ fontSize: 12, fill: colors.textPrimary }}
            tickLine={false}
            axisLine={{ stroke: colors.chartAxis }}
            tickFormatter={(value: number) => value.toFixed(2)}
            label={{
              value: "Deficit Score (Lower is Better)",
              position: "bottom",
              offset: 12,
              style: { fontSize: 12, fontWeight: 600, fill: colors.textPrimary },
            }}
          />
          <YAxis
            type="number"
            dataKey="fairness"
            width={52}
            tick={{ fontSize: 12, fill: colors.textPrimary }}
            tickLine={false}
            axisLine={{ stroke: colors.chartAxis }}
            tickFormatter={(value: number) => value.toFixed(2)}
            domain={fairnessDomain}
            reversed={true}
            label={{
              value: "Fairness (Higher is Better)",
              angle: -90,
              position: "left",
              offset: 12,
              dy: -80,
              style: { fontSize: 12, fontWeight: 600, fill: colors.textPrimary },
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "4 4", stroke: colors.borderMedium }}
            content={({ active, payload }) => {
              const point = payload?.find((entry) => entry?.payload)?.payload as
                | ChartPoint
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
                    fontSize: "0.82rem",
                  }}
                >
                  <div><strong>{point.solutionLabel}</strong> (#{point.solutionNumber})</div>
                  <div style={{ marginTop: "0.25rem" }}>Deficit: {point.deficit.toFixed(4)}</div>
                  <div style={{ marginTop: "0.25rem" }}>Fairness: {point.fairness.toFixed(4)}</div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="fairness"
            stroke={colors.chartAxis}
            strokeOpacity={0.7}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            name="Pareto trend"
          />
          <Scatter
            data={points}
            fill={colors.chartPrevious}
            shape="circle"
            name="All solutions"
            isAnimationActive={false}
          />
          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill={colors.primaryAction}
              shape="circle"
              name="Selected solution"
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {variant === "full" && (
        <p
          style={{
            color: colors.textMuted,
            fontSize: "0.64rem",
          }}
        >
          *Better solutions trend toward the lower-left (higher fairness, lower deficit).
        </p>
      )}
    </div>
  );
}
