import React, { useState } from "react";
import colors from "../../../constants/colors";
import { Link, useLocation } from "react-router-dom";
import { Sprout } from "lucide-react";

import DashboardSection from "../DashboardSection";
import AllocationsSection from "../AllocationsSection";
import AnalyticsSection from "../AnalyticsSection";
import HistorySection from "../HistorySection";
import cssStyles from "./Sidebar.module.css";

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
        <div className={cssStyles.container}>
            <Link
                to={'/home'}
                className={cssStyles.brandHeader}
                style={{ textDecoration: 'none' }}
            >
                <span className={cssStyles.brandIcon}>
                    <Sprout size={20} color={colors.primary} />
                </span>
                <span className={cssStyles.brandText}>
                    <span className={cssStyles.brandSubtitle}>Water Allocation</span>
                </span>
            </Link>
            <main style={styles.main}>
                <div className={cssStyles.navGroup}>
                    <div className={cssStyles.navLabel}>Core</div>
                    <section style={styles.sections}>
                        <DashboardSection
                            style={{
                                ...styles.sectionCategory,
                                backgroundColor: isHovered === 'dashboard'
                                    ? colors.waterLight
                                    : activePage === 'dashboard'
                                    ? colors.accentTwo
                                    : 'transparent',
                                borderLeftColor: isHovered === 'dashboard' || activePage === 'dashboard'
                                    ? colors.primary
                                    : 'transparent',
                                borderRightColor: isHovered === 'dashboard' || activePage === 'dashboard'
                                    ? colors.primary
                                    : 'transparent',
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
                                    ? colors.waterLight
                                    : activePage === 'allocations'
                                    ? colors.accentTwo
                                    : 'transparent',
                                borderLeftColor: isHovered === 'allocations' || activePage === 'allocations'
                                    ? colors.primary
                                    : 'transparent',
                                borderRightColor: isHovered === 'allocations' || activePage === 'allocations'
                                    ? colors.primary
                                    : 'transparent',
                            }}
                            onMouseEnter={() => setIsHovered('allocations')}
                            onMouseLeave={() => setIsHovered(null)}
                            onClick={onLinkClick}
                        />
                    </section>
                </div>
                <div className={cssStyles.navGroup}>
                    <div className={cssStyles.navLabel}>Insights</div>
                    <section style={styles.sections}>
                        <AnalyticsSection
                            style={{
                                ...styles.sectionCategory,
                                backgroundColor: isHovered === 'analytics'
                                    ? colors.waterLight
                                    : 'transparent',
                                borderLeftColor: isHovered === 'analytics'
                                    ? colors.primary
                                    : 'transparent',
                                borderRightColor: isHovered === 'analytics'
                                    ? colors.primary
                                    : 'transparent',
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
                                    ? colors.waterLight
                                    : 'transparent',
                                borderLeftColor: isHovered === 'history'
                                    ? colors.primary
                                    : 'transparent',
                                borderRightColor: isHovered === 'history'
                                    ? colors.primary
                                    : 'transparent',
                            }}
                            onMouseEnter={() => setIsHovered('history')}
                            onMouseLeave={() => setIsHovered(null)}
                            onLinkClick={onLinkClick}
                        />
                    </section>
                </div>
            </main>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    main: {
        width: '100%',
        paddingBottom: '1rem',
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
        gap: '0.65rem',
        borderLeft: '3px solid transparent',
        borderRight: '3px solid transparent',
        borderRadius: '10px',
        margin: '0.15rem 0.75rem',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
}
