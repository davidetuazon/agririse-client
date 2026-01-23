import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnalytics } from "../services/api";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import Cards from "../components/commons/Card";
import "./Analytics.css";

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
    // data
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
                        <div style={{ padding: '0px clamp(0.75rem, 2vw, 1.25rem)' }}>
                            <Text
                                variant="title"
                                style={{ margin: 0, color: colors.primary }}
                            >
                                Aggregated Metrics
                            </Text>
                        </div>

                        {/* cards display */}
                        <div style={styles.cardsContainer} className="analytics-cards-container">
                            <div className="analytics-card">
                                <Cards
                                    label="Average Value"
                                    value={latest.avg}
                                    unit='%'
                                    style={styles.cards}
                                />
                            </div>
                            <div className="analytics-card">
                                <Cards
                                    label="Minimum Value"
                                    value={latest.min}
                                    unit='%'
                                    style={styles.cards}
                                />
                            </div>
                            <div className="analytics-card">
                                <Cards
                                    label="Maximum Value"
                                    value={latest.max}
                                    unit='%'
                                    style={styles.cards}
                                />
                            </div>
                            <div className="analytics-card">
                                <Cards
                                    label="Variability (σ)"
                                    value={latest.stdDev}
                                    style={styles.cards}
                                />
                            </div>
                        </div>

                        {/* meta data display */}
                        <div style={styles.metaData} className="analytics-meta-data">
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
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    metaData: {
        padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.75rem, 2vw, 1.25rem)',
        display:'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: 'clamp(0.5rem, 1.5vw, 1rem)',
        width: '100%',
    },
    cardsContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: 'fit-content',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        padding: '0px clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        boxSizing: 'border-box',
    },
    cards: {
        minWidth: 'min(150px, 100%)',
        flex: '1 1 calc(50% - 1rem)',
    },
    chartsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        flex: 1,
        width: '100%',
        minWidth: 0,
    },
}