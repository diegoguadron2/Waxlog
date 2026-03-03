import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image as RNImage,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

// Colores pastel para calificaciones (podríamos mover esto a utils después)
const getRatingColor = (rating) => {
  if (!rating) return '#4B5563';
  const roundedRating = Math.round(rating);
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  return colors[Math.min(9, Math.max(0, roundedRating - 1))];
};

// Componente de animación al presionar
const PressAnimation = ({ children, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente principal AlbumCard
const AlbumCard = memo(({ 
  album, 
  viewMode, 
  activeTab, 
  onPress,
  cardWidth, // Recibimos el ancho como prop para mantener consistencia
}) => {
  const showRating = activeTab === 'listened' && album.average_rating > 0;
  const ratingColor = showRating ? getRatingColor(album.average_rating) : '#4B5563';
  const coverSource = album.cover_local || album.cover;

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Renderizado para vista grid
  if (viewMode === 'grid') {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }],
          width: cardWidth,
        }}
      >
        <PressAnimation onPress={() => onPress(album)}>
          <View style={[styles.gridCard, showRating && { borderColor: ratingColor, borderWidth: 2 }]}>
            <View style={styles.gridImageContainer}>
              <Image
                source={{ uri: coverSource }}
                style={styles.gridImage}
                contentFit="cover"
                transition={300}
                recyclingKey={`album-${album.id}`}
              />

              {album.is_favorite === 1 && (
                <View style={styles.gridFavoriteBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gridGradient}
              />

              <View style={styles.gridOverlay}>
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {album.title}
                </Text>
                <Text style={styles.gridArtist} numberOfLines={1}>
                  {album.artist_name}
                </Text>
              </View>

              {showRating && (
                <View style={[styles.gridRating, { backgroundColor: ratingColor + '20' }]}>
                  <Text style={[styles.gridRatingText, { color: ratingColor }]}>
                    {album.average_rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </PressAnimation>
      </Animated.View>
    );
  }

  // Renderizado para vista lista
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <PressAnimation onPress={() => onPress(album)}>
        <View style={[
          styles.listCard,
          showRating && { borderColor: ratingColor, borderWidth: 2 }
        ]}>
          <View style={StyleSheet.absoluteFillObject}>
            <RNImage
              source={{ uri: coverSource }}
              style={styles.listCoverBlur}
              blurRadius={20}
            />
            <View style={styles.listCoverOverlay} />
          </View>

          <View style={styles.listContent}>
            <View style={styles.listCoverContainer}>
              <Image
                source={{ uri: coverSource }}
                style={styles.listCoverImage}
                contentFit="cover"
                transition={300}
                recyclingKey={`album-${album.id}`}
              />

              {album.is_favorite === 1 && (
                <View style={styles.listFavoriteBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}
            </View>

            <View style={styles.listInfo}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {album.title}
              </Text>
              <Text style={styles.listArtist} numberOfLines={1}>
                {album.artist_name}
              </Text>
              <View style={styles.listTrackInfo}>
                <Ionicons name="musical-notes" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.listTrackCount}>
                  {album.total_tracks || 0} canciones
                </Text>
              </View>
            </View>

            {showRating && (
              <View style={styles.listRatingContainer}>
                <Text style={[styles.listRatingText, { color: ratingColor }]}>
                  {album.average_rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </PressAnimation>
    </Animated.View>
  );
});

// Estilos (movidos de LibraryScreen)
const styles = StyleSheet.create({
  // Grid styles
  gridCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridFavoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 10,
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  gridTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gridArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gridRating: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  gridRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // List styles
  listCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  listCoverBlur: {
    width: '100%',
    height: '100%',
  },
  listCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  listCoverContainer: {
    position: 'relative',
  },
  listCoverImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  listFavoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  listTrackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTrackCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginLeft: 4,
  },
  listRatingContainer: {
    marginRight: 8,
  },
  listRatingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default AlbumCard;