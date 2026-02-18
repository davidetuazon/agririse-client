import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../../../services/api";
import { SENSOR_TYPES } from "../../../utils/constants";
import SensorMetricCard from "./SensorMetricCard";
import cssStyles from "./Dashboard.module.css";

type IoTReadings = {
    damWaterLevel: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
    },
    humidity: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
    },
    rainfall: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
    },
    temperature: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
    }
}

type Props = {
    style?: React.CSSProperties,
    data: IoTReadings | null,
}

type SensorType = 'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature';

export default function Dashboard(props: Props) {
    const navigate = useNavigate();
    const { damWaterLevel, humidity, rainfall, temperature } = props.data || {};
    const [deltas, setDeltas] = useState<Record<SensorType, number | null>>({
        damWaterLevel: null,
        humidity: null,
        rainfall: null,
        temperature: null,
    });
    const [selectedSensor, setSelectedSensor] = useState<SensorType | null>(null);

    const sensors = useMemo(() => ([
        { type: 'damWaterLevel', data: damWaterLevel, fallback: SENSOR_TYPES.damWaterLevel },
        { type: 'humidity', data: humidity, fallback: SENSOR_TYPES.humidity },
        { type: 'rainfall', data: rainfall, fallback: SENSOR_TYPES.rainfall },
        { type: 'temperature', data: temperature, fallback: SENSOR_TYPES.temperature },
    ]), [damWaterLevel, humidity, rainfall, temperature]);

    useEffect(() => {
        const fetchDeltas = async () => {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const results = await Promise.all(sensors.map(async ({ type }) => {
                const res = await getHistory({
                    sensorType: type,
                    startDate,
                    endDate,
                    limit: 2,
                    cursor: '',
                });
                const entries = res?.data ?? [];
                if (!entries || entries.length < 2) {
                    return { type, delta: null };
                }
                const delta = entries[0].value - entries[1].value;
                return { type, delta };
            }));

            const next: Record<SensorType, number | null> = {
                damWaterLevel: null,
                humidity: null,
                rainfall: null,
                temperature: null,
            };
            results.forEach(({ type, delta }) => {
                next[type as SensorType] = typeof delta === 'number' ? delta : null;
            });
            setDeltas(next);
        };

        if (props.data) {
            fetchDeltas();
        }
    }, [props.data, sensors]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedSensor(null);
            }
        };
        if (selectedSensor) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSensor]);

    const buildAnalyticsUrl = (sensorType: SensorType, defaultDays = 30) => {
        const end = new Date();
        const start = new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        return `/iot/analytics?sensorType=${sensorType}&startDate=${startDate}&endDate=${endDate}`;
    };

    const buildHistoryUrl = (sensorType: SensorType, defaultDays = 30, limit = 20) => {
        const end = new Date();
        const start = new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        return `/iot/history?sensorType=${sensorType}&startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
    };

    return (
        <>
            <div style={styles.container} className={cssStyles.dashboardContainer}>
                {sensors.map(({ type, data, fallback }) => (
                    <SensorMetricCard
                        key={type}
                        sensorType={type as SensorType}
                        label={fallback.label}
                        value={data?.value}
                        unit={data?.unit ?? fallback.unit}
                        recordedAt={data?.recordedAt}
                        delta={deltas[type as SensorType]}
                        onClick={() => setSelectedSensor(type as SensorType)}
                    />
                ))}
            </div>
            {selectedSensor && (
                <div className={cssStyles.modalOverlay} onClick={() => setSelectedSensor(null)}>
                    <div
                        className={cssStyles.modalCard}
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={cssStyles.modalHeader}>
                            <span className={cssStyles.modalTitle}>
                                {SENSOR_TYPES[selectedSensor].label}
                            </span>
                            <button
                                className={cssStyles.modalClose}
                                type="button"
                                onClick={() => setSelectedSensor(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <p className={cssStyles.modalSubtitle}>
                            Choose where you want to view this sensor.
                        </p>
                        <div className={cssStyles.modalActions}>
                            <button
                                className={cssStyles.modalButton}
                                type="button"
                                onClick={() => navigate(buildAnalyticsUrl(selectedSensor))}
                            >
                                View Analytics
                            </button>
                            <button
                                className={cssStyles.modalButtonSecondary}
                                type="button"
                                onClick={() => navigate(buildHistoryUrl(selectedSensor))}
                            >
                                View History
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        width: '100%',
    }
}