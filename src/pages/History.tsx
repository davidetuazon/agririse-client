import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHistory } from "../services/api";
import { printPeriod, printSensorType } from "../utils/switchCases";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";

export default function History() {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any>(null);
    const [pageInfo, setPageInfo] = useState<any>(null);

    const sensorType = searchParams.get('sensorType') ?? 'damWaterLevel';
    const period = searchParams.get('period') ?? '1month';

    const init = async () => {
        try {
            const res = await getHistory({ sensorType, period });
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

    useEffect(() => {
        console.log(data);
    }, [data, pageInfo])

    return (
        <>
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                {printSensorType(sensorType)} History
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
                { data && data.length > 0 ? (
                    <div style={styles.data}>
                        {data.map((d:any) => (
                            <div key={d._id}>
                                <Text variant="title">
                                    Value: {d.value}{d.unit}
                                </Text>
                                <Text variant="subtitle">
                                    Recorded At: {new Date(d.recordedAt).toLocaleString()}
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
        flexDirection: 'column',
    }
}