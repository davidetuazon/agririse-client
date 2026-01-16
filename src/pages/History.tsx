import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHistory } from "../services/api";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import { timeAgo } from "../utils/helpers";
import "./History.css";

export default function History() {
    const [searchParams] = useSearchParams();
    // data
    const [data, setData] = useState<any>(null);
    const [metaData, setMetaData] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    // pagination
    const [pageInfo, setPageInfo] = useState<any>(null);
    const [cursor, setCursor] = useState<any>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') 
    ?? new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = Number(searchParams.get('limit')) || 10;

    const init = async () => {
        if (!startDate || !endDate) return;
        const res = await getHistory({ sensorType, startDate, endDate, limit, cursor });

        if (res.error) {
            setData(null);
            setPageInfo(null);
            setError(res.error);
            console.error(res.error);
        }

        setData(res.data);
        setMetaData(res.meta);
        setPageInfo(res.pageInfo);
    }

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, startDate, endDate, limit]);

    // pagination logic
    const fetchMore = async () => {
        if (!pageInfo?.hasNext) return;
        const res = await getHistory({ sensorType, startDate, endDate, limit, cursor: pageInfo?.nextCursor || '' });

        if (res.error) {
            setData(null);
            setPageInfo(null);
            setError(res.error);
            console.error(res.error);
        }

        setData((prev: any) => [...prev, ...res.data]);
        setMetaData(res.meta);
        setPageInfo(res.pageInfo);
    }

    useEffect(() => {
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    fetchMore();
                }
            },
            { root: null, rootMargin: '100px', threshold: 0.1 }
        )

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sentinelRef.current, pageInfo?.nextCursor, pageInfo?.hasNext]);

    useEffect(() => {
        setData([]);
        setPageInfo(null);
        setCursor(null);
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sensorType, startDate, endDate]);

    // useEffect(() => {
    //     console.log({ pageInfo, data })
    // }, [pageInfo, data])

    // meta data timestamp display
    // UTC/GMT format
    // can add option to convert to locale time if needed, make function
    const from = metaData?.dateRange?.startDate ? `${metaData?.dateRange?.startDate.replace('T', ' ').slice(0,19)} UTC` : '';
    const to = metaData?.dateRange?.endDate ? `${metaData?.dateRange?.endDate.replace('T', ' ').slice(0,19)} UTC` : '';

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                History / <span style={{ color: colors.primary }}>{metaData?.sensorType}</span>
            </Text>

            <Section style={styles.section}>
                <div style={styles.header}>
                    {/* meta data */}
                    <div style={styles.metaData} className="history-meta-data">
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Sensor Type:&nbsp;
                            </span>
                                {metaData?.sensorType}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Unit Measurement:&nbsp;
                            </span>
                                {metaData?.unit}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                From:&nbsp;
                            </span>
                                {from}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                To:&nbsp;
                            </span>
                                {to}
                        </Text>
                    </div>
                </div>

                {/* 
                    TODO:
                    > add infinite scroll for data
                    > use server side caching for minimal optimization
                    > csv export option should export entire cached data
                */}
                {/* data table */}
                { data && data.length > 0 ? (
                    
                    <div style={styles.table} className="history-table">

                        {/* category */}
                        {/* 
                            TODO:
                             > add time and unit conversion option
                        */}
                        <div style={styles.gridContainer} className="history-grid-container">
                            <div style={styles.categoryWrapper}>
                                <Text variant="title" style={styles.category}>
                                    Timestamp (UTC)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Value
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Δ (from previous)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="title" style={styles.category}>
                                    Elapsed
                                </Text>
                            </div>
                        </div>

                        {/* data */}
                        {data.map((d:any, idx: number) => {
                            const delta: number | '-' = idx === data.length - 1 ? '-' : d.value - data[idx + 1].value;

                            return (
                            <div key={d._id} style={styles.gridContainer}>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                    borderLeft: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="subtitle">
                                        {new Date(d.recordedAt).toISOString().replace('T', ' ').slice(0,19)}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="subtitle">
                                        {d.value.toFixed(2)}{metaData?.unit}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="subtitle">
                                        {delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}${metaData?.unit}`}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="subtitle">
                                        {timeAgo(d.recordedAt)}
                                    </Text>
                                </div>
                            </div>
                        )})}
                        <div ref={sentinelRef} />
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
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    section: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
    },
    metaData: {
        padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(1rem, 3vw, 2.5rem)',
        display:'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: 'clamp(0.5rem, 1.5vw, 1rem)',
        width: '100%',
        boxSizing: 'border-box',
    },
    table: {
        padding: '0px clamp(0.5rem, 2vw, 2.5rem)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'visible',
        boxSizing: 'border-box',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
        textAlign: 'center',
        alignItems: 'center',
        minWidth: 'min-content',
        width: '100%',
    },
    category: {
        color: colors.primary,
    },
    categoryWrapper: {
        border: `2px solid ${colors.primaryBackground}`,
        width: '100%',
        minWidth: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        wordBreak: 'break-word',
    },
    wrapper: {
        borderBottom: `2px solid ${colors.primaryBackground}`,
        width: '100%',
        minWidth: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        wordBreak: 'break-word',
    },
    footer: {
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
    },
    button: {
        padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.25rem, 1vw, 0.3125rem)',
        margin: 0,
    }
}