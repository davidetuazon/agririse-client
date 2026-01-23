import React from "react";
import Text from "./Text";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

type Props = {
    style?: React.CSSProperties,
    textStyle?: React.CSSProperties,
    textProps?: any,
    error?: any,
}

export default function TextInput(props: Props) {

    return (
        <>
            <div
                style={ Object.assign({}, styles.container, props.error ? styles.errorContainer : {}, props.style) }
            >
                <input
                    style={ Object.assign({}, styles.textInput, props.textStyle) }
                    {...props.textProps}
                />
            </div>
            { props.error &&
                <Text
                    variant="subtitle"
                    style={styles.errorLabel}
                >
                    *{props.error}
                </Text>
            }
        </>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        backgroundColor: colors.secondary,
        border: `2px solid ${colors.border}`,
        borderRadius: 'clamp(0.5rem, 1vw, 0.75rem)',
        paddingLeft: 'clamp(0.75rem, 2vw, 0.9375rem)',
        paddingRight: 'clamp(0.75rem, 2vw, 0.9375rem)',
        minHeight: '44px', // Ensure touch target is at least 44px
        height: 'auto',
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.625rem)',
        marginTop: 'clamp(0.5rem, 1.5vw, 0.625rem)',
        boxSizing: 'border-box',
        width: '100%',
    },
    errorContainer: {
        border: `2px solid ${colors.error}`,
    },
    textInput: {
        border: 'none',
        backgroundColor: 'transparent',
        width: '100%',
        outline: 'none',
        minHeight: '44px',
        height: 'inherit',
        fontFamily: 'Poppins-Light',
        fontSize: typography.subtitle,
        color: colors.textBlack,
        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) 0',
        boxSizing: 'border-box',
    },
    errorLabel: {
        marginTop: 'clamp(0.5rem, 1.5vw, 0.625rem)',
        color: colors.error,
        fontSize: typography.caption,
        wordBreak: 'break-word',
    }
}