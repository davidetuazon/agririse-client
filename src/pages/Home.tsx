import React from "react";
import { useAuth } from "../providers/AuthProvider";
import colors from "../constants/colors";

import Text from "../components/commons/Text";

type Props = {
    style?: any,
}

export default function Home(props: Props) {
    const { user } = useAuth();

    return (
        <div style={styles.root}>
            <Text
                variant="heading"
            >
            Welcome
            </Text>
        </div>
    )
}

const styles: {[key: string]: React.CSSProperties} = {
    root: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
    },
}