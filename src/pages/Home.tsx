import React, { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import colors from "../constants/colors";

import Text from "../components/commons/Text";
import Dashboard from "../components/home/Dashboard";
import { latest, me } from "../services/api";
import Sidebar from "../components/home/Sidebar";


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
    const { user, setUser } = useAuth();

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
        <div style={styles.root}>
            <div style={styles.leftBody}>
                <Sidebar />
            </div>
            <div style={styles.rightBody}>
                <header style={styles.header}>
                    <div
                        style={styles.headerLeft}
                    >
                        <Text
                            variant="subtitle"
                            style={{ margin: 5, color: colors.primary }}
                        >
                            {user?.fullName}
                        </Text>
                    </div>
                    <div
                        style={styles.headerRight}
                    >
                        <p>user icon / logout</p>
                    </div>
                </header>
                <main
                    style={styles.main}
                >
                    <div>
                        <Text
                            variant="heading"
                            style={{ margin: 5 }}
                        >
                            {locality?.city} Overview
                        </Text>
                    </div>
                    {/* Dashboard */}
                    <section style={styles.dashboard}>
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
                    </section>

                    {/* 
                        TODO:
                        > can separate this section into 2 components
                        > separate concerns for trends and optimization 
                    */}
                    <section style={styles.core}>
                        <div style={styles.trends}>
                            <Text
                                variant="heading"
                            >
                                Trends
                            </Text>
                        </div>
                        <div style={styles.optimization}>
                            <Text
                                variant="heading"
                            >
                                Optimization
                            </Text>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100dvh',
        width: '100%',
        overflow: 'hidden'
    },
    leftBody: {
        width: '15%',
        backgroundColor: colors.mutedBackground,
        borderRight: `1px solid ${colors.border}`,
    },
    rightBody: {
        // border: '1px solid red',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
    },
    header: {
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0px 20px',
        position: 'sticky',
        top: 0,
        height: '50px',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    main: {
        // border: '1px solid red',
        display: 'flex',
        flex: 1,
        padding: 20,
        gap: 20,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
    },
    dashboard: {
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        display: 'flex',
        width: '100%',
        padding: '20px 0px',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    core: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        gap: 20,
    },
    trends: {
        flex: 1,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        padding: '0px 20px',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    optimization: {
        flex: 1,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        padding: '0px 20px',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        height: '1000px'
    }
}