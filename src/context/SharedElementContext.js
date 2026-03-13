import React, { createContext, useContext, useRef } from 'react';
import Animated from 'react-native-reanimated';

const SharedElementContext = createContext();

export const useSharedElement = () => {
  const context = useContext(SharedElementContext);
  if (!context) {
    throw new Error('useSharedElement debe usarse dentro de SharedElementProvider');
  }
  return context;
};

export const SharedElementProvider = ({ children }) => {
  const elementsRef = useRef(new Map());
  const animatedValues = useRef(new Map());

  const registerElement = (id, ref, animatedValue) => {
    elementsRef.current.set(id, ref);
    if (animatedValue) {
      animatedValues.current.set(id, animatedValue);
    }
  };

  const unregisterElement = (id) => {
    elementsRef.current.delete(id);
    animatedValues.current.delete(id);
  };

  const getElement = (id) => {
    return elementsRef.current.get(id);
  };

  const getAnimatedValue = (id) => {
    return animatedValues.current.get(id);
  };

  return (
    <SharedElementContext.Provider
      value={{
        registerElement,
        unregisterElement,
        getElement,
        getAnimatedValue,
      }}
    >
      {children}
    </SharedElementContext.Provider>
  );
};