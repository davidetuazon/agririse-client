import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../services/api";
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
    const [error, setError] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') 
    ?? new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const init = async () => {
        if (!startDate || !endDate) return;
        const res = await getAnalytics({ sensorType, startDate, endDate, limit: 50, cursor: '' });

        if (res.error) {
            setData(null);
            setMetaData(null);
            setError(res.error);
            console.error(res.error);
        }

        setData(res.series);
        setMetaData(res.meta);
    }

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, startDate, endDate]);

    // display the latest aggregated data only for the summary
    const hasData = data && data.length > 0;
    const latest = hasData ? data?.[data.length - 1] : null;

    // meta data timestamp display
    // UTC/GMT format
    // can add option to convert to locale time if needed, make function
    const from = `${metaData?.dateRange?.startDate.replace('T', ' ').slice(0,19)} UTC`;
    const to = `${metaData?.dateRange?.endDate.replace('T', ' ').slice(0,19)} UTC`;

    // log this to see aggregated data series
    // data for doing charts
    // useEffect(() => {
    //     console.log({ data });
    // }, [data]);

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5, color: colors.primary  }}
            >
                Analytics / <span style={{ color: colors.textPrimary }}>{metaData?.sensorType}</span>
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
                                    Metric:&nbsp;
                                </span>
                                {metaData?.metric}
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