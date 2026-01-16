import React from "react";
import Cards from "../commons/Card";
import "./Dashboard.css";

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

export default function Dashboard(props: Props) {
    const { damWaterLevel, humidity, rainfall, temperature } = props.data || {};

    return (
        <div style={styles.container} className="dashboard-container">
            <div className="dashboard-card">
                <Cards
                    label={damWaterLevel?.sensorType}
                    value={damWaterLevel?.value}
                    unit={damWaterLevel?.unit}
                    recordedAt={damWaterLevel?.recordedAt}
                />
            </div>
            <div className="dashboard-card">
                <Cards
                    label={humidity?.sensorType}
                    value={humidity?.value}
                    unit={humidity?.unit}
                    recordedAt={humidity?.recordedAt}
                />
            </div>
            <div className="dashboard-card">
                <Cards
                    label={rainfall?.sensorType}
                    value={rainfall?.value}
                    unit={rainfall?.unit}
                    recordedAt={rainfall?.recordedAt}
                />
            </div>
            <div className="dashboard-card">
                <Cards
                    label={temperature?.sensorType}
                    value={temperature?.value}
                    unit={temperature?.unit}
                    recordedAt={temperature?.recordedAt}
                />
            </div>
        </div>
    );
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: 'fit-content',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        padding: '0px clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        boxSizing: 'border-box',
    }
}