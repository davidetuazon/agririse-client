import React from "react";
import colors from "../../constants/colors";

import Text from "./Text";

type Props = {
    style?: React.CSSProperties,
    textStyle?: React.CSSProperties,
    label: any,
    value: any,
    unit?: any,
    recordedAt?: any,
}

export default function Cards(props: Props) {
    const date = props.recordedAt
        ? `${new Date(props.recordedAt).toISOString().replace('T', ' ').slice(0,19)} UTC`
        : null;

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
            </div>
            <div>
                <Text 
                    variant='heading'
                    style={{
                        margin: 5,
                        padding: '5px 0px',
                    }}
                >
                    {props.value?.toFixed(2)}{props.unit}
                </Text>
            </div>
            <div>
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
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        border: `2px solid ${colors.secondaryBackground}`,
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        borderRadius: 'clamp(0.75rem, 2vw, 1.125rem)',
        width: '100%',
        minWidth: 0, // Prevent flex item overflow
        boxSizing: 'border-box',
    }
}