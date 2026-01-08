import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../services/api";
import { printSensorType, printPeriod } from "../utils/switchCases";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";



export default function Analytics() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [pageInfo, setPageInfo] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const period = searchParams.get('period') ?? '1month';

    const init = async () => {
        try {
            const res = await getAnalytics({sensorType, period});
            const { data, pageInfo } = res;
            setData(data);
            setPageInfo(pageInfo);
        } catch (e) {
            setData(null);
            setPageInfo(null);
            console.error(e);
        }
    }

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, period]);

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                Analytics
            </Text>

            <Section style={styles.section}>
                <div style={styles.content}>
                    <Text
                        variant="heading"
                        style={{ margin: 0 }}
                    >
                        {printSensorType(sensorType)}
                    </Text>
                </div>
                {data && data.length > 0 ? (
                    <div style={styles.data}>
                        {data.map((d:any) => (
                            <div key={d.bucket}>
                                <Text variant="subtitle">
                                    Period: {printPeriod(d.period)}
                                </Text>
                                <Text variant="subtitle">
                                    Bucket: {d.bucket}
                                </Text>
                                <Text variant="subtitle">
                                    Average Value: {d.avgValue?.toFixed(4)}
                                </Text>
                                <Text variant="subtitle">
                                    Max Value: {d.maxValue?.toFixed(4)}
                                </Text>
                                <Text variant="subtitle">
                                    Min Value: {d.minValue?.toFixed(4)}
                                </Text>
                                <Text variant="subtitle">
                                    Standard Deviation: {d.stdDev?.toFixed(4)}
                                </Text>
                                <Text variant="subtitle">
                                    Total Value: {d.totalValue?.toFixed(4)}
                                </Text>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.data}>
                        <Text variant="title">
                            No data available.
                        </Text>
                    </div>
                )}
            </Section>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    section: {
        // border: '1px solid red',
        flex: 1,
    },
    content: {
        padding: '0px 20px',
    },
    data: {
        padding: '0px 20px',
        display: 'flex',
        gap: 20, 
    }
}