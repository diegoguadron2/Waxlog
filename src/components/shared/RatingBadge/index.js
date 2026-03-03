// shared/RatingBadge/index.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Colores para calificaciones (enteras)
export const getRatingColor = (rating) => {
  if (!rating) return '#9CA3AF';
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return colors[index];
};

// Colores para decimales (más suaves)
export const getDecimalColor = (rating) => {
  if (!rating) return '#9CA3AF';
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return colors[index];
};

// Formatear calificación
export const formatRating = (rating) => {
  if (!rating) return '0.0';
  if (rating === 10) return '10';
  return rating.toFixed(1);
};

/**
 * Componente RatingBadge
 * Muestra la calificación en un badge circular con estilo elegante
 * 
 * @param {Object} props
 * @param {number} props.rating - Calificación (1-10)
 * @param {string} props.size - Tamaño: 'small', 'medium', 'large'
 * @param {boolean} props.showBackground - Mostrar fondo
 * @param {Object} props.style - Estilos adicionales
 * @param {Object} props.textStyle - Estilos adicionales para el texto
 */
const RatingBadge = ({ 
  rating, 
  size = 'medium', 
  showBackground = true,
  style,
  textStyle 
}) => {
  const color = getRatingColor(rating);
  const formattedRating = formatRating(rating);
  
  // Separar parte entera y decimal
  const [integer, decimal] = formattedRating.split('.');
  
  // Definir tamaños según prop size
  const getSize = () => {
    switch(size) {
      case 'small':
        return {
          container: 40,
          integerSize: 16,
          decimalSize: 10,
        };
      case 'large':
        return {
          container: 70,
          integerSize: 28,
          decimalSize: 16,
        };
      default: // medium
        return {
          container: 50,
          integerSize: 20,
          decimalSize: 12,
        };
    }
  };

  const dimensions = getSize();

  return (
    <View style={[
      styles.container,
      showBackground && { backgroundColor: color + '15' },
      { 
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        borderColor: color,
      },
      style
    ]}>
      <View style={styles.ratingContainer}>
        <Text style={[
          styles.integer,
          { color, fontSize: dimensions.integerSize },
          textStyle
        ]}>
          {integer}
        </Text>
        {decimal && decimal !== '0' && (
          <Text style={[
            styles.decimal,
            { color, fontSize: dimensions.decimalSize },
            textStyle
          ]}>
            .{decimal}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  integer: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  decimal: {
    fontWeight: '600',
    marginLeft: 1,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default RatingBadge;