import React, { useState } from "react";
import colors from "../../constants/colors";
import { Link, useLocation } from "react-router-dom";

import Text from "../commons/Text";

type Props = {
    style?: React.CSSProperties,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onLinkClick?: () => void,
}

type SensorType = 'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature' | 'default';

export default function HistorySection(props: Props) {
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isHovered, setIsHovered] = useState<SensorType>('default');

    const location = useLocation();
        const isActive = (
                routePrefix: string,
                sensorType: SensorType
        ) => {
            if (!location.pathname.startsWith(routePrefix)) return false;
    
            return (
                new URLSearchParams(location.search).get('sensorType') === sensorType
            );
        };

    const sensors: { label: string, type: SensorType }[] = [
        { label: 'Dam Water Level', type: 'damWaterLevel' },
        { label: 'Humidity', type: 'humidity' },
        { label: 'Effective Rainfall', type: 'rainfall' },
        { label: 'Temperature', type: 'temperature' }
    ];

    const historyUrl = (sensorType: SensorType, defaultDays = 30, limit: number = 20) => {
        const end = new Date();
        const start = new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);

        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        return `/iot/history?sensorType=${sensorType}&startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
    }

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
            { sensors.map(({ label, type }) => {
                const active = isActive('/iot/history', type);
                const hovered = isHovered === type;

                return (
                    <Link
                        key={type}
                        to={historyUrl(type)}
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={() => setIsHovered(type)}
                        onMouseLeave={() => setIsHovered('default')}
                        onClick={props.onLinkClick}
                    >
                        <Text
                            variant="caption"
                            style={{
                                ...styles.category,
                                backgroundColor: hovered
                                    ? colors.textSecondary
                                    : active
                                    ? colors.accentTwo
                                    : colors.mutedBackground,
                            }}
                        >
                            {label}
                        </Text>
                    </Link>
                );
            }) }
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
        padding: '10px 30px',
        color: colors.primaryBackground,
    }
}