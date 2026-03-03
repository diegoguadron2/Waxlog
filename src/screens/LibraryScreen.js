// screens/LibraryScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tabBarStyle } from '../navigation/AppNavigator';

// Componentes
import AlbumCard from '../components/AlbumCard';
import TabBar from '../components/TabBar';
import AlbumSkeleton from '../components/AlbumSkeleton';
import LibraryHeader from '../components/LibraryHeader';
import ControlsBar from '../components/ControlsBar';
import SortMenu from '../components/SortMenu';
import EmptyLibraryState from '../components/EmptyLibraryState';

// Hooks
import { useLibraryData } from '../hooks/useLibraryData';

// Constantes
import { PADDING_HORIZONTAL, GAP, CARD_WIDTH } from '../constants/layout';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;

export default function LibraryScreen({ navigation }) {
  const [viewMode, setViewMode] = useState('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const flatListRef = useRef(null);

  const tabs = [
    { id: 'listened', label: 'Escuchados', icon: 'checkmark-circle', color: '#4ADE80' },
    { id: 'listening', label: 'Escuchando', icon: 'headset', color: '#60A5FA' },
    { id: 'to_listen', label: 'Por escuchar', icon: 'time', color: '#FBBF24' },
  ];

  // Usar el hook personalizado
  const {
    filteredAlbums,
    activeTab,
    loading,
    refreshing,
    sortBy,
    tabCounts,
    handleTabChange,
    handleSortChange,
    onRefresh,
    getSortOptionsForTab,
  } = useLibraryData(tabs, 'to_listen');

  const sortOptions = getSortOptionsForTab(activeTab);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: tabBarStyle
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
      fromScreen: 'Library',
    });
  }, [navigation]);

  const handleLocalSortChange = useCallback((optionId) => {
    handleSortChange(optionId);
    setShowSortMenu(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [handleSortChange]);

  const handleLocalTabChange = useCallback((tabId) => {
    handleTabChange(tabId);
    setShowSortMenu(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [handleTabChange]);

  const renderGridItem = useCallback(({ item }) => (
    <AlbumCard
      album={item}
      viewMode="grid"
      activeTab={activeTab}
      onPress={handleAlbumPress}
      cardWidth={CARD_WIDTH}
    />
  ), [activeTab, handleAlbumPress]);

  const renderListItem = useCallback(({ item }) => (
    <AlbumCard
      album={item}
      viewMode="list"
      activeTab={activeTab}
      onPress={handleAlbumPress}
    />
  ), [activeTab, handleAlbumPress]);

  const renderHeader = useCallback(() => (
    <>
      <LibraryHeader
        totalAlbums={tabCounts.listened + tabCounts.listening + tabCounts.to_listen}
        onAddPress={() => navigation.navigate('SaveAlbum')}
      />

      <TabBar
        tabs={tabs.map(tab => ({
          ...tab,
          count: tabCounts[tab.id]
        }))}
        activeTab={activeTab}
        onTabChange={handleLocalTabChange}
      />

      <ControlsBar
        sortLabel={sortOptions.find(o => o.id === sortBy)?.label || 'Ordenar'}
        onSortPress={() => setShowSortMenu(!showSortMenu)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </>
  ), [tabCounts, activeTab, sortOptions, sortBy, showSortMenu, viewMode, navigation, handleLocalTabChange]);

  // Si está cargando por primera vez, mostrar skeletons
  if (loading && filteredAlbums.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mi Biblioteca</Text>
            <Text style={styles.headerSubtitle}>Cargando tu biblioteca...</Text>
          </View>
          <View style={styles.skeletonAddButton} />
        </View>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <View key={tab.id} style={[styles.tab, styles.skeletonTab]} />
          ))}
        </View>
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
        data={filteredAlbums}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => `album-${item.id}-${viewMode}`}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? (
          <EmptyLibraryState
            activeTab={activeTab}
            onAddPress={() => navigation.navigate('SaveAlbum')}
          />
        ) : null}
        contentContainerStyle={[
          styles.scrollContent,
          filteredAlbums.length === 0 && styles.emptyContent,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    paddingVertical: 8,
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
  skeletonAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonTab: {
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.02)',
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