import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { getHistory, getNextForecast, getSelectedSolutionsHistory, latest, me } from "../../services/api";
import type { SelectedSolutionHistoryItem } from "../../services/api";
import type { ForecastReading } from "../../services/api";
import Text from "../../components/commons/Text";
import Section from "../../components/commons/Section";
import Dashboard from "../../components/home/Dashboard/Dashboard";
import DashboardTrends from "../../components/home/Trends/DashboardTrends";
import OptimizationTrendsCard from "../../components/optimization/OptimizationTrendsCard";
import cssStyles from "./Home.module.css";
import { timeAgo } from "../../utils/helpers";

type IoTReadings = {
    damWaterLevel: {
        value: number,
        unit: string,
        recordedAt: string,
        sensorType: string,
        source?: string,
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
    const [nextForecasts, setNextForecasts] = useState<Record<'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature', ForecastReading | null>>({
        damWaterLevel: null,
        humidity: null,
        rainfall: null,
        temperature: null,
    });
    const [locality, setLocality] = useState<any>();
    const [optimizationHistory, setOptimizationHistory] = useState<SelectedSolutionHistoryItem[]>([]);
    const [optimizationLoading, setOptimizationLoading] = useState(true);
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

            const todayIso = new Date().toISOString().slice(0, 10);
            const startIso = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            const [latestRes, damForecastRes, humidityForecastRes, rainfallForecastRes, temperatureForecastRes, latestDamAnyRes, latestHumidityAnyRes, latestRainfallAnyRes, latestTemperatureAnyRes] = await Promise.all([
                latest(),
                getNextForecast('damWaterLevel'),
                getNextForecast('humidity'),
                getNextForecast('rainfall'),
                getNextForecast('temperature'),
                getHistory({ sensorType: 'damWaterLevel', startDate: startIso, endDate: todayIso, limit: 1, cursor: '' }),
                getHistory({ sensorType: 'humidity', startDate: startIso, endDate: todayIso, limit: 1, cursor: '' }),
                getHistory({ sensorType: 'rainfall', startDate: startIso, endDate: todayIso, limit: 1, cursor: '' }),
                getHistory({ sensorType: 'temperature', startDate: startIso, endDate: todayIso, limit: 1, cursor: '' }),
            ]);

            const bestDam = latestDamAnyRes?.data?.[0];
            const bestHumidity = latestHumidityAnyRes?.data?.[0];
            const bestRainfall = latestRainfallAnyRes?.data?.[0];
            const bestTemperature = latestTemperatureAnyRes?.data?.[0];
            
            const mergedReadings: IoTReadings = {
                ...latestRes.readings,
                damWaterLevel: bestDam
                    ? {
                        ...(latestRes.readings?.damWaterLevel ?? {}),
                        value: bestDam.value,
                        unit: bestDam.unit ?? (latestRes.readings?.damWaterLevel?.unit ?? '%'),
                        recordedAt: bestDam.recordedAt,
                        sensorType: latestRes.readings?.damWaterLevel?.sensorType ?? 'Dam Water Level',
                        source: bestDam.source ?? latestRes.readings?.damWaterLevel?.source,
                    }
                    : latestRes.readings?.damWaterLevel,
                humidity: bestHumidity
                    ? {
                        ...(latestRes.readings?.humidity ?? {}),
                        value: bestHumidity.value,
                        unit: bestHumidity.unit ?? (latestRes.readings?.humidity?.unit ?? '%'),
                        recordedAt: bestHumidity.recordedAt,
                        sensorType: latestRes.readings?.humidity?.sensorType ?? 'Humidity',
                        source: bestHumidity.source ?? latestRes.readings?.humidity?.source,
                    }
                    : latestRes.readings?.humidity,
                rainfall: bestRainfall
                    ? {
                        ...(latestRes.readings?.rainfall ?? {}),
                        value: bestRainfall.value,
                        unit: bestRainfall.unit ?? (latestRes.readings?.rainfall?.unit ?? 'mm'),
                        recordedAt: bestRainfall.recordedAt,
                        sensorType: latestRes.readings?.rainfall?.sensorType ?? 'Rainfall',
                        source: bestRainfall.source ?? latestRes.readings?.rainfall?.source,
                    }
                    : latestRes.readings?.rainfall,
                temperature: bestTemperature
                    ? {
                        ...(latestRes.readings?.temperature ?? {}),
                        value: bestTemperature.value,
                        unit: bestTemperature.unit ?? (latestRes.readings?.temperature?.unit ?? '°C'),
                        recordedAt: bestTemperature.recordedAt,
                        sensorType: latestRes.readings?.temperature?.sensorType ?? 'Temperature',
                        source: bestTemperature.source ?? latestRes.readings?.temperature?.source,
                    }
                    : latestRes.readings?.temperature,
            };

            setLatestReadings(mergedReadings);
            setLocality(latestRes.locality);
            const normalizeForecast = (value: unknown): ForecastReading | null =>
                value && typeof (value as any)?.error === 'undefined'
                    ? (value as ForecastReading)
                    : null;
            setNextForecasts({
                damWaterLevel: normalizeForecast(damForecastRes),
                humidity: normalizeForecast(humidityForecastRes),
                rainfall: normalizeForecast(rainfallForecastRes),
                temperature: normalizeForecast(temperatureForecastRes),
            });
        } catch (e) {
            setLatestReadings(null);
            setNextForecasts({
                damWaterLevel: null,
                humidity: null,
                rainfall: null,
                temperature: null,
            });
            console.error(e);
        }
    }

    useEffect(() => {
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        setOptimizationLoading(true);
        getSelectedSolutionsHistory()
            .then((list) => {
                if (cancelled || !Array.isArray(list)) return;
                const sorted = [...list].sort((a, b) => {
                    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return tb - ta;
                });
                setOptimizationHistory(sorted);
            })
            .catch(() => setOptimizationHistory([]))
            .finally(() => { if (!cancelled) setOptimizationLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className={cssStyles.pageScroll}>
            {/* Overview header */}
            <section className={cssStyles.overviewHeader} data-tour="dashboard-overview">
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
            <Section style={styles.dashboard} data-tour="dashboard-sensors">
                <div className={cssStyles.dashboardHeader}>
                    <div>
                        <Text variant="heading" style={{ margin: 0 }}>
                            Sensor Dashboard
                        </Text>
                        <span className={cssStyles.dashboardSubtitle}>
                            Live sensor snapshot
                        </span>
                    </div>
                    <span className={cssStyles.dashboardMeta} title="Time of last sensor data refresh">
                        {lastUpdated ? `Last refresh ${timeAgo(lastUpdated)}` : 'Last refresh —'}
                    </span>
                </div>
                <div>
                    <Dashboard
                        data={latestReadings}
                        nextForecast={nextForecasts}
                    />
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
                    <div className={cssStyles.optimizationHeader}>
                        <Text variant="heading" style={{ margin: 0 }}>
                            Optimization
                        </Text>
                        <Link to="/allocations" className={cssStyles.optimizationLink} title="Go to Allocations to run optimization">
                            Run optimization →
                        </Link>
                    </div>
                    <p className={cssStyles.optimizationSubtitle}>
                        Latest selected solution compared with previous
                    </p>
                    <OptimizationTrendsCard history={optimizationHistory} loading={optimizationLoading} />
                </Section>
            </div>
        </div>
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
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    trends: {
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    },
    optimization: {
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
    }
}
