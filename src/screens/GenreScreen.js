import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  FlatList,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { getDB } from '../database/Index';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const PADDING_HORIZONTAL = 16;
const GAP = 16;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - GAP) / COLUMN_COUNT;

// Colores para calificaciones
const getRatingColor = (rating) => {
  if (!rating) return '#9CA3AF';
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return colors[index];
};

// 🔴 COMPONENTE SKELETON PARA GENRE SCREEN
const GenreSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.skeletonBackground, { backgroundColor: '#1a1a1a' }]} />
      
      {/* Header skeleton */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonBackButton} />
        <View style={styles.skeletonTitleContainer}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
            <View style={styles.skeletonStatDivider} />
            <View style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
            <View style={styles.skeletonStatDivider} />
            <View style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          </View>
        </View>
      </View>

      {/* Tabs skeleton */}
      <View style={styles.skeletonTabsContainer}>
        <View style={[styles.skeletonTab, styles.skeletonTabActive]} />
        <View style={styles.skeletonTab} />
        <View style={styles.skeletonTab} />
      </View>

      {/* Grid skeleton */}
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonCardInfo}>
              <View style={styles.skeletonCardTitle} />
              <View style={styles.skeletonCardArtist} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function GenreScreen({ route, navigation }) {
  const { genre, color: genreColor } = route.params;

  const [loading, setLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'top', 'recent'
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [stats, setStats] = useState({
    totalAlbums: 0,
    averageRating: 0,
    totalTracks: 0,
    totalDuration: 0,
  });

  // Ocultar el tab navigator al entrar en GenreScreen
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      // No hacemos nada
    };
  }, [navigation]);

  useEffect(() => {
    loadGenreData();
  }, []);

  useEffect(() => {
    // Filtrar álbumes según la pestaña activa
    if (activeTab === 'all') {
      setFilteredAlbums(albums);
    } else if (activeTab === 'top') {
      const topRated = [...albums]
        .filter(album => album.average_rating > 0)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      setFilteredAlbums(topRated);
    } else if (activeTab === 'recent') {
      const recent = [...albums]
        .sort((a, b) => new Date(b.downloaded_at || 0) - new Date(a.downloaded_at || 0));
      setFilteredAlbums(recent);
    }
  }, [activeTab, albums]);

  const getRandomAlbumCover = async (albumsList) => {
    if (!albumsList || albumsList.length === 0) return null;
    
    // Seleccionar un álbum aleatorio
    const randomIndex = Math.floor(Math.random() * albumsList.length);
    return albumsList[randomIndex].cover;
  };

  const loadGenreData = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const searchTerm = `%${genre}%`;

      // Buscar todos los álbumes de este género
      const allAlbums = await db.getAllAsync(`
        SELECT 
          a.*,
          a.deezer_id,
          a.title,
          a.cover,
          a.is_favorite,
          a.release_date,
          a.downloaded_at,
          a.duration,
          ar.name as artist_name,
          ar.deezer_id as artist_deezer_id,
          COUNT(t.id) as track_count,
          AVG(t.rating) as average_rating,
          SUM(t.duration) as total_duration
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.id
        LEFT JOIN tracks t ON a.id = t.album_id
        WHERE LOWER(a.genres) LIKE ?
        GROUP BY a.id
        ORDER BY a.release_date DESC
      `, [searchTerm]);

      // Establecer una imagen de fondo aleatoria
      const randomCover = await getRandomAlbumCover(allAlbums);
      setBackgroundImage(randomCover);

      // Calcular estadísticas
      const totalAlbums = allAlbums.length;
      const totalTracks = allAlbums.reduce((sum, album) => sum + (album.track_count || 0), 0);
      const avgRating = allAlbums.reduce((sum, album) => sum + (album.average_rating || 0), 0) / totalAlbums || 0;
      const totalDuration = allAlbums.reduce((sum, album) => sum + (album.total_duration || 0), 0);

      setStats({
        totalAlbums,
        averageRating: avgRating,
        totalTracks,
        totalDuration,
      });

      setAlbums(allAlbums);
      setFilteredAlbums(allAlbums);

    } catch (error) {
      console.error('Error cargando género:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const renderAlbumCard = ({ item: album }) => {
    const ratingColor = album.average_rating ? getRatingColor(album.average_rating) : '#9CA3AF';
    const ratingValue = album.average_rating ? album.average_rating.toFixed(1) : null;

    return (
      <TouchableOpacity
        style={[styles.albumCard, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('Album', {
          album: {
            id: album.deezer_id,
            title: album.title,
            cover: album.cover
          },
          artistName: album.artist_name,
          artistId: album.artist_deezer_id,
          refresh: true
        })}
        activeOpacity={0.7}
      >
        <View style={styles.albumImageContainer}>
          <Image
            source={{ uri: album.cover }}
            style={styles.albumImage}
            contentFit="cover"
            transition={300}
          />
          
          {album.is_favorite === 1 && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}

          {ratingValue && (
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
              <Text style={[styles.ratingBadgeText, { color: ratingColor }]}>
                {ratingValue}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
        </View>

        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={styles.albumArtist} numberOfLines={1}>
            {album.artist_name}
          </Text>
          
          <View style={styles.albumMeta}>
            {album.release_date && (
              <Text style={styles.albumYear}>
                {new Date(album.release_date).getFullYear()}
              </Text>
            )}
            {album.track_count > 0 && (
              <>
                {album.release_date && <Text style={styles.metaDot}>•</Text>}
                <Text style={styles.albumTracks}>
                  {album.track_count} {album.track_count === 1 ? 'canción' : 'canciones'}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs = [
    { id: 'all', label: 'Todos', icon: 'albums' },
    { id: 'top', label: 'Mejores', icon: 'star' },
    { id: 'recent', label: '', icon: 'time' }, // Solo icono, sin texto
  ];

  if (loading) {
    return <GenreSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Fondo con imagen aleatoria y blur */}
      {backgroundImage ? (
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={80}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
      )}
      
      {/* Overlay oscuro para legibilidad */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

      {/* Contenido con scroll */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con gradiente superior */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Botón de retroceso */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Título y estadísticas */}
        <View style={styles.header}>
          <Text style={styles.genreTitle}>{genre}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="albums" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statText}>
                {stats.totalAlbums} {stats.totalAlbums === 1 ? 'álbum' : 'álbumes'}
              </Text>
            </View>
            
            {stats.averageRating > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>
                    {stats.averageRating.toFixed(1)}
                  </Text>
                </View>
              </>
            )}
            
            {stats.totalTracks > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>
                    {stats.totalTracks}
                  </Text>
                </View>
              </>
            )}

            {stats.totalDuration > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>
                    {formatDuration(stats.totalDuration)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
                tab.id === 'recent' && styles.iconOnlyTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={tab.id === 'recent' ? 22 : 18}
                color={activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)'}
              />
              {tab.label ? (
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid de álbumes */}
        {filteredAlbums.length > 0 ? (
          <View style={styles.gridContainer}>
            <View style={styles.albumGrid}>
              {filteredAlbums.map((album) => (
                <View key={album.id} style={{ width: CARD_WIDTH, marginBottom: GAP }}>
                  {renderAlbumCard({ item: album })}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="musical-notes" size={48} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No hay álbumes de {genre}</Text>
            <Text style={styles.emptySubtitle}>
              Los álbumes de este género aparecerán aquí cuando los guardes
            </Text>
          </View>
        )}

        {/* Espacio extra al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 10,
    pointerEvents: 'none',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    marginTop: 120,
    marginBottom: 20,
    paddingHorizontal: PADDING_HORIZONTAL,
    zIndex: 15,
  },
  genreTitle: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 20,
    zIndex: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconOnlyTab: {
    flex: 0.5, // Más pequeño para el icono solo
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: 'white',
  },
  gridContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  albumCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  albumImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBadge: {
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
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  albumInfo: {
    padding: 12,
  },
  albumTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  albumArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumYear: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  albumTracks: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  metaDot: {
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },

  // 🔴 ESTILOS PARA SKELETONS
  skeletonBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  skeletonHeader: {
    marginTop: 120,
    marginBottom: 20,
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  skeletonBackButton: {
    position: 'absolute',
    top: -60,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonTitleContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 16,
  },
  skeletonTitle: {
    width: '60%',
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  skeletonStatValue: {
    width: 40,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 50,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 8,
  },
  skeletonTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 20,
  },
  skeletonTab: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  skeletonTabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  skeletonCard: {
    marginBottom: GAP,
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonCardInfo: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  skeletonCardTitle: {
    width: '80%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonCardArtist: {
    width: '60%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
});