// screens/AlbumScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import ImageColors from 'react-native-image-colors';
import { useAlbumData } from '../hooks/useAlbumData';
import { Ionicons } from '@expo/vector-icons';  // 👈 Faltaba esta importación
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
  } = useAlbumData(initialAlbum, artistName, artistId);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [tempComment, setTempComment] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [activeInfoTab, setActiveInfoTab] = useState('tracks');

  useEffect(() => {
    console.log('AlbumScreen montado con params:', { initialAlbum, artistName, artistId });
    updateAlbum(initialAlbum || {});
    loadAlbumData();
  }, []);

  useEffect(() => {
    if (refresh) {
      console.log('Recargando por refresh...');
      loadAlbumData();
    }
  }, [refresh]);

  useEffect(() => {
    if (album?.cover) {
      const largeUrl = album.cover.includes('/250x250-')
        ? album.cover.replace('/250x250-', '/1000x1000-')
        : album.cover;
      setImageUrl(largeUrl);
      getImageColors(largeUrl);
    }
  }, [album]);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

  const getImageColors = async (imageUrl) => {
    try {
      const colors = await ImageColors.getColors(imageUrl, {
        fallback: '#000000',
        cache: true,
        key: album.id?.toString() || 'default',
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
      console.error('Error obteniendo colores:', error);
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

  if (loading) {
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
        />

        <View style={styles.content}>
          <AlbumComment
            comment={albumComment}
            isSaved={isSaved}
            onSaveComment={handleSaveComment}
          />

          {isSaved && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeInfoTab === 'tracks' && styles.activeTab]}
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
                style={[styles.tab, activeInfoTab === 'info' && styles.activeTab]}
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
        </View>
      </ScrollView>
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