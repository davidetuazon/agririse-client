import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHistory } from "../services/api";
import { printPeriod, printSensorType } from "../utils/switchCases";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import Button from "../components/commons/Button";

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

    // useEffect(() => {
    //     console.log({ pageInfo, data })
    // }, [pageInfo, data])

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                History / <span style={{ color: colors.primary }}>{printSensorType(sensorType)}</span>
            </Text>

            <Section style={styles.section}>
                <div style={styles.header}>
                    {/* meta data */}
                    <div style={styles.metaData}>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Period:&nbsp;
                            </span>
                            {printPeriod(metaData?.period)}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Sensor Type:&nbsp;
                            </span>
                                {printSensorType(metaData?.sensorType)}
                        </Text>
                        <Text variant="subtitle" style={{ margin: 0 }}>
                            <span style={{ color: colors.primary }}>
                                Unit Measurement:&nbsp;
                            </span>
                                {metaData?.unit}
                        </Text>
                    </div>
                </div>

                {/* data table */}
                { data && data.length > 0 ? (
                    
                    <div style={styles.table}>

                        {/* category */}
                        {/* 
                            TODO:
                             > add time and unit conversion option
                        */}
                        <div style={styles.gridContainer}>
                            <div style={styles.categoryWrapper}>
                                <Text variant="title" style={styles.category}>
                                    # (latest)
                                </Text>
                            </div>
                            <div 
                                style={{
                                    ...styles.categoryWrapper,
                                    borderLeft: 'none',
                                }}
                            >
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
                                        {idx+1}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
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
                                        {d.value.toFixed(2)}
                                    </Text>
                                </div>
                                <div style={{
                                    ...styles.wrapper,
                                    borderRight: `2px solid ${colors.primaryBackground}`,
                                }}>
                                    <Text variant="subtitle">
                                        {delta === '-' ? '-' : `${delta >= 0 ? '+': ''}${delta.toFixed(2)}`}
                                    </Text>
                                </div>
                            </div>
                        )})}
                    </div>
                ) : (
                    // style this
                    <div>
                        <Text variant="title">
                            No data available.
                        </Text>
                    </div>
                )}

                {/* pagination buttons */}
                <footer style={styles.footer}>
                    {/* style these buttons */}
                    <Button
                        title="<"
                        style={styles.button}
                    />
                    <Button
                        title=">"
                        style={styles.button}
                        disabled={!pageInfo?.hasNext}
                    />
                </footer>
            </Section>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    section: {
        // border: '1px solid red',
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 20,
    },
    header: {
        // border: '1px solid red',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    metaData: {
        padding: '10px 40px',
        display:'flex',
        flexDirection: 'row',
        gap: 20,
    },
    table: {
        // border: '1px solid red',
        padding: '0px 40px',
        display: 'flex',
        flexDirection: 'column',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
    },
    footer: {
        // border: '1px solid red',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
    },
    button: {
        padding: '10px 5px',
        margin: 0,
    }
}