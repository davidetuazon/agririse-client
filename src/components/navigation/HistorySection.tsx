import React, { useState } from "react";
import colors from "../../constants/colors";

import Text from "../commons/Text";

type Props = {
    style?: React.CSSProperties,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void;
}

export default function HistorySection(props: Props) {
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
                History
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