import React from 'react';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

/**
 * Componente BlurView reutilizable
 * 
 * @param {Object} props
 * @param {number} props.intensity 
 * @param {string} props.tint 
 * @param {Object} props.style 
 * @param {React.ReactNode} props.children 
 */
const BlurView = ({
    intensity = 50,
    tint = 'dark',
    style,
    children,
    ...props
}) => {
    return (
        <ExpoBlurView
            intensity={intensity}
            tint={tint}
            style={[styles.default, style]}
            {...props}
        >
            {children}
        </ExpoBlurView>
    );
};

const styles = StyleSheet.create({
    default: {
        flex: 1,
    },
});

export default BlurView;