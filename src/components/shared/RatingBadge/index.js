// components/shared/RatingBadge/index.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Colores pastel del 1 al 10
const RATING_COLORS = [
  '#fc3a3a', // 1 - Rojo
  '#f56c45', // 2 - Rojo-naranja
  '#ffa457', // 3 - Naranja
  '#ffcb52', // 4 - Amarillo-naranja
  '#faed52', // 5 - Amarillo
  '#e1ff47', // 6 - Amarillo-verde
  '#b1fa6b', // 7 - Verde claro
  '#6ad46a', // 8 - Verde
  '#3ecf3e', // 9 - Verde intenso
  '#28bf28', // 10 - Verde oscuro
];

/**
 * Obtiene el color correspondiente a una calificación
 * @param {number} rating - Calificación (1-10)
 * @returns {string} Color en hexadecimal
 */
export const getRatingColor = (rating) => {
  if (!rating) return '#9CA3AF'; // Gris por defecto
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return RATING_COLORS[index];
};

/**
 * Obtiene el color para calificaciones con decimales
 * @param {number} rating - Calificación con decimal
 * @returns {string} Color en hexadecimal
 */
export const getDecimalColor = (rating) => {
  if (!rating) return '#9CA3AF';
  return getRatingColor(Math.floor(rating));
};

/**
 * Formatea una calificación para mostrar
 * @param {number} rating - Calificación
 * @returns {string} Calificación formateada
 */
export const formatRating = (rating) => {
  if (!rating || rating === 0) return '-';
  if (rating === 10) return '10';
  return rating.toFixed(1);
};

/**
 * Componente RatingBadge
 * 
 * @param {Object} props
 * @param {number} props.rating - Calificación (1-10)
 * @param {string} props.size - Tamaño del badge ('small' | 'medium' | 'large')
 * @param {boolean} props.showBackground - Mostrar fondo con opacidad
 * @param {Object} props.style - Estilos adicionales para el contenedor
 * @param {Object} props.textStyle - Estilos adicionales para el texto
 */
const RatingBadge = ({ 
  rating, 
  size = 'medium',
  showBackground = true,
  style,
  textStyle,
}) => {
  const color = getDecimalColor(rating);
  const formattedRating = formatRating(rating);

  // Tamaños predefinidos
  const sizes = {
    small: {
      container: styles.smallContainer,
      text: styles.smallText,
    },
    medium: {
      container: styles.mediumContainer,
      text: styles.mediumText,
    },
    large: {
      container: styles.largeContainer,
      text: styles.largeText,
    },
  };

  const selectedSize = sizes[size] || sizes.medium;

  return (
    <View
      style={[
        styles.baseContainer,
        selectedSize.container,
        showBackground && { backgroundColor: color + '20' }, // 20 = 12% opacidad
        !showBackground && { backgroundColor: 'transparent' },
        style,
      ]}
    >
      <Text style={[selectedSize.text, { color }, textStyle]}>
        {formattedRating}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 30,
  },
  smallText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Medium
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
  },
  mediumText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Large
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
  },
  largeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RatingBadge;