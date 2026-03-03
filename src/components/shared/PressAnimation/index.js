// components/shared/PressAnimation/index.js
import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Animated,
} from 'react-native';

/**
 * Componente de animación al presionar
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a animar
 * @param {Function} props.onPress - Función al presionar
 * @param {number} props.scaleTo - Escala al presionar (default: 0.95)
 * @param {number} props.opacityTo - Opacidad al presionar (default: 0.8)
 * @param {Object} props.style - Estilos adicionales para el Animated.View
 * @param {boolean} props.disabled - Deshabilitar animación
 */
const PressAnimation = ({
    children,
    onPress,
    scaleTo = 0.95,
    opacityTo = 0.8,
    style,
    disabled = false,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: scaleTo,
                useNativeDriver: true,
                speed: 50,
            }),
            Animated.timing(opacityAnim, {
                toValue: opacityTo,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        if (disabled) return;

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <Animated.View
            style={[
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                },
                style,
            ]}
        >
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                activeOpacity={1}
                disabled={disabled}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default PressAnimation;