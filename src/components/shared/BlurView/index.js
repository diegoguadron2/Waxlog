// components/shared/BlurView/index.js
import React from 'react';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

/**
 * Componente BlurView reutilizable
 * 
 * @param {Object} props
 * @param {number} props.intensity - Intensidad del blur (1-100)
 * @param {string} props.tint - Tono del blur ('light', 'dark', 'default')
 * @param {Object} props.style - Estilos adicionales
 * @param {React.ReactNode} props.children - Contenido hijo
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