import React, { type ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import colors from "../../../constants/colors";

import Sidebar from "../../navigation/Sidebar";
import UserProfile from "../UserProfile";
import FirstTimeTour from "../../tour/FirstTimeTour";
import cssStyles from "./AppLayout.module.css";

interface Props {
    children: ReactNode
}

export default function AppLayout({ children}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const pageName = (() => {
        if (location.pathname.startsWith('/home')) return 'Dashboard';
        if (location.pathname.startsWith('/allocations')) return 'Allocations';
        if (location.pathname.startsWith('/iot/analytics')) return 'Analytics';
        if (location.pathname.startsWith('/iot/history')) return 'History';
        if (location.pathname.startsWith('/settings')) return 'Settings';
        return 'Overview';
    })();

    return (
        <div style={styles.root}>
            {/* sidebar / navigation */}
            <aside 
                style={styles.sidebar}
                className={`${cssStyles.sidebar} ${isDesktop || sidebarOpen ? cssStyles.open : ''}`}
                data-tour="sidebar"
            >
                <Sidebar onLinkClick={() => !isDesktop && setSidebarOpen(false)} />
            </aside>
            
            {/* overlay for mobile when sidebar is open */}
            {sidebarOpen && !isDesktop && (
                <div 
                    className={cssStyles.overlay}
                    style={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* main content & header */}
            <div style={styles.content}>
                <header style={styles.header} className={cssStyles.header} data-tour="header">
                    <div className={cssStyles.headerLeft}>
                        {/* Mobile menu button */}
                        <button
                            className={cssStyles.menuButton}
                            style={styles.menuButton}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                        </button>
                        <div className={cssStyles.headerTitleGroup}>
                            <span className={cssStyles.headerPage}>{pageName}</span>
                        </div>
                    </div>
                    <div style={styles.headerContent}>
                        <UserProfile />
                    </div>
                </header>

                {/* scrollable main/page content */}
                <main style={styles.main} data-tour="main">
                    {children}
                </main>
            </div>
            <FirstTimeTour />
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    root: {
        display: 'flex',
        height: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'relative',
    },
    sidebar: {
        background: 'linear-gradient(180deg, #f0fdfa 0%, #e0f2fe 50%, #f5f3ff 100%)',
        borderRight: '1px solid rgba(6, 182, 212, 0.25)',
        flexShrink: 0,
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 99,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        width: '100%',
        minWidth: 0, /* Prevent flex item from overflowing */
    },
    header: {
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0px clamp(0.75rem, 2vw, 1.25rem)',
        position: 'sticky',
        top: 0,
        minHeight: '50px',
        height: 'auto',
        zIndex: 10,
        backgroundColor: colors.secondary,
        gap: '1rem',
        flexWrap: 'wrap',
    },
    menuButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        minWidth: '44px',
        minHeight: '44px',
        color: colors.primary,
        borderRadius: '8px',
        transition: 'background-color 0.2s',
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    main: {
        display: 'flex',
        flex: 1,
        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
        overflowY: 'auto',
        overflowX: 'hidden',
        flexDirection: 'column',
        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        width: '100%',
        minWidth: 0,
        background: 'linear-gradient(165deg, #f0fdfa 0%, #e0f2fe 40%, #fefce8 70%, #f5f3ff 100%)',
    },
}
