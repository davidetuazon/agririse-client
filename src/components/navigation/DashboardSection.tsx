import React from "react";
import colors from "../../constants/colors";
import { Link } from "react-router-dom";

import Text from "../commons/Text";

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
            <Text
                variant="subtitle"
                style={{
                    color: colors.primary,
                }}
            >
                Dashboard
            </Text>
        </Link>
    )
}