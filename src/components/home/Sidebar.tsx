import React, { useState } from "react";
import colors from "../../constants/colors";

import Text from "../commons/Text";

export default function Sidebar() {
    const [isHovered, setIsHovered] = useState<any | null>(null);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <Text
                    variant="title"
                    style={{
                        margin: 5,
                        color: colors.primary,
                    }}
                >
                    AgriRise
                </Text>
            </header>
            <main style={styles.main}>
                {/* 
                    TODO:
                    > can break these 2 sections into components
                    > handle querying for history and analytics per sensor type in those components
                */}
                <section style={styles.sections}>
                    <div
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'allocations' ? colors.textSecondary : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('allocations')}
                        onMouseLeave={() => setIsHovered(null)}
                    >
                        <Text
                            variant="subtitle"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            Allocations
                        </Text>
                    </div>
                </section>
                <section style={styles.sections}>
                    <div
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'analytics' ? colors.textSecondary : colors.mutedBackground,
                        }}
                        onMouseEnter={() => setIsHovered('analytics')}
                        onMouseLeave={() => setIsHovered(null)}
                    >
                        <Text
                            variant="subtitle"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            Analytics
                        </Text>
                    </div>
                </section>
                <section style={styles.sections}>
                    <div
                        style={{
                            ...styles.sectionCategory,
                            backgroundColor: isHovered === 'history' ? colors.textSecondary : colors.mutedBackground,
                            
                        }}
                        onMouseEnter={() => setIsHovered('history')}
                        onMouseLeave={() => setIsHovered(null)}
                    >
                        <Text
                            variant="subtitle"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            History
                        </Text>
                    </div>
                </section>
            </main>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        // border: '1px solid red',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        // height: '100%',
    },
    header: {
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50px',
    },
    main: {
        // border: '1px solid red',
    },
    sections: {
        display: 'flex',
        flexDirection: 'column',
    },
    sectionCategory: {
        padding: '0px 20px',
        cursor: 'pointer',
    },
}