import React from "react";
import Cards from "../commons/Card";

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
        <div style={styles.container}>
            <Cards
                label={damWaterLevel?.sensorType}
                value={damWaterLevel?.value}
                unit={damWaterLevel?.unit}
                recordedAt={damWaterLevel?.recordedAt}
            />
            <Cards
                label={humidity?.sensorType}
                value={humidity?.value}
                unit={humidity?.unit}
                recordedAt={humidity?.recordedAt}
            />
            <Cards
                label={rainfall?.sensorType}
                value={rainfall?.value}
                unit={rainfall?.unit}
                recordedAt={rainfall?.recordedAt}
            />
            <Cards
                label={temperature?.sensorType}
                value={temperature?.value}
                unit={temperature?.unit}
                recordedAt={temperature?.recordedAt}
            />
        </div>
    );
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        // border: '1px solid red',
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        height: 'fit-content',
        gap: 20,
        padding: '0px 20px'
    }
}