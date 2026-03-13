import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAlbumsByState } from '../hooks/useAlbumsByState';

// Componentes
import AlbumCard from '../components/library/AlbumCard';
import AlbumSkeleton from '../components/library/AlbumSkeleton';
import LibraryHeader from '../components/library/LibraryHeader';
import ControlsBar from '../components/library/ControlsBar';
import SortMenu from '../components/library/SortMenu';
import EmptyLibraryState from '../components/library/EmptyLibraryState';
import SharedElement from '../components/shared/SharedElement';
import { PADDING_HORIZONTAL, GAP, CARD_WIDTH } from '../constants/layout';

const TAB_BAR_STYLE = {
  position: 'absolute',
  backgroundColor: 'rgba(0,0,0,0.8)',
  borderTopWidth: 0,
  elevation: 0,
  height: 70,
  paddingBottom: 10,
  paddingTop: 10,
};

const ACCENT = '#FBBF24';

const getTimeAgo = (dateStr) => {
  if (!dateStr) return null;
  const added = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - added) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Agregado hoy';
  if (days === 1) return 'Hace 1 día';
  if (days < 7) return `Hace ${days} días`;
  if (days < 14) return 'Hace 1 semana';
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 60) return 'Hace 1 mes';
  return `Hace ${Math.floor(days / 30)} meses`;
};

const DailyAlbumCard = ({ album, onPress, onShuffle }) => {
  const timeAgo = getTimeAgo(album.downloaded_at);

  return (
    <View style={card.container}>
      <TouchableOpacity onPress={() => onPress(album)} activeOpacity={0.9}>
        <ImageBackground
          source={{ uri: album.cover }}
          style={card.image}
          imageStyle={{ borderRadius: 16 }}
        >
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.95)']}
            locations={[0, 0.45, 0.75, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={card.topRow}>
            <View style={card.badge}>
              <Ionicons name="sunny" size={11} color={ACCENT} />
              <Text style={card.badgeText}>Álbum del día</Text>
            </View>
            <TouchableOpacity
              style={card.shuffleBtn}
              onPress={onShuffle}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="shuffle" size={16} color={ACCENT} />
            </TouchableOpacity>
          </View>

          <View style={card.info}>
            <Text style={card.title} numberOfLines={2}>{album.title}</Text>
            <Text style={card.artist} numberOfLines={1}>{album.artist_name}</Text>
            <View style={card.meta}>
              {timeAgo && (
                <View style={card.metaItem}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={card.metaText}>{timeAgo}</Text>
                </View>
              )}
              {album.total_tracks > 0 && (
                <View style={card.metaItem}>
                  <Ionicons name="musical-notes-outline" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={card.metaText}>
                    {album.total_tracks} {album.total_tracks === 1 ? 'canción' : 'canciones'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

const card = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: `${ACCENT}60`,
    gap: 5,
  },
  badgeText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  shuffleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: `${ACCENT}60`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    marginBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});

export default function ToListenScreen({ navigation }) {
  const [viewMode, setViewMode] = useState('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [dailyIndex, setDailyIndex] = useState(0);
  const flatListRef = useRef(null);

  const {
    albums,
    loading,
    refreshing,
    sortBy,
    totalCount,
    sortOptions,
    handleSortChange,
    onRefresh,
  } = useAlbumsByState('to_listen');

  const dailyAlbum = useMemo(() => {
    if (!albums.length) return null;
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const baseIndex = (dayOfYear + dailyIndex) % albums.length;
    return albums[baseIndex];
  }, [albums, dailyIndex]);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    }, [navigation])
  );

  const handleAlbumPress = useCallback((album) => {
    navigation.navigate('Album', {
      album: { id: album.deezer_id, title: album.title, cover: album.cover },
      artistName: album.artist_name,
      artistId: album.artist_deezer_id,
      refresh: true,
      fromScreen: 'ToListen',
    });
  }, [navigation]);

  const handleShuffle = useCallback(() => {
    setDailyIndex(prev => prev + 1);
  }, []);

  const handleLocalSortChange = useCallback((optionId) => {
    handleSortChange(optionId);
    setShowSortMenu(false);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [handleSortChange]);

  const renderGridItem = useCallback(({ item }) => (
    <SharedElement id={`album-${item.id}`}>
      <AlbumCard
        album={item}
        viewMode="grid"
        activeTab="to_listen"
        onPress={handleAlbumPress}
        cardWidth={CARD_WIDTH}
      />
    </SharedElement>
  ), [handleAlbumPress]);

  const renderListItem = useCallback(({ item }) => (
    <SharedElement id={`album-${item.id}`}>
      <AlbumCard
        album={item}
        viewMode="list"
        activeTab="to_listen"
        onPress={handleAlbumPress}
      />
    </SharedElement>
  ), [handleAlbumPress]);

  const renderHeader = useCallback(() => (
    <>
      <LibraryHeader
        totalAlbums={totalCount}
        onAddPress={() => navigation.navigate('SaveAlbum')}
        title="Por escuchar"
        accentColor={ACCENT}
      />

      {dailyAlbum && (
        <DailyAlbumCard
          album={dailyAlbum}
          onPress={handleAlbumPress}
          onShuffle={handleShuffle}
        />
      )}

      <ControlsBar
        sortLabel={sortOptions.find(o => o.id === sortBy)?.label || 'Ordenar'}
        onSortPress={() => setShowSortMenu(!showSortMenu)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </>
  ), [totalCount, dailyAlbum, sortOptions, sortBy, showSortMenu, viewMode, navigation, handleAlbumPress, handleShuffle]);

  if (loading && albums.length === 0) {
    return (
      <View style={styles.container}>
        <LibraryHeader
          totalAlbums={0}
          onAddPress={() => navigation.navigate('SaveAlbum')}
          title="Por escuchar"
          accentColor={ACCENT}
        />
        <View style={styles.skeletonCard} />
        <View style={styles.controlsBar}>
          <View style={[styles.controlButton, styles.skeletonControl]} />
          <View style={[styles.viewToggle, styles.skeletonViewToggle]} />
        </View>
        <AlbumSkeleton viewMode={viewMode} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SortMenu
        visible={showSortMenu}
        options={sortOptions}
        selectedOption={sortBy}
        onSelect={handleLocalSortChange}
        onClose={() => setShowSortMenu(false)}
      />

      <FlatList
        ref={flatListRef}
        data={albums}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => `album-${item.id}-${viewMode}`}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? (
          <EmptyLibraryState
            activeTab="to_listen"
            onAddPress={() => navigation.navigate('SaveAlbum')}
          />
        ) : null}
        contentContainerStyle={[
          styles.scrollContent,
          albums.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.7)"
            colors={[ACCENT]}
          />
        }
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={6}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  skeletonCard: {
    aspectRatio: 1,
    marginHorizontal: PADDING_HORIZONTAL,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonControl: {
    width: 100,
    height: 36,
  },
  skeletonViewToggle: {
    width: 80,
    height: 36,
  },
});