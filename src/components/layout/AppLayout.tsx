import React, { type ReactNode } from "react";
import { useAuth } from "../../providers/AuthProvider";
import colors from "../../constants/colors";

import Text from "../commons/Text";
import Sidebar from "../navigation/Sidebar";

interface Props {
    children: ReactNode
}

export default function AppLayout({ children}: Props) {
    const { user } = useAuth();

    return (
        <div style={styles.root}>
            
            {/* sidebar / navigation */}
            <aside style={styles.sidebar}>
                <Sidebar />
            </aside>
            
            {/* main content & header */}
            <div style={styles.content}>
                <header style={styles.header}>
                    <div
                        style={styles.headerContent}
                    >
                        <Text
                            variant="subtitle"
                            style={{ margin: 5, color: colors.primary }}
                        >
                            {user?.fullName}&nbsp;
                            <span style={{ color: colors.textSecondary }}>
                                / {user?.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                        </Text>
                    </div>

                    {/*
                        TODO:
                        > need separate component to handle logout and user profile
                    */}
                    <div
                        style={styles.headerContent}
                    >
                        <Text variant="caption">
                            user icon / logout icon
                        </Text>
                    </div>
                </header>

                {/* scrollable main/page content */}
                <main
                    style={styles.main}
                >
                    {children}
                </main>
            </div>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    root: {
        display: 'flex',
        height: '100dvh',
        width: '100%',
        overflow: 'hidden'
    },
    sidebar: {
        width: '15%',
        backgroundColor: colors.mutedBackground,
        borderRight: `1px solid ${colors.border}`,
        flexShrink: 0,
    },
    content: {
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
        zIndex: 10,
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
    },
    main: {
        display: 'flex',
        flex: 1,
        padding: 20,
        overflowY: 'auto',
        overflowX: 'hidden',
        flexDirection: 'column',
        gap: 20,
    },
}