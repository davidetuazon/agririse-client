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
          const deficit = getObjectiveValue(solution.objectiveValues, /deficit/i);
          const fairness = getObjectiveValue(solution.objectiveValues, /fair/i);
          if (deficit == null || fairness == null) return null;
          return {
            solutionId: solution._id,
            solutionLabel: `Solution ${index + 1}`,
            solutionNumber: index + 1,
            deficit,
            fairness,
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
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={linePoints} margin={{ top: 10, right: 16, bottom: 20, left: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            type="number"
            dataKey="deficit"
            tick={{ fontSize: 11, fill: colors.chartNeutral }}
            tickLine={false}
            axisLine={{ stroke: colors.border }}
            tickFormatter={(value: number) => value.toFixed(2)}
            label={{
              value: "Deficit (lower is better)",
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 10, fill: colors.chartNeutral },
            }}
          />
          <YAxis
            type="number"
            dataKey="fairness"
            width={46}
            tick={{ fontSize: 11, fill: colors.chartNeutral }}
            tickLine={false}
            axisLine={{ stroke: colors.border }}
            tickFormatter={(value: number) => value.toFixed(2)}
            domain={[0, 1]}
            label={{
              value: "Fairness ↑",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: colors.chartNeutral },
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
                    fontSize: "0.78rem",
                  }}
                >
                  <div>
                    <strong>{point.solutionLabel}</strong> (#{point.solutionNumber})
                  </div>
                  <div>Deficit: {point.deficit.toFixed(4)}</div>
                  <div>Fairness: {point.fairness.toFixed(4)}</div>
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
            margin: "0.35rem 0 0",
            color: colors.chartNeutral,
            fontSize: "0.74rem",
          }}
        >
          Better solutions trend toward the upper-left (higher fairness, lower deficit).
        </p>
      )}
    </div>
  );
}
