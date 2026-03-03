// components/shared/FavoriteStar/index.js
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente FavoriteStar reutilizable
 * 
 * @param {Object} props
 * @param {boolean} props.isFavorite - Estado de favorito
 * @param {Function} props.onPress - Función al presionar
 * @param {number} props.size - Tamaño del icono
 * @param {string} props.color - Color del icono (default: '#FFD700')
 * @param {Object} props.style - Estilos adicionales
 * @param {boolean} props.disabled - Deshabilitar interacción
 * @param {boolean} props.animated - Activar animación (default: true)
 */
const FavoriteStar = ({
    isFavorite,
    onPress,
    size = 24,
    color = '#FFD700',
    style,
    disabled = false,
    animated = true,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            // Animación cuando cambia el estado
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scaleAnim, {
                        toValue: 1.3,
                        useNativeDriver: true,
                        speed: 30,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 30,
                }),
            ]).start(() => {
                rotateAnim.setValue(0);
            });
        }
    }, [isFavorite]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handlePress = () => {
        if (disabled) return;
        onPress?.();
    };

    const renderIcon = () => {
        if (animated) {
            return (
                <Animated.View
                    style={{
                        transform: [
                            { scale: scaleAnim },
                            { rotate: rotation },
                        ],
                    }}
                >
                    <Ionicons
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={size}
                        color={isFavorite ? color : 'rgba(255,255,255,0.5)'}
                    />
                </Animated.View>
            );
        }

        return (
            <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={size}
                color={isFavorite ? color : 'rgba(255,255,255,0.5)'}
            />
        );
    };

    if (disabled) {
        return (
            <Animated.View style={[styles.container, style]}>
                {renderIcon()}
            </Animated.View>
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.container, style]}
            activeOpacity={0.7}
        >
            {renderIcon()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default FavoriteStar;