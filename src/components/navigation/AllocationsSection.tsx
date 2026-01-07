import React from "react";
import colors from "../../constants/colors";

import Text from "../commons/Text";

type Props = {
    style?: React.CSSProperties,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onClick?: () => void,
}

export default function AllocationsSection(props: Props) {

    return (
        <div
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
                Allocations
            </Text>
        </div>
    )
}