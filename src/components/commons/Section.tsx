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
        borderRadius: '18px',
        width: '100%',
        padding: '20px 0px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
}