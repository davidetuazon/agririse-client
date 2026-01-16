import React from "react";
import colors from "../../constants/colors";

type Props = {
    style?: React.CSSProperties,
    children: any,
}

export default function Section({ style, children }: Props) {

    return (
        <section
            style={ Object.assign({}, styles.container, style) }
        >
            {children}
        </section>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        border: `1px solid ${colors.border}`,
        borderRadius: 'clamp(0.75rem, 2vw, 1.125rem)',
        padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(0.75rem, 2vw, 1.25rem)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0, // Prevent flex item overflow
    }
}