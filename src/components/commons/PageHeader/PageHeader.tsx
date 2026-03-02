import Text from "../Text";
import cssStyles from "./PageHeader.module.css";
import type { ReactNode } from "react";

type Props = {
    title: string;
    chipLabel?: string;
    chipValue?: string;
    subtitle?: string;
    actions?: ReactNode;
};

export default function PageHeader(props: Props) {
    const { title, chipLabel, chipValue, subtitle, actions } = props;
    const showChip = Boolean(chipValue);

    return (
        <section className={cssStyles.container}>
            <div className={cssStyles.titleRow}>
                <div className={cssStyles.titleLeft}>
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
                {actions && (
                    <div className={cssStyles.actions}>
                        {actions}
                    </div>
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
