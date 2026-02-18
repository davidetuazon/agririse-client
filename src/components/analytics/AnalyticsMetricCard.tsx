import { BarChart2, ArrowDown, ArrowUp, Sigma } from "lucide-react";
import colors from "../../constants/colors";
import Text from "../commons/Text";
import cssStyles from "./AnalyticsMetricCard.module.css";

type CardType = "avg" | "min" | "max" | "stdDev";

type Props = {
  type: CardType;
  label: string;
  value: number | undefined;
  unit?: string;
  subtitle?: string;
};

const getIcon = (type: CardType) => {
  const iconProps = { size: 20, color: colors.primary };
  switch (type) {
    case "avg":
      return <BarChart2 {...iconProps} />;
    case "min":
      return <ArrowDown {...iconProps} />;
    case "max":
      return <ArrowUp {...iconProps} />;
    case "stdDev":
      return <Sigma {...iconProps} />;
    default:
      return <BarChart2 {...iconProps} />;
  }
};

export default function AnalyticsMetricCard({ type, label, value, unit, subtitle }: Props) {
  const formattedValue = typeof value === "number" ? value.toFixed(2) : "—";

  return (
    <div className={cssStyles.card}>
      <div className={cssStyles.header}>
        <span className={cssStyles.icon}>{getIcon(type)}</span>
        <Text variant="subtitle" style={{ margin: 0 }}>
          {label}
        </Text>
      </div>
      <div className={cssStyles.valueRow}>
        <Text variant="heading" style={{ margin: 0 }}>
          {formattedValue}
          {unit != null && unit !== "" && <span className={cssStyles.unit}>{unit}</span>}
        </Text>
      </div>
      {subtitle && <span className={cssStyles.timestamp}>{subtitle}</span>}
    </div>
  );
}
