import {
    CloudRain,
    Droplets,
    Thermometer,
    Waves
} from "lucide-react";
import colors from "../../../constants/colors";
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

const getSensorIcon = (sensorType: SensorType) => {
    switch (sensorType) {
        case 'damWaterLevel':
            return <Waves size={20} color={colors.primary} />;
        case 'humidity':
            return <Droplets size={20} color={colors.primary} />;
        case 'rainfall':
            return <CloudRain size={20} color={colors.primary} />;
        case 'temperature':
            return <Thermometer size={20} color={colors.primary} />;
        default:
            return null;
    }
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

    return (
        <button
            type="button"
            className={cssStyles.card}
            onClick={onClick}
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
