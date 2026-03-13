// screens/ListenedScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
const TAB_BAR_STYLE = { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', borderTopWidth: 0, elevation: 0, height: 70, paddingBottom: 10, paddingTop: 10 };
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

export default function ListenedScreen({ navigation }) {
  const [viewMode, setViewMode] = useState('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
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
  } = useAlbumsByState('listened');

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: TAB_BAR_STYLE
      });
    }, [navigation])
  );

  const handleAlbumPress = useCallback((album) => {
    navigation.navigate('Album', {
      album: {
        id: album.deezer_id,
        title: album.title,
        cover: album.cover,
      },
      artistName: album.artist_name,
      artistId: album.artist_deezer_id,
      refresh: true,
      fromScreen: 'Listened',
    });
  }, [navigation]);

  const handleLocalSortChange = useCallback((optionId) => {
    handleSortChange(optionId);
    setShowSortMenu(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [handleSortChange]);

  const renderGridItem = useCallback(({ item }) => (
    <SharedElement id={`album-${item.id}`}>
      <AlbumCard
        album={item}
        viewMode="grid"
        activeTab="listened"
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
        activeTab="listened"
        onPress={handleAlbumPress}
      />
    </SharedElement>
  ), [handleAlbumPress]);

  const renderHeader = useCallback(() => (
    <>
      <LibraryHeader
        totalAlbums={totalCount}
        onAddPress={() => navigation.navigate('SaveAlbum')}
        title="Escuchados"
          accentColor="#4ADE80"
      />
      <ControlsBar
        sortLabel={sortOptions.find(o => o.id === sortBy)?.label || 'Ordenar'}
        onSortPress={() => setShowSortMenu(!showSortMenu)}
        accentColor="#4ADE80"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </>
  ), [totalCount, sortOptions, sortBy, showSortMenu, viewMode, navigation]);

  if (loading && albums.length === 0) {
    return (
      <View style={styles.container}>
        <LibraryHeader
          totalAlbums={0}
          onAddPress={() => navigation.navigate('SaveAlbum')}
          title="Escuchados"
          accentColor="#4ADE80"
        />
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
            activeTab="listened"
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
            colors={['#9333EA']}
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

// Los estilos son los mismos que ya tenías
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
  skeletonControl: {
    width: 100,
    height: 36,
  },
  skeletonViewToggle: {
    width: 80,
    height: 36,
  },
});