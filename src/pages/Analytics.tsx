import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../services/api";
import { printSensorType, printPeriod } from "../utils/switchCases";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import Cards from "../components/commons/Card";

export default function Analytics() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [metaData, setMetaData] = useState<any>(null);
    const [pageInfo, setPageInfo] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const period = searchParams.get('period') ?? '1month';

    const init = async () => {
        try {
            const res = await getAnalytics({sensorType, period});
            const { series, meta, pageInfo } = res;
            setData(series);
            setMetaData(meta);
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
                {printSensorType(sensorType)} Analytics
            </Text>

            <Section style={styles.kpiSection}>
                {data && data.length > 0 ? (
                    <div>
                        <div
                            style={{ padding: '20px' }}
                        >
                            <Text
                                variant="caption"
                                style={{ margin: 0 }}
                            >
                                display metadata here
                            </Text>
                        </div>
                        {data.map((d:any) => (
                            <div key={d.timestamp} style={styles.container}>
                                <Cards
                                    label="Average Value"
                                    value={d.avg}
                                    unit='%'
                                    recordedAt={d.timestamp}
                                    style={styles.cards}
                                />
                                <Cards
                                    label="Minimum Value"
                                    value={d.min}
                                    unit='%'
                                    recordedAt={d.timestamp}
                                    style={styles.cards}
                                />
                                <Cards
                                    label="Maximum Value"
                                    value={d.max}
                                    unit='%'
                                    recordedAt={d.timestamp}
                                    style={styles.cards}
                                />
                                <Cards
                                    label="Standard Deviation"
                                    value={d.stdDev}
                                    recordedAt={d.timestamp}
                                    style={styles.cards}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.data}>
                        <Text variant="title">
                            No data available yet.
                        </Text>
                    </div>
                )}
            </Section>
            <Section style={styles.chartsSection}>
                <div style={styles.container}>
                    <Text variant="caption">
                        display charts here
                    </Text>
                </div>
            </Section>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    kpiSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    container: {
        // border: '1px solid red',
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        height: 'fit-content',
        gap: 20,
        padding: '0px 20px'
    },
    cards: {
        minWidth: '150px'
    },
    chartsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        flex: 1,
    },
}