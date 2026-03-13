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
 * @param {boolean} props.isFavorite
 * @param {Function} props.onPress 
 * @param {number} props.size 
 * @param {string} props.color 
 * @param {Object} props.style 
 * @param {boolean} props.disabled 
 * @param {boolean} props.animated 
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

  useEffect(() => {
    favoriteState.value = isFavorite ? 1 : 0;
  }, [isFavorite]);

  useEffect(() => {
    if (animated) {
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
    
    favoriteState.value = favoriteState.value === 1 ? 0 : 1;
    
    scale.value = withSequence(
      withSpring(1.4, { damping: 8 }),
      withSpring(1)
    );
    
    rotation.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 0 })
    );

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