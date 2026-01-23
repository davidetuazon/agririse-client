import React, { useState } from "react";
import colors from "../../constants/colors";
import { Link, useLocation } from "react-router-dom";

import Text from "../commons/Text";
import DashboardSection from "./DashboardSection";
import AllocationsSection from "./AllocationsSection";
import AnalyticsSection from "./AnalyticsSection";
import HistorySection from "./HistorySection";

type PageOptions = 'dashboard' | 'allocations' | 'analytics' | 'history' | 'default';

interface SidebarProps {
    onLinkClick?: () => void;
}

export default function Sidebar({ onLinkClick }: SidebarProps) {
    const [isHovered, setIsHovered] = useState<any | null>(null);

    const location = useLocation();
    const activePage: PageOptions = (() => {
        if (location.pathname.startsWith('/home')) return 'dashboard';
        if (location.pathname.startsWith('/allocations')) return 'allocations';
        if (location.pathname.startsWith('/iot/analytics')) return 'analytics';
        if (location.pathname.startsWith('/iot/history')) return 'history';
        
        return 'default';
    })();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <Link
                    to={'/home'}
                    style={{ textDecoration: 'none' }}
                >
                    <Text
                        variant="title"
                        style={{
                            margin: 5,
                            color: colors.primary,
                        }}
                    >
                        AgriRise
                    </Text>
                </Link>
            </header>
            <main style={styles.main}>
                <section style={styles.sections}>
                    <DashboardSection
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'dashboard'
                                ? colors.textSecondary
                                : activePage === 'dashboard'
                                ? colors.accentTwo
                                : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('dashboard')}
                        onMouseLeave={() => setIsHovered(null)}
                        onClick={onLinkClick}
                    />
                </section>
                <section style={styles.sections}>
                    <AllocationsSection
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'allocations'
                                ? colors.textSecondary
                                : activePage === 'allocations'
                                ? colors.accentTwo
                                : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('allocations')}
                        onMouseLeave={() => setIsHovered(null)}
                        onClick={onLinkClick}
                    />
                </section>
                <section style={styles.sections}>
                    <AnalyticsSection
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'analytics'
                                ? colors.textSecondary
                                : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('analytics')}
                        onMouseLeave={() => setIsHovered(null)}
                        onLinkClick={onLinkClick}
                    />
                </section>
                <section style={styles.sections}>
                    <HistorySection
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'history'
                                ? colors.textSecondary
                                : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('history')}
                        onMouseLeave={() => setIsHovered(null)}
                        onLinkClick={onLinkClick}
                    />
                </section>
            </main>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: 'fit-content',
        width: '100%',
        minWidth: 0,
    },
    header: {
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50px',
        height: 'auto',
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
    },
    main: {
        width: '100%',
    },
    sections: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    sectionCategory: {
        padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.25rem)`,
        cursor: 'pointer',
        textDecoration: 'none',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
    },
}