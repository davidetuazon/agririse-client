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
    dataSource?: string;
    forecastValue?: number;
    forecastUnit?: string;
    forecastRecordedAt?: string;
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
    const {
        sensorType,
        label,
        value,
        unit,
        recordedAt,
        delta,
        dataSource,
        forecastValue,
        forecastUnit,
        forecastRecordedAt,
        onClick
    } = props;
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : '--';
    const formattedForecastValue = typeof forecastValue === 'number' ? forecastValue.toFixed(2) : null;
    const forecastFriendlyDate = forecastRecordedAt
        ? (() => {
            const d = new Date(forecastRecordedAt);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        })()
        : null;
    const deltaLabel = typeof delta === 'number'
        ? `${delta >= 0 ? 'Higher' : 'Lower'} by ${Math.abs(delta).toFixed(2)}${unit ?? ''}`
        : 'No change data';
    const deltaClassName = typeof delta === 'number'
        ? delta >= 0
            ? cssStyles.deltaUp
            : cssStyles.deltaDown
        : cssStyles.deltaNeutral;
    const normalizeSource = (source?: string) => {
        if (!source) return null;
        const lower = source.toLowerCase();
        if (lower === 'import') return 'Imported';
        if (lower === 'iot') return 'IoT';
        if (lower === 'forecast') return 'Forecasted';
        if (lower === 'mock') return 'Mock';
        return source;
    };
    const currentSourceLabel = normalizeSource(dataSource);

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
            {currentSourceLabel && (
                <div className={cssStyles.sourceRow}>
                    <span className={cssStyles.sourceBadge}>Source: {currentSourceLabel}</span>
                </div>
            )}
            <span className={cssStyles.timestamp}>
                {recordedAt
                    ? `Updated ${new Date(recordedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC`
                    : 'No recent updates'}
            </span>
            {formattedForecastValue && forecastFriendlyDate && (
                <div className={cssStyles.forecastBlock}>
                    <div className={cssStyles.forecastLabel}>
                        {forecastFriendlyDate === 'Tomorrow' ? "Tomorrow's forecast" : `Forecast for ${forecastFriendlyDate}`}
                    </div>
                    <div className={cssStyles.forecastValueRow}>
                        <span className={cssStyles.forecastValue}>
                            {formattedForecastValue}
                            <span className={cssStyles.forecastUnit}>{forecastUnit ?? unit}</span>
                        </span>
                    </div>
                </div>
            )}
        </button>
    );
}
