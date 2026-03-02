import React from "react";
import colors from "../../../constants/colors";

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
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: 'clamp(0.75rem, 2vw, 1.125rem)',
        padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(0.75rem, 2vw, 1.25rem)',
        boxShadow: '0 8px 24px rgba(6, 182, 212, 0.1), 0 2px 8px rgba(12, 106, 74, 0.06)',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(224, 242, 254, 0.25) 50%, rgba(240, 253, 250, 0.3) 100%)',
    }
}
