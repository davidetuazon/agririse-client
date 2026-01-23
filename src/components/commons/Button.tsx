import React from "react";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

type Props = {
    style?: React.CSSProperties,
    title: string | string,
    titleStyle?: React.CSSProperties,
    onButtonPress?: () => void,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    disabled?: boolean,
}

export default function Button(props: Props & { type?: 'button' | 'submit' }) {
    const {
        style,
        title,
        titleStyle,
        onButtonPress,
        onMouseEnter,
        onMouseLeave,
        type = 'button',
        disabled = false,
    } = props;

    return (
        <button
            type={type}
            style={ Object.assign({}, styles.container, style, props.disabled && styles.disabled) }
            onClick={onButtonPress}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <p
                style={ Object.assign({}, styles.title, titleStyle) }
            >
                {title}
            </p>
        </button>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        border: 'none',
        backgroundColor: colors.waterPrimary,
        borderRadius: 'clamp(0.5rem, 1vw, 0.75rem)',
        padding: 'clamp(0.625rem, 2vw, 1.25rem)',
        margin: 'clamp(0.375rem, 1vw, 0.625rem)',
        cursor: 'pointer',
        width: 'auto',
        minWidth: 'max(70px, 44px)', // Ensure touch target is at least 44px
        minHeight: '44px', // Ensure touch target is at least 44px
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, transform 0.1s',
    },
    title: {
        margin: 0,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        color: colors.textPrimary,
        fontSize: typography.subtitle,
        whiteSpace: 'nowrap',
    },
    disabled: {
        pointerEvents: 'none',
        backgroundColor: colors.border,
        opacity: 0.6,
    }
}