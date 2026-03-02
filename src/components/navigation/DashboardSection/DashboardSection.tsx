import React from "react";
import colors from "../../../constants/colors";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

import Text from "../../commons/Text";

type Props = {
    style?: React.CSSProperties,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onClick?: () => void,
}

export default function DashboardSection(props: Props) {

    return (
        <Link
            to={'/home'}
            style={Object.assign({}, props.style)}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={props.onClick}
        >
            <span style={styles.itemContent}>
                <LayoutDashboard size={18} color={colors.primary} />
                <Text
                    variant="subtitle"
                    style={styles.label}
                >
                    Dashboard
                </Text>
            </span>
        </Link>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    itemContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
    },
    label: {
        color: colors.primary,
        margin: 0,
    },
}
