import React, { type ReactNode, useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import colors from "../../constants/colors";

import Text from "../commons/Text";
import Sidebar from "../navigation/Sidebar";
import "./AppLayout.css";

interface Props {
    children: ReactNode
}

export default function AppLayout({ children}: Props) {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 768);
            // On desktop, keep sidebar open; on mobile, respect state
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div style={styles.root}>
            
            {/* sidebar / navigation */}
            <aside 
                style={styles.sidebar}
                className={`sidebar ${isDesktop || sidebarOpen ? 'open' : ''}`}
            >
                <Sidebar onLinkClick={() => !isDesktop && setSidebarOpen(false)} />
            </aside>
            
            {/* overlay for mobile when sidebar is open */}
            {sidebarOpen && !isDesktop && (
                <div 
                    className="overlay"
                    style={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* main content & header */}
            <div style={styles.content}>
                <header style={styles.header}>
                    {/* Mobile menu button */}
                    <button
                        className="menu-button"
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
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'relative',
    },
    sidebar: {
        backgroundColor: colors.mutedBackground,
        borderRight: `1px solid ${colors.border}`,
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
    },
}
