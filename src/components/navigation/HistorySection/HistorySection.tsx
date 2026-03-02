import React, { useState } from "react";
import colors from "../../../constants/colors";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, CloudRain, Droplets, History, Thermometer, Waves } from "lucide-react";

import Text from "../../commons/Text";

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

    const getSensorIcon = (sensorType: SensorType) => {
        switch (sensorType) {
            case 'damWaterLevel':
                return <Waves size={14} color={colors.primary} />;
            case 'humidity':
                return <Droplets size={14} color={colors.primary} />;
            case 'rainfall':
                return <CloudRain size={14} color={colors.primary} />;
            case 'temperature':
                return <Thermometer size={14} color={colors.primary} />;
            default:
                return null;
        }
    };

    const historyUrl = (sensorType: SensorType) => {
        const params = new URLSearchParams(location.search);
        params.set("sensorType", sensorType);
        if (!params.get("limit")) {
            params.set("limit", "20");
        }
        return `/iot/history?${params.toString()}`;
    };

    return (
        <>
        <div
            style={Object.assign({}, props.style)}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={() => setIsVisible(prev => !prev)}
        >
            <span style={styles.sectionHeader}>
                <span style={styles.sectionHeaderLeft}>
                    <History size={18} color={colors.primary} />
                    <Text
                        variant="subtitle"
                        style={styles.sectionLabel}
                    >
                        History
                    </Text>
                </span>
                {isVisible ? (
                    <ChevronDown size={16} color={colors.primary} style={styles.chevron} />
                ) : (
                    <ChevronUp size={16} color={colors.primary} style={styles.chevron} />
                )}
            </span>
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
                                    ? colors.waterLight
                                    : active
                                    ? colors.accentTwo
                                    : 'transparent',
                            borderColor: hovered || active
                                ? colors.primary
                                : 'transparent',
                            }}
                        >
                            <span style={styles.subItemContent}>
                                {getSensorIcon(type)}
                                {label}
                            </span>
                        </Text>
                    </Link>
                );
            }) }
        </div>
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    sectionHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
    },
    chevron: {
        flexShrink: 0,
    },
    sectionLabel: {
        color: colors.primary,
        margin: 0,
    },
    subSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    category: {
        fontFamily: 'Poppins-Light',
        cursor: 'pointer',
        margin: '0.15rem 1rem',
        padding: '8px 16px',
        color: colors.primaryBackground,
        border: '1px solid transparent',
        borderRadius: '8px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
    },
    subItemContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    }
}
