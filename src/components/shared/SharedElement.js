import React, { forwardRef, useEffect } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSharedElement } from '../../context/SharedElementContext';

const SharedElement = forwardRef(({ id, children, style, ...props }, ref) => {
  const { registerElement, unregisterElement } = useSharedElement();
  const animatedValue = useSharedValue(1);

  useEffect(() => {
    if (id) {
      registerElement(id, ref || { current: null }, animatedValue);
      return () => unregisterElement(id);
    }
  }, [id]);

  return (
    <Animated.View
      ref={ref}
      style={style} 
      sharedTransitionTag={id}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

export default SharedElement;