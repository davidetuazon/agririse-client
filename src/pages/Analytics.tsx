import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../services/api";
import { printSensorType, printPeriod } from "../utils/switchCases";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import Cards from "../components/commons/Card";

type AnalyticsData = {
    timestamp: string,
    avg: number,
    min: number,
    max: number,
    stdDev: number,
    count: number,
}

export default function Analytics() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<AnalyticsData[] | null>(null);
    const [metaData, setMetaData] = useState<any>(null);
    // const [pageInfo, setPageInfo] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const period = searchParams.get('period') ?? '1month';

    const init = async () => {
        try {
            const res = await getAnalytics({sensorType, period});
            const { series, meta } = res;
            setData(series);
            setMetaData(meta);
            // setPageInfo(pageInfo);
        } catch (e) {
            setData(null);
            setMetaData(null);
            // setPageInfo(null);
            console.error(e);
        }
    }

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, period]);

    // display the latest aggregated data only for the summary
    const hasData = data && data.length > 0;
    const latest = hasData ? data?.[data.length - 1] : null;

    // meta data timestamp display
    // UTC/GMT format
    // can add option to convert to locale time if needed, make function
    const from = hasData
        ? `${new Date(data[0]?.timestamp).toISOString().replace('T', ' ').slice(0,19)} UTC`
        : null;
    const to = hasData
        ? `${new Date(data[data.length - 1]?.timestamp).toISOString().replace('T', ' ').slice(0,19)} UTC`
        : null;

    // log this to see aggregated data series
    // data for doing charts
    // useEffect(() => {
    //     console.log({ data });
    // }, [data]);

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                Analytics / <span style={{ color: colors.primary }}>{printSensorType(sensorType)}</span>
            </Text>

            {/* summary */}
            <Section>
                {latest ? (
                    <div key={latest.timestamp} style={styles.summary}>
                        <div style={{ padding: '0px 20px' }}>
                            <Text
                                variant="title"
                                style={{ margin: 0, color: colors.primary }}
                            >
                                Aggregated Metrics
                            </Text>
                        </div>

                        {/* cards display */}
                        <div style={styles.cardsContainer}>
                            <Cards
                                label="Average Value"
                                value={latest.avg}
                                unit='%'
                                style={styles.cards}
                            />
                            <Cards
                                label="Minimum Value"
                                value={latest.min}
                                unit='%'
                                style={styles.cards}
                            />
                            <Cards
                                label="Maximum Value"
                                value={latest.max}
                                unit='%'
                                style={styles.cards}
                            />
                            <Cards
                                label="Variability (σ)"
                                value={latest.stdDev}
                                style={styles.cards}
                            />
                        </div>

                        {/* meta data display */}
                        <div style={styles.metaData}>
                            <Text
                                variant="subtitle"
                                style={{ margin: 0 }}
                            >
                                <span style={{ color: colors.primary }}>
                                    From:&nbsp;
                                </span>
                                {from}
                            </Text>
                            <Text
                                variant="subtitle"
                                style={{ margin: 0 }}
                            >
                                <span style={{ color: colors.primary }}>
                                    To:&nbsp;
                                </span>
                                {to}
                            </Text>
                            <Text
                                variant="subtitle"
                                style={{ margin: 0 }}
                            >
                                <span style={{ color: colors.primary }}>
                                    Period:&nbsp;
                                </span>
                                {printPeriod(metaData?.period)}
                            </Text>
                            <Text
                                variant="subtitle"
                                style={{ margin: 0 }}
                            >
                                <span style={{ color: colors.primary }}>
                                    Granularity:&nbsp;
                                </span>
                                {metaData?.granularity}
                            </Text>
                            <Text
                                variant="subtitle"
                                style={{ margin: 0 }}
                            >
                                <span style={{ color: colors.primary }}>
                                    Metric:&nbsp;
                                </span>
                                {metaData?.metric}
                            </Text>
                        </div>
                    </div>
                ) : (
                    // style this
                    <div>
                        <Text variant="title">
                            No data available.
                        </Text>
                    </div>
                )}
            </Section>

            {/* 
                TODO:
                 > chart display for aggregated data
                 > separate component to handle chart display
            */}
            <Section style={styles.chartsSection}>
                <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text variant="caption">
                        display charts here
                    </Text>
                </div>
            </Section>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    summary: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    metaData: {
        // border: '1px solid red',
        padding: '10px 20px',
        display:'flex',
        flexDirection: 'row',
        gap: 20,
    },
    cardsContainer: {
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