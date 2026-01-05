import React from "react";
import typography from "../../constants/typography";


type Props = {
    style?: React.CSSProperties,
    textStyle?: React.CSSProperties,
    children: any,
    variant: 'heading' | 'title' | 'subtitle' | 'caption' | '',
};

export default function Text(props: Props) {
    const {
        style,
        textStyle,
        children,
        variant = 'text'
    } = props;

    const getVariantStyle = () => {
        switch(variant) {
            case 'heading':
                return styles.heading;
            case 'title':
                return styles.title;
            case 'subtitle':
                return styles.subtitle;
            case 'caption':
                return styles.caption;
        }
    }

    return (
        <div style={styles.container}>
            <p style={ Object.assign({}, getVariantStyle(), style, textStyle) }>
                {children}
            </p>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    container: {
        // border: '1px solid red',
    },
    heading: {
        fontSize: typography.heading,
        fontFamily: 'Poppins-SemiBold',
    },
    title: {
        fontSize: typography.title,
        fontFamily: 'Poppins-SemiBold',
    },
    subtitle: {
        fontSize: typography.subtitle,
        fontFamily: 'Poppins-SemiBold',
    },
    caption: {
        fontSize: typography.caption,
        fontFamily: 'Poppins-SemiBold',
    },
}