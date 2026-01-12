import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHistory } from "../services/api";
import { printPeriod, printSensorType } from "../utils/switchCases";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";

export default function History() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [metaData, setMetaData] = useState<any>(null);
    const [pageInfo, setPageInfo] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const period = searchParams.get('period') ?? '1month';
    const limit = Number(searchParams.get('limit')) || 10;

    const init = async () => {
        try {
            const res = await getHistory({ sensorType, period, limit });
            const { data, meta, pageInfo } = res;
            setData(data);
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
    }, [sensorType, period, limit]);

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                {printSensorType(sensorType)} History
            </Text>
            <Section style={styles.section}>
                <div style={styles.header}>
                    <div style={{ padding: '0px 20px' }}>
                        <Text variant="title" style={{ margin: 0, color: colors.primary }}>
                            Raw Data
                        </Text>
                    </div>
                    <div style={styles.metaData}>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Period:&nbsp;
                            </span>
                            {printPeriod(metaData?.period)}
                        </Text>
                    </div>
                </div>
                { data && data.length > 0 ? (
                    <div style={styles.table}>
                        <div style={styles.gridContainer}>
                            <div style={styles.categoryWrapper}>
                                <Text variant="heading" style={styles.category}>
                                    Time (UTC)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderRight: 'none',
                                    borderLeft: 'none',
                                }}
                            >
                                <Text variant="heading" style={styles.category}>
                                    Value
                                </Text>
                            </div>
                            <div style={styles.categoryWrapper}>
                                <Text variant="heading" style={styles.category}>
                                    Unit
                                </Text>
                            </div>
                        </div>
                        {data.map((d:any) => (
                            <div key={d._id} style={styles.gridContainer}>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                    borderLeft: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="title">
                                        {new Date(d.recordedAt).toISOString().replace('T', ' ').slice(0,19)}
                                    </Text>
                                </div>
                                <div style={styles.wrapper}>
                                    <Text variant="title">
                                        {d.value.toFixed(2)}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                    borderLeft: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="title">
                                        {d.unit}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
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
        gap: 20,
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    metaData: {
        padding: '10px 20px',
    },
    table: {
        padding: '0px 20px',
        display: 'flex',
        flexDirection: 'column',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        textAlign: 'center',
        alignItems: 'center',
    },
    category: {
        color: colors.primary,
    },
    categoryWrapper: {
        border: `2px solid ${colors.primaryBackground}`,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wrapper: {
        borderBottom: `2px solid ${colors.primaryBackground}`,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }
}