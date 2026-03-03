// components/shared/FavoriteStar/index.js
import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente FavoriteStar con Reanimated
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
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const favoriteState = useSharedValue(isFavorite ? 1 : 0);

  // Sincronizar estado cuando cambia externamente
  useEffect(() => {
    favoriteState.value = isFavorite ? 1 : 0;
  }, [isFavorite]);

  useEffect(() => {
    if (animated) {
      // Secuencia de animación cuando cambia el estado
      scale.value = withSequence(
        withSpring(1.3, { damping: 10 }),
        withSpring(1)
      );
      
      rotation.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 0 })
      );
    }
  }, [isFavorite]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotation.value,
      [0, 1],
      [0, 360]
    );

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate}deg` }
      ],
    };
  });

  const handlePress = () => {
    if (disabled) return;
    
    // Cambiar estado local para animación inmediata
    favoriteState.value = favoriteState.value === 1 ? 0 : 1;
    
    // Animar
    scale.value = withSequence(
      withSpring(1.4, { damping: 8 }),
      withSpring(1)
    );
    
    rotation.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 0 })
    );

    // Llamar al callback después de la animación
    runOnJS(onPress)();
  };

  const iconName = isFavorite ? 'star' : 'star-outline';
  const iconColor = isFavorite ? color : 'rgba(255,255,255,0.5)';

  if (disabled) {
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <Ionicons name={iconName} size={size} color={iconColor} />
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name={iconName} size={size} color={iconColor} />
      </Animated.View>
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