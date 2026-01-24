import React from "react";
import Text from "../Text";
import cssStyles from "./PageHeader.module.css";

type Props = {
    title: string;
    chipLabel?: string;
    chipValue?: string;
    subtitle?: string;
};

export default function PageHeader(props: Props) {
    const { title, chipLabel, chipValue, subtitle } = props;
    const showChip = Boolean(chipValue);

    return (
        <section className={cssStyles.container}>
            <div className={cssStyles.titleRow}>
                <Text variant="heading" style={{ margin: 0 }}>
                    {title}
                </Text>
                {showChip && (
                    <span className={cssStyles.chip}>
                        {chipLabel && (
                            <span className={cssStyles.chipLabel}>{chipLabel}:</span>
                        )}
                        <span className={cssStyles.chipValue}>{chipValue}</span>
                    </span>
                )}
            </div>
            {subtitle && (
                <span className={cssStyles.subtitle}>
                    {subtitle}
                </span>
            )}
        </section>
    );
}
