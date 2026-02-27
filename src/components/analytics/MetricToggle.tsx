import cssStyles from "./MetricToggle.module.css";

export type MetricKey = "avg" | "min" | "max" | "stdDev" | "total" | "count";

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: "avg", label: "Average" },
  { key: "min", label: "Min" },
  { key: "max", label: "Max" },
  { key: "stdDev", label: "σ (Std Dev)" },
  { key: "total", label: "Total" },
  { key: "count", label: "Count" },
];

type Props = {
  value: MetricKey;
  onChange: (metric: MetricKey) => void;
  /** When user hovers a button, call with that metric; when hover ends, call with null. Chart can highlight that line. */
  onHover?: (metric: MetricKey | null) => void;
  className?: string;
};

export default function MetricToggle({ value, onChange, onHover, className }: Props) {
  return (
    <div className={`${cssStyles.wrapper} ${className ?? ""}`} role="group" aria-label="Metric to emphasize">
      <span className={cssStyles.label}>Emphasize:</span>
      <div className={cssStyles.buttons}>
        {METRIC_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={value === key ? cssStyles.buttonActive : cssStyles.button}
            onClick={() => onChange(key)}
            onMouseEnter={() => onHover?.(key)}
            onMouseLeave={() => onHover?.(null)}
            aria-pressed={value === key}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
