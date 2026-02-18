import React, { useEffect, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { latest, me } from "../../services/api";
import Text from "../../components/commons/Text";
import Section from "../../components/commons/Section";
import Dashboard from "../../components/home/Dashboard/Dashboard";
import DashboardTrends from "../../components/home/Trends/DashboardTrends";
import cssStyles from "./Home.module.css";
import { timeAgo } from "../../utils/helpers";

type IoTReadings = {
    damWaterLevel: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
        delta?: number | null,
        percentChange?: number | null,
        previousValue?: number | null,
        previousRecordedAt?: string | null,
        timeDifferenceMinutes?: number | null,
    },
    humidity: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
        delta?: number | null,
        percentChange?: number | null,
        previousValue?: number | null,
        previousRecordedAt?: string | null,
        timeDifferenceMinutes?: number | null,
    },
    rainfall: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
        delta?: number | null,
        percentChange?: number | null,
        previousValue?: number | null,
        previousRecordedAt?: string | null,
        timeDifferenceMinutes?: number | null,
    },
    temperature: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
        delta?: number | null,
        percentChange?: number | null,
        previousValue?: number | null,
        previousRecordedAt?: string | null,
        timeDifferenceMinutes?: number | null,
    }
}

export default function Home() {
    const [latestReadings, setLatestReadings] = useState<IoTReadings | null>(null);
    const [locality, setLocality] = useState<any>();
    const { setUser } = useAuth();

    const lastUpdated = latestReadings
        ? [latestReadings.damWaterLevel, latestReadings.humidity, latestReadings.rainfall, latestReadings.temperature]
            .map((reading) => reading?.recordedAt)
            .filter(Boolean)
            .sort()
            .slice(-1)[0]
        : null;

    const init = async () => {
        try {
            const loggedUser = await me();
            setUser(loggedUser);

            const res = await latest();
            setLatestReadings(res.readings);
            setLocality(res.locality);
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
            {/* Overview header */}
            <section className={cssStyles.overviewHeader}>
                <div className={cssStyles.overviewTitle}>
                    <Text variant="heading" style={{ margin: 0 }}>
                        Overview:
                    </Text>
                    <span className={cssStyles.overviewLocation}>
                        {locality?.city ?? "Location"}
                    </span>
                </div>
                <span className={cssStyles.overviewMeta}>
                    Real-time water and climate summary
                </span>
            </section>

            {/* Dashboard */}
            <Section style={styles.dashboard}>
                <div className={cssStyles.dashboardHeader}>
                    <div>
                        <Text variant="heading" style={{ margin: 0 }}>
                            IoT Dashboard
                        </Text>
                        <span className={cssStyles.dashboardSubtitle}>
                            Live sensor snapshot
                        </span>
                    </div>
                    <span className={cssStyles.dashboardMeta}>
                        {lastUpdated ? `Last refresh ${timeAgo(lastUpdated)}` : 'Last refresh —'}
                    </span>
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
            <div style={styles.core} className={cssStyles.homeCore}>
                <Section style={styles.trends}>
                    <DashboardTrends data={latestReadings} />
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
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    core: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    trends: {
        flex: 1,
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    optimization: {
        flex: 1,
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    }
}