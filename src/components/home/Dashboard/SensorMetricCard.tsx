import {
    CloudRain,
    Droplets,
    Thermometer,
    Waves
} from "lucide-react";
import Text from "../../commons/Text";
import cssStyles from "./SensorMetricCard.module.css";

type SensorType = 'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature';

type Props = {
    sensorType: SensorType;
    label: string;
    value?: number;
    unit?: string;
    recordedAt?: string;
    delta?: number | null;
    onClick?: () => void;
};

const SENSOR_ACCENT: Record<SensorType, string> = {
    damWaterLevel: '#06b6d4',
    humidity: '#22d3ee',
    rainfall: '#3b82f6',
    temperature: '#f59e0b',
};

const getSensorIcon = (sensorType: SensorType) => {
    const accent = SENSOR_ACCENT[sensorType];
    switch (sensorType) {
        case 'damWaterLevel':
            return <Waves size={20} color={accent} />;
        case 'humidity':
            return <Droplets size={20} color={accent} />;
        case 'rainfall':
            return <CloudRain size={20} color={accent} />;
        case 'temperature':
            return <Thermometer size={20} color={accent} />;
        default:
            return null;
    }
};

const CARD_CLASS: Record<SensorType, string> = {
    damWaterLevel: cssStyles.cardWater,
    humidity: cssStyles.cardHumidity,
    rainfall: cssStyles.cardRainfall,
    temperature: cssStyles.cardTemperature,
};

export default function SensorMetricCard(props: Props) {
    const { sensorType, label, value, unit, recordedAt, delta, onClick } = props;
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : '--';
    const deltaLabel = typeof delta === 'number'
        ? `${delta >= 0 ? 'Higher' : 'Lower'} by ${Math.abs(delta).toFixed(2)}${unit ?? ''}`
        : 'No change data';
    const deltaClassName = typeof delta === 'number'
        ? delta >= 0
            ? cssStyles.deltaUp
            : cssStyles.deltaDown
        : cssStyles.deltaNeutral;

    const tooltipTitle = `${label} – Click for options`;
    return (
        <button
            type="button"
            className={`${cssStyles.card} ${CARD_CLASS[sensorType] ?? ""}`}
            onClick={onClick}
            title={tooltipTitle}
        >
            <div className={cssStyles.header}>
                <span className={cssStyles.icon}>{getSensorIcon(sensorType)}</span>
                <Text variant="subtitle" style={{ margin: 0 }}>
                    {label}
                </Text>
            </div>
            <div className={cssStyles.valueRow}>
                <Text variant="heading" style={{ margin: 0 }}>
                    {formattedValue}
                    <span className={cssStyles.unit}>{unit}</span>
                </Text>
                <span className={`${cssStyles.deltaChip} ${deltaClassName}`}>
                    {deltaLabel}
                </span>
            </div>
            <span className={cssStyles.timestamp}>
                {recordedAt
                    ? `Updated ${new Date(recordedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC`
                    : 'No recent updates'}
            </span>
        </button>
    );
}
