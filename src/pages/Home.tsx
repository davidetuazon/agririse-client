import React, { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { latest, me } from "../services/api";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Section from "../components/commons/Section";
import Dashboard from "../components/home/Dashboard";

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

export default function Home() {
    const [latestReadings, setLatestReadings] = useState<IoTReadings | null>(null);
    const [locality, setLocality] = useState<any>();
    const { setUser } = useAuth();

    const init = async () => {
        try {
            const loggedUser = await me();
            setUser(loggedUser);

            const res = await latest();
            setLatestReadings(res.data.readings);
            setLocality(res.data.locality);
        } catch (e) {
            setLatestReadings(null);
            console.error(e);
        }
    }

    useEffect(() => {
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {/* Locality Info */}
            <Text
                variant="heading"
                style={{ margin: 5 }}
            >
                Overview / <span style={{ color: colors.primary }}>{locality?.city}</span>
            </Text>

            {/* Dashboard */}
            <Section style={styles.dashboard}>
                <div
                    style={{ padding: '0px 20px' }}
                >
                    <Text
                        variant="heading"
                        style={{ margin: 0 }}
                    >
                        IoT Dashboard
                    </Text>
                </div>
                <div>
                    <Dashboard data={latestReadings} />
                </div>
            </Section>

            {/* 
                TODO:
                > can separate this section into 2 components
                > separate concerns for trends and optimization 
            */}
            <div style={styles.core}>
                <Section style={styles.trends}>
                    <Text
                        variant="heading"
                        style={{ margin: 0 }}
                    >
                        Trends
                    </Text>
                </Section>
                <Section style={styles.optimization}>
                    <Text
                        variant="heading"
                        style={{ margin: 0 }}
                    >
                        Optimization
                    </Text>
                </Section>
            </div>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    dashboard: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    core: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        gap: 20,
    },
    trends: {
        flex: 1,
        padding: '20px'
    },
    optimization: {
        flex: 1,
        padding: '20px'
    }
}