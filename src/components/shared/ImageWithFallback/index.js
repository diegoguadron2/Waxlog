// components/shared/ImageWithFallback/index.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const ImageWithFallback = ({
  source,
  style,
  contentFit = 'cover',
  transition = 300,
  recyclingKey,
  skeleton,
  fallback,
  onLoad,
  onError,
  showLoading = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 👇 NUEVO: Verificar si la imagen ya está en caché
  useEffect(() => {
    const checkCache = async () => {
      if (!source) return;
      
      try {
        // Intentar obtener el estado de la imagen del caché
        const isCached = await Image.getCachePathAsync?.(source);
        if (isCached) {
          // Si está en caché, asumimos que cargará rápido
          setIsLoading(false);
        }
      } catch (e) {
        // Ignorar errores de verificación de caché
      }
    };
    
    checkCache();
  }, [source]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error) => {
    console.log('Error cargando imagen:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  // Skeleton por defecto
  const defaultSkeleton = (
    <View style={[styles.skeleton, style]} />
  );

  // Fallback por defecto
  const defaultFallback = (
    <View style={[styles.fallback, style]}>
      <Ionicons name="image-outline" size={30} color="rgba(255,255,255,0.3)" />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Imagen principal */}
      {source && !hasError && (
        <Image
          source={{ uri: source }}
          style={[styles.image, style]}
          contentFit={contentFit}
          transition={transition}
          recyclingKey={recyclingKey}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Skeleton mientras carga - SOLO si no está en caché */}
      {isLoading && !hasError && (
        <View style={StyleSheet.absoluteFillObject}>
          {skeleton || defaultSkeleton}
        </View>
      )}

      {/* Indicador de carga opcional */}
      {isLoading && showLoading && !hasError && (
        <View style={[styles.loadingOverlay, style]}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* Fallback en caso de error o sin source */}
      {(hasError || !source) && (
        <View style={StyleSheet.absoluteFillObject}>
          {fallback || defaultFallback}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default ImageWithFallback;