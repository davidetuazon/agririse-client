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
        // border: '1px solid #E5E7EB',
        border: 'none',
        backgroundColor: colors.waterPrimary,
        borderRadius: '12px',
        padding: 20,
        margin: 10,
        cursor: 'pointer',
        width: '110px',
        minWidth: '70px',
    },
    title: {
        margin: 0,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        color: colors.textPrimary,
        fontSize: typography.subtitle,
    },
    disabled: {
        pointerEvents: 'none',
        backgroundColor: colors.border,
    }
}