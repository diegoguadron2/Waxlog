import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';

// Colores pastel para calificaciones
const getRatingColor = (rating) => {
  if (!rating) return '#4B5563';
  const roundedRating = Math.round(rating);
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  return colors[Math.min(9, Math.max(0, roundedRating - 1))];
};

// Componente de animación al presionar integrado
const PressAnimation = ({ children, onPress }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity,
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Componente principal AlbumCard
const AlbumCard = ({ 
  album, 
  viewMode, 
  activeTab, 
  onPress,
  cardWidth,
}) => {
  const showRating = activeTab === 'listened' && album.average_rating > 0;
  const ratingColor = showRating ? getRatingColor(album.average_rating) : '#4B5563';
  const coverSource = album.cover_local || album.cover;

  // Animación de entrada
  const fadeAnim = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Renderizado para vista grid
  if (viewMode === 'grid') {
    return (
      <Animated.View style={[animatedStyle, { width: cardWidth }]}>
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
    <Animated.View style={animatedStyle}>
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
};

// Los estilos se mantienen igual
const styles = StyleSheet.create({
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