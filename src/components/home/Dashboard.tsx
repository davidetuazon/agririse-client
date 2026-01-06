import React from "react";
import Cards from "../commons/Card";

type IoTReadings = {
    damWaterLevel: {
        value: number,
        unit: string,
        recordedAt: string,
    },
    humidity: {
        value: number,
        unit: string,
        recordedAt: string,
    },
    rainfall: {
        value: number,
        unit: string,
        recordedAt: string,
    },
    temperature: {
        value: number,
        unit: string,
        recordedAt: string,
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
                sensorType="Dam Water Level"
                value={damWaterLevel?.value}
                unit={damWaterLevel?.unit}
                recordedAt={damWaterLevel?.recordedAt}
            />
            <Cards
                sensorType="Humidity"
                value={humidity?.value}
                unit={humidity?.unit}
                recordedAt={humidity?.recordedAt}
            />
            <Cards
                sensorType="Effective Rainfall"
                value={rainfall?.value}
                unit={rainfall?.unit}
                recordedAt={rainfall?.recordedAt}
            />
            <Cards
                sensorType="Temperature"
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