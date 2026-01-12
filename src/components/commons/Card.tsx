import React from "react";
import colors from "../../constants/colors";

import Text from "./Text";

type Props = {
    style?: React.CSSProperties,
    textStyle?: React.CSSProperties,
    label: string,
    value: any,
    unit?: any,
    recordedAt?: any,
}

export default function Cards(props: Props) {
    const date = props.recordedAt ? new Date(props.recordedAt).toLocaleString() : null;

    return (
        <div style={ Object.assign({}, styles.container, props.style) }>
            <div>
                <Text
                    variant="subtitle"
                    style={{
                        margin: 5,
                    }}
                >
                    {props.label}
                </Text>
                <Text 
                    variant='caption'
                    style={{
                        margin: 5,
                        color: colors.primary
                    }}
                >
                    {date}
                </Text>
            </div>
            <div>
                <Text 
                    variant='title'
                    style={{
                        margin: 5,
                        paddingTop: 5,
                    }}
                >
                    {props.value?.toFixed(2)}{props.unit}
                </Text>
            </div>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        border: `2px solid ${colors.secondaryBackground}`,
        padding: 20,
        borderRadius: '18px',
        width: '100%'
    }
}