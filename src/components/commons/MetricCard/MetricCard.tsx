import React from "react";
import Text from "../Text";
import { formatFixed, formatUtcTimestamp } from "../../../utils/format";
import cssStyles from "./MetricCard.module.css";

type Props = {
  icon?: React.ReactNode;
  label: string;
  value: unknown;
  unit?: string;
  badge?: string;
  timestamp?: unknown;
  onClick?: () => void;
};

export default function MetricCard(props: Props) {
  const { icon, label, value, unit, badge, timestamp, onClick } = props;
  const formattedValue = formatFixed(value, 2);
  const formattedTimestamp = formatUtcTimestamp(timestamp);
  const isStatic = !onClick;

  return (
    <button
      type="button"
      className={`${cssStyles.card} ${isStatic ? cssStyles.static : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      <div className={cssStyles.header}>
        {icon ? <span className={cssStyles.icon}>{icon}</span> : null}
        <Text variant="subtitle" style={{ margin: 0 }}>
          {label}
        </Text>
      </div>

      <div className={cssStyles.valueRow}>
        <Text variant="heading" style={{ margin: 0 }}>
          {formattedValue}
          {unit ? <span className={cssStyles.unit}>{unit}</span> : null}
        </Text>
        {badge ? <span className={cssStyles.badge}>{badge}</span> : null}
      </div>

      <span className={cssStyles.timestamp}>
        {formattedTimestamp ? `Updated ${formattedTimestamp}` : "No recent updates"}
      </span>
    </button>
  );
}

