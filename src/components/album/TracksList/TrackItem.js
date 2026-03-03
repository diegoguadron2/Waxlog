// components/album/TracksList/TrackItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRatingColor, formatRating } from '../../shared/RatingBadge'; // 👈 Importar solo las funciones, no el componente

/**
 * Componente TrackItem
 * Representa una canción individual en la lista
 * 
 * @param {Object} props
 * @param {Object} props.track - Datos de la canción
 * @param {number} props.index - Índice en la lista (para track_number)
 * @param {boolean} props.isSaved - Si el álbum está guardado
 * @param {boolean} props.isExpanded - Si el comentario está expandido
 * @param {Function} props.onPress - Función al presionar la canción
 * @param {Function} props.onToggleComment - Función para expandir/colapsar comentario
 */
const TrackItem = ({ track, index, isSaved, isExpanded, onPress, onToggleComment }) => {
  const trackNumber = track.track_number || index + 1;

  const handlePress = () => {
    if (isSaved) {
      onPress(track.id);
    }
  };

  const handleCommentPress = (e) => {
    e.stopPropagation();
    onToggleComment(track.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isSaved}
      style={styles.container}
    >
      <Text style={styles.trackNumber}>
        {trackNumber}
      </Text>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        
        {track.comment && (
          <TouchableOpacity
            onPress={handleCommentPress}
            activeOpacity={0.7}
          >
            <Text
              style={styles.comment}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {track.comment}
            </Text>
            {!isExpanded && track.comment.length > 50 && (
              <Text style={styles.moreText}>
                Ver más...
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {track.rating ? (
        <View style={styles.ratingContainer}>
          <Text style={[styles.ratingText, { color: getRatingColor(track.rating) }]}>
            {formatRating(track.rating)}
          </Text>
        </View>
      ) : (
        <Ionicons 
          name="star-outline" 
          size={20} 
          color="rgba(255,255,255,0.3)" 
          style={styles.starIcon}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trackNumber: {
    color: 'rgba(255,255,255,0.5)',
    width: 35,
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  comment: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  moreText: {
    color: '#9333EA',
    fontSize: 10,
    marginTop: 2,
  },
  ratingContainer: {
    marginRight: 8,
    minWidth: 35,
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  starIcon: {
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default TrackItem;