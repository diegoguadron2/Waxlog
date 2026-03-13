// screens/GenreScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { executeDBOperation } from '../database/Index';
import { getRatingColor } from '../utils/colors';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const PADDING_HORIZONTAL = 16;
const GAP = 12;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - GAP) / COLUMN_COUNT;

// Estados posibles de álbum
const ALBUM_STATES = {
  listened: { label: 'Escuchado', icon: 'checkmark-circle', color: '#4ADE80' },
  listening: { label: 'Escuchando', icon: 'headset', color: '#60A5FA' },
  toListen: { label: 'Por escuchar', icon: 'time', color: '#FBBF24' },
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
const GenreSkeleton = () => (
  <View style={styles.container}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
    <View style={styles.skeletonHeader}>
      <View style={styles.skeletonBackButton} />
      <View style={styles.skeletonTitleContainer}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonStatsRow}>
          {[1, 2].map(i => (
            <View key={i} style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
        <View style={styles.skeletonStatsRow}>
          {[1, 2].map(i => (
            <View key={i} style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
      </View>
    </View>
    <View style={styles.skeletonTabsContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.skeletonTab, i === 1 && styles.skeletonTabActive]} />
      ))}
    </View>
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]}>
          <View style={styles.skeletonImage} />
        </View>
      ))}
    </View>
  </View>
);

// ─── Modal de Filtros ─────────────────────────────────────────────────────────
const FilterModal = ({ visible, onClose, filters, onApply, albums }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const years = [...new Set(
    albums
      .map(a => a.release_date ? new Date(a.release_date).getFullYear() : null)
      .filter(Boolean)
  )].sort((a, b) => b - a);

  useEffect(() => {
    if (visible) setLocalFilters(filters);
  }, [visible]);

  const toggle = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const toggleState = (stateKey) => {
    setLocalFilters(prev => {
      const current = prev.states || [];
      const next = current.includes(stateKey)
        ? current.filter(s => s !== stateKey)
        : [...current, stateKey];
      return { ...prev, states: next };
    });
  };

  const activeCount = [
    localFilters.states?.length > 0,
    localFilters.rating !== null,
    localFilters.onlyFavorites,
    localFilters.year !== null,
  ].filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.filterPanel}>
        {/* Handle */}
        <View style={styles.filterHandle} />

        {/* Header */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filtros</Text>
          <TouchableOpacity
            onPress={() => setLocalFilters({ states: [], rating: null, onlyFavorites: false, year: null })}
          >
            <Text style={styles.filterReset}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Estado */}
          <Text style={styles.filterSectionLabel}>Estado</Text>
          <View style={styles.filterChipsRow}>
            {Object.entries(ALBUM_STATES).map(([key, state]) => {
              const active = localFilters.states?.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, active && { backgroundColor: state.color + '30', borderColor: state.color }]}
                  onPress={() => toggleState(key)}
                >
                  <Ionicons name={state.icon} size={14} color={active ? state.color : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.filterChipText, active && { color: state.color }]}>
                    {state.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calificación */}
          <Text style={styles.filterSectionLabel}>Calificación</Text>
          <View style={styles.filterChipsRow}>
            {[
              { key: 'rated', label: 'Con nota', icon: 'star' },
              { key: 'unrated', label: 'Sin nota', icon: 'star-outline' },
            ].map(opt => {
              const active = localFilters.rating === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggle('rating', opt.key)}
                >
                  <Ionicons name={opt.icon} size={14} color={active ? 'white' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Favoritos */}
          <Text style={styles.filterSectionLabel}>Favoritos</Text>
          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                localFilters.onlyFavorites && { backgroundColor: '#FFD70030', borderColor: '#FFD700' }
              ]}
              onPress={() => setLocalFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
            >
              <Ionicons
                name={localFilters.onlyFavorites ? 'star' : 'star-outline'}
                size={14}
                color={localFilters.onlyFavorites ? '#FFD700' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[
                styles.filterChipText,
                localFilters.onlyFavorites && { color: '#FFD700' }
              ]}>
                Solo favoritos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Año */}
          {years.length > 0 && (
            <>
              <Text style={styles.filterSectionLabel}>Año de lanzamiento</Text>
              <View style={styles.filterChipsRow}>
                {years.map(year => {
                  const active = localFilters.year === year;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => toggle('year', year)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Botón aplicar */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => { onApply(localFilters); onClose(); }}
        >
          <Text style={styles.applyButtonText}>
            Aplicar{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function GenreScreen({ route, navigation }) {
  const { genre, color: genreColor } = route.params;

  const [loading, setLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [accentColor, setAccentColor] = useState('white');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [filters, setFilters] = useState({ states: [], rating: null, onlyFavorites: false, year: null });
  const [stats, setStats] = useState({ totalAlbums: 0, averageRating: 0, totalTracks: 0, totalDuration: 0 });

  const switchViewMode = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
  };

  // Ocultar tab bar
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
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

  // Cargar álbumes
  useEffect(() => {
    let isMounted = true;
    const loadGenreAlbums = async () => {
      try {
        setLoading(true);
        const result = await executeDBOperation(async (db) => {
          return await db.getAllAsync(`
            SELECT
              a.*,
              a.deezer_id, a.title, a.cover, a.is_favorite,
              a.release_date, a.downloaded_at, a.duration, a.state,
              ar.name as artist_name,
              ar.deezer_id as artist_deezer_id,
              COUNT(t.id) as track_count,
              AVG(t.rating) as average_rating,
              SUM(t.duration) as total_duration
            FROM albums a
            LEFT JOIN artists ar ON a.artist_id = ar.id
            LEFT JOIN tracks t ON a.id = t.album_id
            WHERE LOWER(a.genres) LIKE LOWER(?)
            GROUP BY a.id
            ORDER BY a.release_date DESC
          `, [`%${genre}%`]);
        });

        if (isMounted && result) {
          setAlbums(result);
          setFilteredAlbums(result);

          const totalAlbums = result.length;
          const totalTracks = result.reduce((s, a) => s + (a.track_count || 0), 0);
          const totalRating = result.reduce((s, a) => s + (a.average_rating || 0), 0);
          const avgRating = totalAlbums > 0 ? totalRating / totalAlbums : 0;
          const totalDuration = result.reduce((s, a) => s + (a.total_duration || 0), 0);
          setStats({ totalAlbums, averageRating: avgRating, totalTracks, totalDuration });

          if (result.length > 0) {
            const randomIndex = Math.floor(Math.random() * result.length);
            const bgImage = result[randomIndex].cover;
            setBackgroundImage(bgImage);
            try {
              const colors = await ImageColors.getColors(bgImage, { fallback: '#ffffff', cache: true, key: `genre-${genre}` });
              const dominant = colors.platform === 'android'
                ? (colors.vibrant || colors.dominant)
                : (colors.primary || colors.background);
              if (dominant) setAccentColor(dominant);
            } catch (_) {}
          }
        }
      } catch (error) {
        if (__DEV__) console.error('Error cargando género:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadGenreAlbums();
    return () => { isMounted = false; };
  }, [genre]);

  // Aplicar tab + filtros
  useEffect(() => {
    if (!albums.length) return;

    let result = [...albums];

    // Tab
    if (activeTab === 'top') {
      result = result.filter(a => a.average_rating > 0).sort((a, b) => b.average_rating - a.average_rating);
    } else if (activeTab === 'recent') {
      result = result.sort((a, b) => new Date(b.downloaded_at || 0) - new Date(a.downloaded_at || 0));
    }

    // Filtros
    if (filters.states?.length > 0) {
      result = result.filter(a => filters.states.includes(a.state));
    }
    if (filters.rating === 'rated') {
      result = result.filter(a => a.average_rating > 0);
    } else if (filters.rating === 'unrated') {
      result = result.filter(a => !a.average_rating || a.average_rating === 0);
    }
    if (filters.onlyFavorites) {
      result = result.filter(a => a.is_favorite === 1);
    }
    if (filters.year !== null) {
      result = result.filter(a => a.release_date && new Date(a.release_date).getFullYear() === filters.year);
    }

    setFilteredAlbums(result);
  }, [activeTab, albums, filters]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  const handleAlbumPress = useCallback((album) => {
    navigation.navigate('Album', {
      album: { id: album.deezer_id, title: album.title, cover: album.cover },
      artistName: album.artist_name,
      artistId: album.artist_deezer_id,
      refresh: true,
    });
  }, [navigation]);

  const activeFilterCount = [
    filters.states?.length > 0,
    filters.rating !== null,
    filters.onlyFavorites,
    filters.year !== null,
  ].filter(Boolean).length;

  // ── Card grid ──
  const renderGridCard = useCallback((album) => {
    const ratingColor = album.average_rating ? getRatingColor(album.average_rating) : null;
    const ratingValue = album.average_rating ? album.average_rating.toFixed(1) : null;

    return (
      <TouchableOpacity
        key={album.id}
        style={[styles.albumCard, { width: CARD_WIDTH }]}
        onPress={() => handleAlbumPress(album)}
        activeOpacity={0.8}
      >
        <View style={styles.albumImageContainer}>
          <Image
            source={{ uri: album.cover }}
            style={styles.albumImage}
            contentFit="cover"
            transition={200}
            recyclingKey={`album-${album.id}`}
          />
          {album.is_favorite === 1 && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="star" size={11} color="#FFD700" />
            </View>
          )}
          {ratingValue && (
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '25', borderColor: ratingColor + '70' }]}>
              <Text style={[styles.ratingBadgeText, { color: ratingColor }]}>{ratingValue}</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
            locations={[0.35, 0.65, 1]}
            style={styles.imageGradient}
          />
          <View style={styles.albumInfoOverlay}>
            <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
            <Text style={styles.albumArtist} numberOfLines={1}>{album.artist_name}</Text>
            <View style={styles.albumMeta}>
              {album.release_date && (
                <Text style={styles.albumYear}>{new Date(album.release_date).getFullYear()}</Text>
              )}
              {album.track_count > 0 && (
                <>
                  {album.release_date && <Text style={styles.metaDot}>·</Text>}
                  <Text style={styles.albumTracks}>
                    {album.track_count} {album.track_count === 1 ? 'canción' : 'canciones'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleAlbumPress]);

  // ── Row lista ──
  const renderListRow = useCallback((album) => {
    const ratingColor = album.average_rating ? getRatingColor(album.average_rating) : null;
    const ratingValue = album.average_rating ? album.average_rating.toFixed(1) : null;
    const stateInfo = album.state ? ALBUM_STATES[album.state] : null;

    return (
      <TouchableOpacity
        key={album.id}
        style={styles.listRow}
        onPress={() => handleAlbumPress(album)}
        activeOpacity={0.75}
      >
        {/* Portada pequeña */}
        <View style={styles.listImageContainer}>
          <Image
            source={{ uri: album.cover }}
            style={styles.listImage}
            contentFit="cover"
            transition={200}
            recyclingKey={`list-${album.id}`}
          />
          {album.is_favorite === 1 && (
            <View style={styles.listFavBadge}>
              <Ionicons name="star" size={9} color="#FFD700" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.listArtist} numberOfLines={1}>{album.artist_name}</Text>
          <View style={styles.listMeta}>
            {album.release_date && (
              <Text style={styles.listYear}>{new Date(album.release_date).getFullYear()}</Text>
            )}
            {album.track_count > 0 && (
              <>
                {album.release_date && <Text style={styles.metaDot}>·</Text>}
                <Text style={styles.listYear}>
                  {album.track_count} {album.track_count === 1 ? 'canción' : 'canciones'}
                </Text>
              </>
            )}
            {stateInfo && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name={stateInfo.icon} size={11} color={stateInfo.color} />
              </>
            )}
          </View>
        </View>

        {/* Rating */}
        {ratingValue ? (
          <View style={[styles.listRatingBadge, { backgroundColor: ratingColor + '20', borderColor: ratingColor + '60' }]}>
            <Text style={[styles.listRatingText, { color: ratingColor }]}>{ratingValue}</Text>
          </View>
        ) : (
          <Ionicons name="star-outline" size={18} color="rgba(255,255,255,0.2)" style={{ marginRight: 4 }} />
        )}

        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      </TouchableOpacity>
    );
  }, [handleAlbumPress]);

  const tabs = [
    { id: 'all', label: 'Todos', icon: 'albums' },
    { id: 'top', label: 'Mejores', icon: 'star' },
    { id: 'recent', label: 'Recientes', icon: 'time' },
  ];

  if (loading) return <GenreSkeleton />;

  return (
    <View style={styles.container}>
      {/* Fondo blur */}
      {backgroundImage ? (
        <ImageBackground source={{ uri: backgroundImage }} style={StyleSheet.absoluteFillObject} blurRadius={80} />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
      )}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApply={setFilters}
        albums={albums}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradiente superior */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Botón retroceso */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Título + stats */}
        <View style={styles.header}>
          <Text style={[styles.genreTitle, { color: accentColor }]}>{genre}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Ionicons name="albums" size={18} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statValue}>{stats.totalAlbums}</Text>
              <Text style={styles.statLabel}>álbumes</Text>
            </View>
            <View style={styles.statCell}>
              <Ionicons name="star" size={18} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statValue}>{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>promedio</Text>
            </View>
            <View style={styles.statCell}>
              <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statValue}>{stats.totalTracks}</Text>
              <Text style={styles.statLabel}>canciones</Text>
            </View>
            <View style={styles.statCell}>
              <Ionicons name="time" size={18} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
              <Text style={styles.statLabel}>duración</Text>
            </View>
          </View>
        </View>

        {/* Tabs + controles */}
        <View style={styles.tabsRow}>
          {/* Tabs en scroll horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Botones filtro + vista — separados visualmente */}
          <View style={styles.rightControls}>
            <TouchableOpacity
              style={[styles.iconBtn, activeFilterCount > 0 && styles.iconBtnActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options" size={18} color={activeFilterCount > 0 ? 'white' : 'rgba(255,255,255,0.6)'} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => switchViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons
                name={viewMode === 'grid' ? 'list' : 'grid'}
                size={18}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chips de filtros activos */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersScroll}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {filters.states?.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.activeFilterChip, { borderColor: ALBUM_STATES[s].color }]}
                onPress={() => setFilters(prev => ({ ...prev, states: prev.states.filter(x => x !== s) }))}
              >
                <Ionicons name={ALBUM_STATES[s].icon} size={11} color={ALBUM_STATES[s].color} />
                <Text style={[styles.activeFilterChipText, { color: ALBUM_STATES[s].color }]}>
                  {ALBUM_STATES[s].label}
                </Text>
                <Ionicons name="close" size={11} color={ALBUM_STATES[s].color} />
              </TouchableOpacity>
            ))}
            {filters.rating && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setFilters(prev => ({ ...prev, rating: null }))}
              >
                <Text style={styles.activeFilterChipText}>
                  {filters.rating === 'rated' ? 'Con nota' : 'Sin nota'}
                </Text>
                <Ionicons name="close" size={11} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
            {filters.onlyFavorites && (
              <TouchableOpacity
                style={[styles.activeFilterChip, { borderColor: '#FFD700' }]}
                onPress={() => setFilters(prev => ({ ...prev, onlyFavorites: false }))}
              >
                <Ionicons name="star" size={11} color="#FFD700" />
                <Text style={[styles.activeFilterChipText, { color: '#FFD700' }]}>Favoritos</Text>
                <Ionicons name="close" size={11} color="#FFD700" />
              </TouchableOpacity>
            )}
            {filters.year && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setFilters(prev => ({ ...prev, year: null }))}
              >
                <Text style={styles.activeFilterChipText}>{filters.year}</Text>
                <Ionicons name="close" size={11} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Contenido animado */}
        {filteredAlbums.length > 0 ? (
          <View style={styles.gridContainer}>
            {viewMode === 'grid' ? (
              <View key="grid" style={styles.albumGrid}>
                {filteredAlbums.map(album => renderGridCard(album))}
              </View>
            ) : (
              <View key="list" style={styles.listContainer}>
                {filteredAlbums.map(album => renderListRow(album))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name={activeFilterCount > 0 ? 'filter' : 'musical-notes'} size={48} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilterCount > 0 ? 'Sin resultados' : `No hay álbumes de ${genre}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0
                ? 'Prueba ajustando o limpiando los filtros'
                : 'Los álbumes de este género aparecerán aquí cuando los guardes'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => setFilters({ states: [], rating: null, onlyFavorites: false, year: null })}
              >
                <Text style={styles.clearFiltersBtnText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },

  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 150,
    zIndex: 10, pointerEvents: 'none',
  },
  backButton: {
    position: 'absolute', top: 60, left: 20, zIndex: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },

  // Header
  header: { marginTop: 120, marginBottom: 20, paddingHorizontal: PADDING_HORIZONTAL, zIndex: 15 },
  genreTitle: {
    fontSize: 42, fontWeight: 'bold', marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
    padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statCell: { width: '50%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  statValue: {
    color: 'white', fontSize: 20, fontWeight: '700', marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2, fontWeight: '500' },

  // Controles (tabs + iconos)
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingRight: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    marginRight: 6, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' },
  tabText: { marginLeft: 5, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  activeTabText: { color: 'white' },

  rightControls: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' },
  filterBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#60A5FA', justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  // Chips de filtros activos
  activeFiltersScroll: { marginBottom: 10 },
  activeFiltersContent: { paddingHorizontal: PADDING_HORIZONTAL, gap: 8 },
  activeFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  activeFilterChipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },

  // Grid cards
  gridContainer: { paddingHorizontal: PADDING_HORIZONTAL },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  albumCard: { borderRadius: 16, overflow: 'hidden', marginBottom: GAP },
  albumImageContainer: { width: '100%', aspectRatio: 0.85, position: 'relative' },
  albumImage: { width: '100%', height: '100%' },
  favoriteBadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, padding: 4,
    borderWidth: 1, borderColor: '#FFD700',
  },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8, zIndex: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  ratingBadgeText: { fontSize: 12, fontWeight: 'bold' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  albumInfoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, zIndex: 5 },
  albumTitle: {
    color: 'white', fontSize: 13, fontWeight: '700', marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  albumArtist: {
    color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  albumMeta: { flexDirection: 'row', alignItems: 'center' },
  albumYear: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  albumTracks: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  metaDot: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 3, fontSize: 10 },

  // Lista
  listContainer: { gap: 1 },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  listImageContainer: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden', position: 'relative', marginRight: 12 },
  listImage: { width: '100%', height: '100%' },
  listFavBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: 2,
  },
  listInfo: { flex: 1, marginRight: 8 },
  listTitle: { color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  listArtist: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 3 },
  listMeta: { flexDirection: 'row', alignItems: 'center' },
  listYear: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  listRatingBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, marginRight: 8,
  },
  listRatingText: { fontSize: 13, fontWeight: 'bold' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    color: 'white', fontSize: 18, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 8,
  },
  emptySubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  clearFiltersBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  clearFiltersBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Modal de filtros
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: height * 0.75,
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterHandle: {
    alignSelf: 'center', width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 12, marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  filterTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  filterReset: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  filterSectionLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)' },
  filterChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  applyButton: {
    backgroundColor: 'white', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  applyButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },

  // Skeleton
  skeletonHeader: { marginTop: 120, marginBottom: 20, paddingHorizontal: PADDING_HORIZONTAL },
  skeletonBackButton: {
    position: 'absolute', top: -60, left: 20,
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonTitleContainer: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16 },
  skeletonTitle: { width: '60%', height: 42, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 16 },
  skeletonStatsRow: { flexDirection: 'row', marginBottom: 4 },
  skeletonStatItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  skeletonStatValue: { width: 40, height: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 4 },
  skeletonStatLabel: { width: 50, height: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 },
  skeletonStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 8 },
  skeletonTabsContainer: { flexDirection: 'row', paddingHorizontal: PADDING_HORIZONTAL, marginBottom: 20 },
  skeletonTab: { flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, marginHorizontal: 4 },
  skeletonTabActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: PADDING_HORIZONTAL },
  skeletonCard: { marginBottom: GAP, borderRadius: 16, overflow: 'hidden' },
  skeletonImage: { width: '100%', aspectRatio: 0.85, backgroundColor: 'rgba(255,255,255,0.05)' },
  skeletonCardInfo: { padding: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  skeletonCardTitle: { width: '80%', height: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 4 },
  skeletonCardArtist: { width: '60%', height: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 },
});