// screens/ArtistScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Animated, // 👈 IMPORTAR Animated
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import deezerApi from '../services/deezerApi';
import { executeDBOperation } from '../database/Index';

const { width, height } = Dimensions.get('window');

// Función mejorada para determinar el tipo de álbum
const getAlbumTypeFromData = (album) => {
  if (album.record_type) {
    const type = album.record_type.toLowerCase();
    if (type === 'ep') return 'EP';
    if (type === 'single') return 'Single';
    if (type === 'album') return 'Álbum';
    if (type === 'live') return 'Live';
    if (type === 'compilation') return 'Compilación';
  }

  const title = album.title?.toLowerCase() || '';
  const nb_tracks = album.nb_tracks || 0;

  if (title.includes('ep') || title.includes('extended play')) return 'EP';
  if (title.includes('single')) return 'Single';
  if (title.includes('live')) return 'Live';
  if (title.includes('remix')) return 'Remix';
  if (title.includes('deluxe')) return 'Deluxe';
  if (title.includes('anniversary') || title.includes('edition')) return 'Edición Especial';

  if (nb_tracks === 1) return 'Single';
  if (nb_tracks <= 6 && nb_tracks > 1) return 'EP';

  return 'Álbum';
};

// Formatear número de fans
const formatFans = (fans) => {
  if (!fans) return null;
  if (fans >= 1000000) return `${(fans / 1000000).toFixed(1)}M`;
  if (fans >= 1000) return `${(fans / 1000).toFixed(1)}K`;
  return fans.toString();
};

export default function ArtistScreen({ route, navigation }) {
  const { artist: initialArtist } = route.params;

  const [artist, setArtist] = useState(initialArtist);
  const [artistDetails, setArtistDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [activeTab, setActiveTab] = useState('discography');
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [related, setRelated] = useState([]);
  const [isConnected, setIsConnected] = useState(null);
  const [localArtistId, setLocalArtistId] = useState(null);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 👇 ESTADOS PARA FILTROS
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'album', 'ep', 'single', 'live', 'compilation'
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 👇 VALOR ANIMADO PARA EL SCROLL
  const scrollY = useRef(new Animated.Value(0)).current;

  // 👇 ESTILOS ANIMADOS PARA LA IMAGEN (PARALLAX)
  const imageAnimatedStyle = {
    transform: [
      {
        scale: scrollY.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: [1.5, 1, 0.8],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: scrollY.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: [50, 0, -50],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  // Ocultar el tab navigator
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
  }, [navigation]);

  // Verificar conexión a internet
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      if (isMounted) {
        setIsConnected(state.isConnected ?? false);
        setConnectionChecked(true);
      }
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (isMounted) {
        setIsConnected(state.isConnected ?? false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Cargar ID local del artista
  useEffect(() => {
    let isMounted = true;
    
    const loadLocalArtistId = async () => {
      try {
        const result = await executeDBOperation(async (db) => {
          return await db.getFirstAsync(
            'SELECT id FROM artists WHERE deezer_id = ?',
            [artist.id.toString()]
          );
        });
        
        if (isMounted && result) {
          setLocalArtistId(result.id);
        }
      } catch (error) {
        console.error('Error cargando ID local del artista:', error);
      }
    };

    loadLocalArtistId();
    
    return () => {
      isMounted = false;
    };
  }, [artist.id]);

  // Cargar datos del artista
  useEffect(() => {
    let isMounted = true;
    
    const loadArtistData = async () => {
      try {
        setLoading(true);
        
        const imageUrl = artist.picture_big || artist.picture_medium || artist.picture;
        if (imageUrl && isMounted) {
          await getImageColors(imageUrl);
        }

        // Si hay conexión, obtener detalles completos del artista
        if (isConnected) {
          try {
            const details = await deezerApi.getArtistById(artist.id);
            if (isMounted) {
              setArtistDetails(details);
            }
          } catch (error) {
            console.log('Error cargando detalles del artista:', error);
          }
        }
      } catch (error) {
        console.error('Error cargando artista:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (connectionChecked) {
      loadArtistData();
    }
  }, [artist.id, isConnected, connectionChecked]);

  // Cargar álbumes cuando el artista local y la conexión estén listos
  useEffect(() => {
    if (connectionChecked) {
      if (isConnected) {
        loadAllAlbums();
      } else {
        loadLocalAlbumsOnly();
      }
    }
  }, [localArtistId, isConnected, connectionChecked]);

  // Manejar cambios de pestaña
  useEffect(() => {
    if (connectionChecked && activeTab === 'related' && isConnected) {
      loadRelatedArtists();
    }
  }, [activeTab, isConnected, connectionChecked]);

  // 👇 EFECTO PARA FILTRAR ÁLBUMES CUANDO CAMBIA EL FILTRO ACTIVO
  useEffect(() => {
    if (albums.length > 0) {
      if (activeFilter === 'all') {
        setFilteredAlbums(albums);
      } else {
        const filtered = albums.filter(album => {
          const type = (album.record_type || album.displayType || '').toLowerCase();
          return type === activeFilter.toLowerCase();
        });
        setFilteredAlbums(filtered);
      }
    }
  }, [activeFilter, albums]);

  const getImageColors = async (imageUrl) => {
    try {
      const colors = await ImageColors.getColors(imageUrl, {
        fallback: '#000000',
        cache: true,
        key: artist.id.toString(),
      });

      switch (colors.platform) {
        case 'android':
          setBackgroundColor(colors.dominant || colors.vibrant || '#000000');
          break;
        case 'ios':
          setBackgroundColor(colors.background || colors.primary || '#000000');
          break;
        default:
          setBackgroundColor('#000000');
      }
    } catch (error) {
      console.error('Error obteniendo colores:', error);
      setBackgroundColor('#000000');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Recargar datos
    const imageUrl = artist.picture_big || artist.picture_medium || artist.picture;
    if (imageUrl) {
      await getImageColors(imageUrl);
    }

    if (isConnected) {
      try {
        const details = await deezerApi.getArtistById(artist.id);
        setArtistDetails(details);
      } catch (error) {
        console.log('Error cargando detalles del artista:', error);
      }
      
      await loadAllAlbums();
    } else {
      await loadLocalAlbumsOnly();
    }
    
    setRefreshing(false);
  };

  const loadLocalAlbumsOnly = async () => {
    if (!localArtistId) return;
    
    setAlbumsLoading(true);
    try {
      await executeDBOperation(async (db) => {
        console.log('Cargando álbumes locales para artista ID:', localArtistId);
        const localAlbums = await db.getAllAsync(
          `SELECT a.*, 
                  COUNT(t.id) as total_tracks,
                  AVG(t.rating) as average_rating
           FROM albums a
           LEFT JOIN tracks t ON a.id = t.album_id
           WHERE a.artist_id = ?
           GROUP BY a.id
           ORDER BY a.release_date DESC`,
          [localArtistId]
        );

        console.log(`Encontrados ${localAlbums.length} álbumes locales`);

        const albumsList = localAlbums.map(album => ({
          ...album,
          isDownloaded: true,
          displayType: getAlbumTypeFromData(album),
        }));

        setAlbums(albumsList);
        setFilteredAlbums(albumsList);
      });
    } catch (error) {
      console.error('Error cargando álbumes locales:', error);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const loadAllAlbums = async () => {
    setAlbumsLoading(true);
    try {
      await executeDBOperation(async (db) => {
        let albumsList = [];

        // Primero cargar locales
        if (localArtistId) {
          const localAlbums = await db.getAllAsync(
            `SELECT a.*, 
                    COUNT(t.id) as total_tracks,
                    AVG(t.rating) as average_rating
             FROM albums a
             LEFT JOIN tracks t ON a.id = t.album_id
             WHERE a.artist_id = ?
             GROUP BY a.id
             ORDER BY a.release_date DESC`,
            [localArtistId]
          );

          albumsList = localAlbums.map(album => ({
            ...album,
            isDownloaded: true,
            displayType: getAlbumTypeFromData(album),
          }));
        }

        // Luego agregar de API si hay conexión
        if (isConnected) {
          try {
            console.log('Cargando álbumes de API para artista:', artist.id);
            const apiAlbums = await deezerApi.getArtistAlbums(artist.id);
            const apiAlbumsList = (apiAlbums.data || []).map(album => {
              const isDownloaded = albumsList.some(a => a.deezer_id === album.id.toString());
              return {
                ...album,
                id: album.id,
                deezer_id: album.id.toString(),
                title: album.title,
                cover: album.cover_medium || album.cover,
                cover_medium: album.cover_medium,
                release_date: album.release_date,
                nb_tracks: album.nb_tracks,
                record_type: album.record_type,
                displayType: getAlbumTypeFromData(album),
                isDownloaded,
                sortDate: album.release_date ? new Date(album.release_date) : new Date(0),
              };
            });

            console.log(`Encontrados ${apiAlbumsList.length} álbumes en API`);

            // Combinar y eliminar duplicados
            const combinedAlbums = [...albumsList, ...apiAlbumsList.filter(
              api => !albumsList.some(local => local.deezer_id === api.id.toString())
            )];

            combinedAlbums.sort((a, b) => {
              const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
              const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
              return dateB - dateA;
            });

            setAlbums(combinedAlbums);
            setFilteredAlbums(combinedAlbums);
          } catch (apiError) {
            console.error('Error cargando álbumes de API:', apiError);
            setAlbums(albumsList);
            setFilteredAlbums(albumsList);
          }
        } else {
          setAlbums(albumsList);
          setFilteredAlbums(albumsList);
        }
      });
    } catch (error) {
      console.error('Error cargando álbumes:', error);
      Alert.alert('Error', 'No se pudieron cargar los álbumes');
    } finally {
      setAlbumsLoading(false);
    }
  };

  const loadRelatedArtists = async () => {
    if (!isConnected) {
      setRelated([]);
      return;
    }

    setRelatedLoading(true);
    try {
      const relatedRes = await deezerApi.getRelatedArtists(artist.id);
      setRelated(relatedRes.data || []);
    } catch (error) {
      console.error('Error cargando artistas relacionados:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Año desc.';
    return dateString.split('-')[0];
  };

  // 👇 FUNCIÓN PARA OBTENER EL TEXTO DEL FILTRO ACTIVO
  const getActiveFilterLabel = () => {
    const filters = {
      'all': 'Todos',
      'album': 'Álbumes',
      'ep': 'EPs',
      'single': 'Singles',
      'live': 'En Vivo',
      'compilation': 'Compilaciones'
    };
    return filters[activeFilter] || 'Filtrar';
  };

  // 👇 MENÚ DE FILTROS
  const renderFilterMenu = () => {
    if (!showFilterMenu) return null;

    const filterOptions = [
      { id: 'all', label: 'Todos', icon: 'albums' },
      { id: 'album', label: 'Álbumes', icon: 'disc' },
      { id: 'ep', label: 'EPs', icon: 'disc-outline' },
      { id: 'single', label: 'Singles', icon: 'musical-note' },
      { id: 'live', label: 'En Vivo', icon: 'mic' },
      { id: 'compilation', label: 'Compilaciones', icon: 'albums-outline' },
    ];

    return (
      <TouchableOpacity 
        style={styles.filterMenuOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterMenu(false)}
      >
        <View style={styles.filterMenu}>
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                activeFilter === option.id && styles.activeFilterOption
              ]}
              onPress={() => {
                setActiveFilter(option.id);
                setShowFilterMenu(false);
              }}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={activeFilter === option.id ? '#9333EA' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[
                styles.filterOptionText,
                activeFilter === option.id && styles.activeFilterOptionText
              ]}>
                {option.label}
              </Text>
              {activeFilter === option.id && (
                <Ionicons name="checkmark" size={18} color="#9333EA" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // Si está cargando, mostrar skeleton
  if (loading || !connectionChecked) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
        
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonBackButton} />
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonArtistName} />
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStatItem} />
            <View style={styles.skeletonStatItem} />
            <View style={styles.skeletonStatItem} />
          </View>
          <View style={styles.skeletonTabs}>
            <View style={styles.skeletonTab} />
            <View style={styles.skeletonTab} />
          </View>
        </View>
      </View>
    );
  }

  const imageUrl = artist.picture_big || artist.picture_medium || artist.picture;
  const fansFormatted = formatFans(artistDetails?.nb_fan || artist.nb_fan);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {renderFilterMenu()}

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.7)"
            colors={['#9333EA']}
          />
        }
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <Animated.View style={[StyleSheet.absoluteFill, imageAnimatedStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
              recyclingKey={`artist-${artist.id}`}
            />
          </Animated.View>

          <LinearGradient
            colors={['transparent', backgroundColor]}
            style={styles.gradient}
            locations={[0.5, 1]}
            pointerEvents="none"
          />
        </View>

        <Text style={styles.artistName} numberOfLines={2}>
          {artist.name}
        </Text>

        {/* Estadísticas del artista */}
        <View style={styles.statsContainer}>
          {fansFormatted && (
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statValue}>{fansFormatted}</Text>
              <Text style={styles.statLabel}>oyentes</Text>
            </View>
          )}
          {albums.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="musical-notes" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statValue}>{albums.length}</Text>
              <Text style={styles.statLabel}>discografía</Text>
            </View>
          )}
        </View>

        {/* Géneros si existen */}
        {artistDetails?.genres?.data && artistDetails.genres.data.length > 0 && (
          <View style={styles.genresContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genresScroll}
            >
              {artistDetails.genres.data.map((genre, index) => (
                <View key={index} style={[styles.genreChip, { backgroundColor: backgroundColor + '40', borderColor: backgroundColor }]}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discography' && styles.activeTab]}
            onPress={() => setActiveTab('discography')}
          >
            <Text style={[styles.tabText, activeTab === 'discography' && styles.activeTabText]}>
              Discografía
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'related' && styles.activeTab]}
            onPress={() => setActiveTab('related')}
          >
            <Text style={[styles.tabText, activeTab === 'related' && styles.activeTabText]}>
              Relacionados
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'discography' ? (
          <>
            {/* Barra de filtros */}
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterMenu(true)}
              >
                <Ionicons name="funnel-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.filterButtonText}>
                  {getActiveFilterLabel()}
                </Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>

              {activeFilter !== 'all' && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setActiveFilter('all')}
                >
                  <Text style={styles.clearFilterText}>Limpiar</Text>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>

            {albumsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
              </View>
            ) : filteredAlbums.length > 0 ? (
              <View>
                {filteredAlbums.map((album) => (
                  <TouchableOpacity
                    key={album.id || album.deezer_id}
                    style={styles.albumCard}
                    onPress={() => navigation.navigate('Album', {
                      album: {
                        id: album.deezer_id || album.id,
                        title: album.title,
                        cover: album.cover_medium || album.cover,
                      },
                      artistName: artist.name,
                      artistId: artist.id,
                      refresh: true
                    })}
                  >
                    <Image
                      source={{ uri: album.cover_medium || album.cover }}
                      style={StyleSheet.absoluteFillObject}
                      blurRadius={15}
                      contentFit="cover"
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                    <View style={styles.albumCardContent}>
                      <Image
                        source={{ uri: album.cover_medium || album.cover }}
                        style={styles.albumCover}
                        contentFit="cover"
                      />
                      <View style={styles.albumInfo}>
                        <Text style={styles.albumTitle} numberOfLines={1}>
                          {album.title}
                        </Text>
                        <View style={styles.albumDetails}>
                          <Text style={styles.albumYear}>
                            {formatDate(album.release_date)}
                          </Text>
                          <Text style={styles.albumType}>
                            {album.displayType}
                          </Text>
                          {album.nb_tracks && (
                            <>
                              <Text style={styles.dot}>•</Text>
                              <Text style={styles.albumTracks}>
                                {album.nb_tracks} {album.nb_tracks === 1 ? 'canción' : 'canciones'}
                              </Text>
                            </>
                          )}
                        </View>
                        <View style={styles.albumFooter}>
                          {album.isDownloaded && (
                            <View style={styles.downloadedBadge}>
                              <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                              <Text style={styles.downloadedText}>En biblioteca</Text>
                            </View>
                          )}
                          {album.average_rating > 0 && (
                            <View style={styles.ratingBadge}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.ratingText}>
                                {album.average_rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={activeFilter !== 'all' ? "filter-outline" : (!isConnected && localArtistId ? "cloud-offline-outline" : "albums-outline")}
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>
                  {activeFilter !== 'all'
                    ? `No hay ${getActiveFilterLabel().toLowerCase()} de este artista`
                    : !isConnected && localArtistId
                      ? 'No hay álbumes descargados de este artista'
                      : 'No hay álbumes disponibles'}
                </Text>
                {activeFilter !== 'all' && (
                  <TouchableOpacity
                    style={styles.resetFilterButton}
                    onPress={() => setActiveFilter('all')}
                  >
                    <Text style={styles.resetFilterText}>Ver todos los álbumes</Text>
                  </TouchableOpacity>
                )}
                {!isConnected && !localArtistId && activeFilter === 'all' && (
                  <Text style={styles.offlineText}>
                    Conéctate a internet para ver los álbumes de {artist.name}
                  </Text>
                )}
                {!isConnected && localArtistId && albums.length === 0 && activeFilter === 'all' && (
                  <Text style={styles.offlineText}>
                    Este artista no tiene álbumes en tu biblioteca
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.relatedContainer}>
            {!isConnected ? (
              <View style={styles.noConnectionContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.noConnectionText}>
                  No disponible sin conexión
                </Text>
              </View>
            ) : relatedLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
              </View>
            ) : related.length > 0 ? (
              <View style={styles.relatedGrid}>
                {related.map((relatedArtist) => (
                  <TouchableOpacity
                    key={relatedArtist.id}
                    style={styles.relatedCard}
                    onPress={() => navigation.push('Artist', { artist: relatedArtist })}
                  >
                    <Image
                      source={{ uri: relatedArtist.picture_medium }}
                      style={styles.relatedImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.relatedGradient}
                    />
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {relatedArtist.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>
                  No hay artistas relacionados
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>
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
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: width,
    height: height * 0.5,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
  },
  artistName: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  genresContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  genresScroll: {
    paddingRight: 20,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  genreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  
  // 👇 ESTILOS PARA FILTROS
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginHorizontal: 4,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  clearFilterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginRight: 4,
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  filterMenu: {
    position: 'absolute',
    top: 320, // Ajusta según la posición de tu botón
    left: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 180,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeFilterOption: {
    backgroundColor: 'rgba(147,51,234,0.1)',
  },
  filterOptionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 10,
  },
  activeFilterOptionText: {
    color: '#9333EA',
  },
  resetFilterButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(147,51,234,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(147,51,234,0.3)',
  },
  resetFilterText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 👇 ESTILOS EXISTENTES
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  offlineText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  albumCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  albumCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  albumCover: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  albumInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  albumTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  albumYear: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  albumType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  dot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginHorizontal: 8,
  },
  albumTracks: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  albumFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadedText: {
    color: '#4ADE80',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  relatedContainer: {
    paddingHorizontal: 20,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  relatedCard: {
    width: (width - 48) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  relatedName: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noConnectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  noConnectionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  // Estilos para skeleton
  skeletonHeader: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  skeletonBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 20,
  },
  skeletonImage: {
    width: width,
    height: height * 0.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonArtistName: {
    width: '70%',
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  skeletonStatItem: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  skeletonTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonTab: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
});