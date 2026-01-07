import React, { useState } from "react";
import colors from "../../constants/colors";

import Text from "../commons/Text";

type Props = {
    style?: React.CSSProperties,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void;
}

export default function AnalyticsSection(props: Props) {
    const [isVisible, setIsVisible] = useState<boolean>(true);

    return (
        <>
        <div
            style={Object.assign({}, props.style)}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={() => setIsVisible(prev => !prev)}
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
        <div
            style={{
                ...styles.subSection,
                maxHeight: isVisible ? '200px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'max-height',
            }}
        >
        {/* <div
            style={{
                ...styles.subSection,
                maxHeight: isVisible ? '220px' : '0px',
                overflow: 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-2px)',
                transition: `
                max-height 420ms cubic-bezier(0.4, 0, 0.2, 1),
                opacity 220ms ease 120ms,
                transform 280ms ease
                `,
                willChange: 'max-height, opacity, transform',
            }}
        > */}
            <Text
                variant="caption"
                style={styles.category}
            >
                Dam Water Level
            </Text>
            <Text
                variant="caption"
                style={styles.category}
            >
                Humidity
            </Text>
            <Text
                variant="caption"
                style={styles.category}
            >
                Effective Rainfall
            </Text>
            <Text
                variant="caption"
                style={styles.category}
            >
                Temperature
            </Text>
        </div>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    subSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    category: {
        fontFamily: 'Poppins-Light',
        cursor: 'pointer',
        margin: 0,
        padding: '5px 30px',
    }
}