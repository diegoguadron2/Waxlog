import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS 
} from 'react-native-reanimated';

/**
 * Componente de animación al presionar con Reanimated
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children 
 * @param {Function} props.onPress 
 * @param {number} props.scaleTo 
 * @param {number} props.opacityTo 
 * @param {Object} props.style 
 * @param {boolean} props.disabled
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(scaleTo, { 
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(opacityTo, { duration: 100 });
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, { 
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPressIn={!disabled ? handlePressIn : undefined}
        onPressOut={!disabled ? handlePressOut : undefined}
        onPress={handlePress}
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