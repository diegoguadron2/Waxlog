// screens/AlbumScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated, // 👈 IMPORTANTE: Animated de React Native
} from 'react-native';
import ImageColors from 'react-native-image-colors';
import { Image } from 'expo-image';
import { useAlbumData } from '../hooks/useAlbumData';
import { Ionicons } from '@expo/vector-icons';
// Componentes de album
import AlbumHeader from '../components/album/AlbumHeader';
import AlbumComment from '../components/album/AlbumComment';
import TracksList from '../components/album/TracksList';
import AlbumInfo from '../components/album/AlbumInfo';
import RatingModal from '../components/album/RatingModal';
import StateSelector from '../components/album/StateSelector';

const { width, height } = Dimensions.get('window');

const AlbumSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#000' }}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
    <View style={{ width: width, height: height * 0.5, backgroundColor: 'rgba(255,255,255,0.05)' }} />
    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
      <View style={{ width: '70%', height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8 }} />
      <View style={{ width: '40%', height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View style={{ width: 60, height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 12 }} />
        <View style={{ width: 40, height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <View style={{ flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, marginRight: 8 }} />
        <View style={{ flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }} />
      </View>
      {[1, 2, 3, 4, 5].map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
          <View style={{ width: 30, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 8 }} />
          <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 8 }} />
          <View style={{ width: 30, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

export default function AlbumScreen({ route, navigation }) {
  const { album: initialAlbum, artistName, artistId, refresh } = route.params || {};

  const {
    album,
    albumDetails,
    tracks,
    loading,
    refreshing,
    isSaved,
    albumState,
    albumRating,
    albumComment,
    isFavorite,
    dominantColor,
    setDominantColor,
    loadAlbumData,
    saveAlbum,
    updateAlbumState,
    toggleFavorite,
    deleteAlbum,
    saveAlbumComment,
    saveTrackRating,
    refreshAlbumInfo,
    updateAlbum,
    setTracks,
    resolvedArtistId,
  } = useAlbumData(initialAlbum, artistName, artistId);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [tempComment, setTempComment] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [activeInfoTab, setActiveInfoTab] = useState('tracks');
  const [imageLoading, setImageLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  // 👇 VALOR ANIMADO PARA EL SCROLL
  const scrollY = useRef(new Animated.Value(0)).current;

  // 👇 ESTILOS ANIMADOS PARA LA IMAGEN (PARALLAX)
  const imageAnimatedStyle = {
    transform: [
      {
        // Escala: 1 + (desplazamiento negativo * factor)
        scale: scrollY.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: [1.5, 1, 0.8],
          extrapolate: 'clamp',
        }),
      },
      {
        // Desplazamiento vertical: la imagen se mueve más lento que el scroll
        translateY: scrollY.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: [50, 0, -50],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  // 👇 ESTILOS ANIMADOS PARA EL CONTENIDO (OPCIONAL)
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    updateAlbum(initialAlbum || {});
    loadAlbumData();
  }, []);

  useEffect(() => {
    if (refresh) {
      loadAlbumData();
    }
  }, [refresh]);

  useEffect(() => {
    const loadImage = async () => {
      if (album?.cover) {
        const largeUrl = album.cover.includes('/250x250-')
          ? album.cover.replace('/250x250-', '/1000x1000-')
          : album.cover;
        setImageUrl(largeUrl);
        await prefetchAndLoadImage(largeUrl);
      }
    };

    if (album) {
      loadImage();
    }
  }, [album]);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        }
      });
    };
  }, [navigation]);

  // Efecto para animar el contenido cuando la imagen esté lista
  useEffect(() => {
    if (!imageLoading) {
      const timer = setTimeout(() => {
        setContentReady(true);
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [imageLoading]);

  const prefetchAndLoadImage = async (url) => {
    try {
      setImageLoading(true);
      await Image.prefetch(url);
      await new Promise(resolve => setTimeout(resolve, 50));
      if (album) {
        await getImageColors(url);
      }
      setImageLoading(false);
    } catch (error) {
      if (__DEV__) console.error('Error con imagen:', error);
      setImageLoading(false);
    }
  };

  const getImageColors = async (imageUrl) => {
    try {
      const colors = await ImageColors.getColors(imageUrl, {
        fallback: '#000000',
        cache: true,
        key: album?.id?.toString() || 'default',
      });

      switch (colors.platform) {
        case 'android':
          setDominantColor(colors.dominant || colors.vibrant || '#000000');
          break;
        case 'ios':
          setDominantColor(colors.background || colors.primary || '#000000');
          break;
        default:
          setDominantColor('#000000');
      }
    } catch (error) {
      if (__DEV__) console.error('Error obteniendo colores:', error);
      setDominantColor('#000000');
    }
  };

  const handleSaveComment = async (comment) => {
    const success = await saveAlbumComment(comment);
    return success;
  };

  const handleDeleteAlbum = async () => {
    const deleted = await deleteAlbum();
    if (deleted) {
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    }
  };

  const toggleCommentExpansion = (trackId) => {
    setExpandedComments(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  if (loading || imageLoading) {
    return <AlbumSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: dominantColor }}>
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSave={(rating, comment) => saveTrackRating(selectedTrack, rating, comment)}
        currentRating={selectedTrack ? tracks.find(t => t.id === selectedTrack)?.rating : null}
        trackTitle={selectedTrack ? tracks.find(t => t.id === selectedTrack)?.title : ''}
      />

      <StateSelector
        visible={showStateModal}
        onClose={() => setShowStateModal(false)}
        onSelect={updateAlbumState}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDeleteAlbum}
        onRefresh={refreshAlbumInfo}
        currentState={albumState}
        isFavorite={isFavorite}
      />

      {/* 👇 CAMBIAMOS ScrollView por Animated.ScrollView */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true } // 👈 IMPORTANTE: usar native driver
        )}
        scrollEventThrottle={16} // 👈 16ms = 60fps
      >
        <AlbumHeader
          album={album}
          albumDetails={albumDetails}
          tracks={tracks}
          albumRating={albumRating}
          isFavorite={isFavorite}
          isSaved={isSaved}
          artistName={artistName}
          dominantColor={dominantColor}
          imageUrl={imageUrl}
          onToggleFavorite={toggleFavorite}
          onSaveAlbum={saveAlbum}
          onShowStateModal={() => setShowStateModal(true)}
          onGoBack={() => navigation.goBack()}
          onArtistPress={resolvedArtistId ? () => navigation.navigate('Artist', {
            artist: { id: resolvedArtistId, name: artistName }
          }) : undefined}
          // 👇 PASAMOS LOS ESTILOS ANIMADOS
          imageAnimatedStyle={imageAnimatedStyle}
        />

        <Animated.View style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }]
          }
        ]}>
          <AlbumComment
            comment={albumComment}
            isSaved={isSaved}
            onSaveComment={handleSaveComment}
          />

          {isSaved && (
            <View style={[styles.tabsContainer, { borderColor: dominantColor + '40' }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeInfoTab === 'tracks' && [styles.activeTab, { backgroundColor: dominantColor + '30' }]
                ]}
                onPress={() => setActiveInfoTab('tracks')}
              >
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color={activeInfoTab === 'tracks' ? 'white' : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[styles.tabLabel, activeInfoTab === 'tracks' && styles.activeTabLabel]}>
                  Canciones
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeInfoTab === 'info' && [styles.activeTab, { backgroundColor: dominantColor + '30' }]
                ]}
                onPress={() => setActiveInfoTab('info')}
              >
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={activeInfoTab === 'info' ? 'white' : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[styles.tabLabel, activeInfoTab === 'info' && styles.activeTabLabel]}>
                  Información
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeInfoTab === 'tracks' ? (
            <TracksList
              tracks={tracks}
              isSaved={isSaved}
              dominantColor={dominantColor}
              onTrackPress={(trackId) => {
                setSelectedTrack(trackId);
                setRatingModalVisible(true);
              }}
              expandedComments={expandedComments}
              onToggleComment={toggleCommentExpansion}
            />
          ) : (
            <AlbumInfo
              albumDetails={albumDetails}
              tracks={tracks}
              albumRating={albumRating}
              dominantColor={dominantColor}
            />
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabLabel: {
    fontSize: 14,
    marginLeft: 6,
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabLabel: {
    color: 'white',
  },
});