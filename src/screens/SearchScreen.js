import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDeezerSearch } from '../hooks/useDeezerSearch';
import { getDB } from '../database/Index';
import { useFocusEffect } from '@react-navigation/native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { getRatingColor } from '../utils/colors';

const formatRating = (rating) => {
  if (!rating) return '-';
  if (rating === 10) return '10';
  return rating.toFixed(1);
};

const SearchSkeleton = () => {
  return (
    <View style={styles.resultsContainer}>
      <View style={styles.skeletonSection}>
        <View style={styles.skeletonSectionHeader}>
          <View style={styles.skeletonSectionIcon} />
          <View style={styles.skeletonSectionTitle} />
        </View>
        
        <View style={styles.skeletonSubsection}>
          <View style={styles.skeletonSubsectionTitle} />
          {[1, 2, 3].map((i) => (
            <View key={`deezer-album-${i}`} style={styles.skeletonResultCard}>
              <View style={styles.skeletonAlbumImage} />
              <View style={styles.skeletonResultInfo}>
                <View style={styles.skeletonResultTitle} />
                <View style={styles.skeletonResultSubtitle} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.skeletonSubsection}>
          <View style={styles.skeletonSubsectionTitle} />
          {[1, 2].map((i) => (
            <View key={`deezer-artist-${i}`} style={styles.skeletonResultCard}>
              <View style={styles.skeletonArtistImage} />
              <View style={styles.skeletonResultInfo}>
                <View style={styles.skeletonResultTitle} />
                <View style={styles.skeletonResultSubtitle} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.skeletonSection}>
        <View style={styles.skeletonSectionHeader}>
          <View style={styles.skeletonSectionIcon} />
          <View style={styles.skeletonSectionTitle} />
        </View>
        
        <View style={styles.skeletonSubsection}>
          <View style={styles.skeletonSubsectionTitle} />
          {[1, 2, 3].map((i) => (
            <View key={`local-album-${i}`} style={styles.skeletonResultCard}>
              <View style={styles.skeletonAlbumImage} />
              <View style={styles.skeletonResultInfo}>
                <View style={styles.skeletonResultTitle} />
                <View style={styles.skeletonResultSubtitle} />
              </View>
              <View style={styles.skeletonRating} />
            </View>
          ))}
        </View>

        <View style={styles.skeletonSubsection}>
          <View style={styles.skeletonSubsectionTitle} />
          {[1, 2].map((i) => (
            <View key={`local-artist-${i}`} style={styles.skeletonResultCard}>
              <View style={styles.skeletonArtistImage} />
              <View style={styles.skeletonResultInfo}>
                <View style={styles.skeletonResultTitle} />
                <View style={styles.skeletonResultSubtitle} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.skeletonSubsection}>
          <View style={styles.skeletonSubsectionTitle} />
          {[1, 2].map((i) => (
            <View key={`genre-${i}`} style={styles.skeletonResultCard}>
              <View style={styles.skeletonGenreIcon} />
              <View style={styles.skeletonResultInfo}>
                <View style={styles.skeletonResultTitle} />
                <View style={styles.skeletonResultSubtitle} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const AnimatedResultCard = ({ index, onPress, children, style }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 50, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Reanimated.View style={animatedStyle}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Reanimated.View>
  );
};

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [localResults, setLocalResults] = useState({
    artists: [],
    albums: [],
    genres: [],
  });
  const [loadingLocal, setLoadingLocal] = useState(false);
  
  const { loading: loadingDeezer, error, results: deezerResults, search: searchDeezer } = useDeezerSearch();
  
  const searchTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
    }, [navigation])
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const searchLocal = async (query) => {
    if (!query.trim() || !mountedRef.current) return;

    setLoadingLocal(true);
    try {
      const db = await getDB();
      const searchTerm = `%${query.toLowerCase().trim()}%`;

      const artists = await db.getAllAsync(`
        SELECT 
          ar.*,
          ar.deezer_id,
          ar.name,
          ar.picture,
          COUNT(DISTINCT a.id) as album_count,
          AVG(t.rating) as average_rating
        FROM artists ar
        LEFT JOIN albums a ON ar.id = a.artist_id
        LEFT JOIN tracks t ON a.id = t.album_id
        WHERE LOWER(ar.name) LIKE ?
        GROUP BY ar.id
        ORDER BY ar.name
        LIMIT 5
      `, [searchTerm]);

      const albums = await db.getAllAsync(`
        SELECT 
          a.*,
          a.deezer_id,
          a.title,
          a.cover,
          a.is_favorite,
          a.state,
          a.user_description,
          ar.name as artist_name,
          ar.deezer_id as artist_deezer_id,
          COUNT(t.id) as total_tracks,
          AVG(t.rating) as average_rating
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.id
        LEFT JOIN tracks t ON a.id = t.album_id
        WHERE LOWER(a.title) LIKE ? OR LOWER(ar.name) LIKE ?
        GROUP BY a.id
        ORDER BY a.title
        LIMIT 5
      `, [searchTerm, searchTerm]);

      const genreResults = await db.getAllAsync(`
        SELECT DISTINCT 
          a.genres,
          COUNT(*) as album_count
        FROM albums a
        WHERE LOWER(a.genres) LIKE ?
        GROUP BY a.genres
        LIMIT 10
      `, [searchTerm]);

      const genres = [];
      const genreSet = new Set();

      genreResults.forEach(item => {
        if (item.genres) {
          try {
            const parsed = JSON.parse(item.genres);
            if (Array.isArray(parsed)) {
              parsed.forEach(g => {
                const genreName = typeof g === 'object' ? g.name : g;
                if (genreName && genreName.toLowerCase().includes(query.toLowerCase())) {
                  genreSet.add(genreName);
                }
              });
            }
          } catch (e) {}
        }
      });

      genreSet.forEach(genre => {
        genres.push({
          name: genre,
          album_count: 0
        });
      });

      if (mountedRef.current) {
        setLocalResults({
          artists: artists.slice(0, 5),
          albums: albums.slice(0, 5),
          genres: genres.slice(0, 5),
        });
      }

    } catch (error) {
      console.error('Error en búsqueda local:', error);
    } finally {
      if (mountedRef.current) {
        setLoadingLocal(false);
      }
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (text.trim()) {
        searchDeezer(text, activeFilter === 'all' ? 'all' : activeFilter);
        searchLocal(text);
      } else {
        setLocalResults({ artists: [], albums: [], genres: [] });
      }
    }, 500);
  };

  const filters = [
    { id: 'all', label: 'Todo' },
    { id: 'albums', label: 'Álbumes' },
    { id: 'artists', label: 'Artistas' },
    { id: 'local', label: 'Local' },
  ];

  const renderDeezerAlbum = (album) => (
    <TouchableOpacity 
      key={`deezer-album-${album.id}`} 
      style={styles.albumCard}
      onPress={() => {
        navigation.navigate('Album', { 
          album: {
            id: album.id,
            title: album.title,
            cover: album.cover_medium || album.cover_big || album.cover_small,
            release_date: album.release_date,
            nb_tracks: album.nb_tracks
          },
          artistName: album.artist.name,
          artistId: album.artist.id
        });
      }}
    >
      <ImageBackground
        source={{ uri: album.cover_medium || album.cover_big || album.cover_small }}
        style={styles.albumBackground}
        blurRadius={70}
      />
      <View style={styles.albumOverlay} />
      <Image
        source={{ uri: album.cover_medium || album.cover_big || album.cover_small }}
        style={styles.albumCover}
      />
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
        <Text style={styles.albumArtist} numberOfLines={1}>{album.artist.name}</Text>
        <View style={styles.sourceBadge}>
          <Ionicons name="cloud-outline" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={styles.sourceBadgeText}>Deezer</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLocalAlbum = (album) => {
    const ratingColor = album.average_rating ? getRatingColor(album.average_rating) : '#9CA3AF';
    const ratingValue = formatRating(album.average_rating);
    const hasComment = album.user_description && album.user_description.trim().length > 0;

    return (
      <TouchableOpacity
        key={`local-album-${album.id}`}
        style={[styles.localAlbumCard, album.is_favorite === 1 && styles.favoriteCard]}
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
      >
        <ImageBackground
          source={{ uri: album.cover }}
          style={styles.albumBackground}
          blurRadius={70}
        />
        <View style={styles.albumOverlay} />
        <Image
          source={{ uri: album.cover }}
          style={styles.albumCover}
        />
        <View style={[styles.albumInfo, hasComment && styles.albumInfoWithComment]}>
          <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.albumArtist} numberOfLines={1}>{album.artist_name}</Text>
          
          <View style={styles.albumMetaRow}>
            <View style={styles.sourceBadge}>
              <Ionicons name="library-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.sourceBadgeText}>Mi biblioteca</Text>
            </View>
            {album.average_rating > 0 && (
              <View style={[styles.resultRating, { backgroundColor: ratingColor + '20' }]}>
                <Text style={[styles.resultRatingText, { color: ratingColor }]}>
                  {ratingValue}
                </Text>
              </View>
            )}
          </View>
          
          {hasComment && (
            <View style={styles.commentContainer}>
              <Ionicons name="chatbubble-outline" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.albumComment} numberOfLines={2}>
                {album.user_description}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDeezerArtist = (artist) => (
    <TouchableOpacity
      key={`deezer-artist-${artist.id}`}
      style={styles.artistCard}
      onPress={() => navigation.navigate('Artist', { artist })}
    >
      <ImageBackground
        source={{ uri: artist.picture_medium || artist.picture_big || artist.picture_small }}
        style={styles.artistBackground}
        blurRadius={70}
      />
      <View style={styles.artistOverlay} />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
        {artist.nb_fan ? (
          <Text style={styles.artistFans}>
            {artist.nb_fan.toLocaleString()} fans
          </Text>
        ) : null}
        <View style={styles.sourceBadge}>
          <Ionicons name="cloud-outline" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={styles.sourceBadgeText}>Deezer</Text>
        </View>
      </View>
      <Image
        source={{ uri: artist.picture_medium || artist.picture_big || artist.picture_small }}
        style={styles.artistImage}
      />
    </TouchableOpacity>
  );

  const renderLocalArtist = (artist) => {
    const ratingColor = artist.average_rating ? getRatingColor(artist.average_rating) : '#9CA3AF';
    const ratingValue = formatRating(artist.average_rating);

    return (
      <TouchableOpacity
        key={`local-artist-${artist.id}`}
        style={styles.localArtistCard}
        onPress={() => navigation.navigate('Artist', {
          artist: {
            id: artist.deezer_id,
            name: artist.name,
            picture: artist.picture
          }
        })}
      >
        <ImageBackground
          source={{ uri: artist.picture }}
          style={styles.artistBackground}
          blurRadius={70}
        />
        <View style={styles.artistOverlay} />
        <View style={styles.artistInfo}>
          <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
          <Text style={styles.artistFans}>
            {artist.album_count || 0} {artist.album_count === 1 ? 'álbum' : 'álbumes'} en tu biblioteca
          </Text>
          <View style={styles.artistMetaRow}>
            <View style={styles.sourceBadge}>
              <Ionicons name="library-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.sourceBadgeText}>Mi biblioteca</Text>
            </View>
            {artist.average_rating > 0 && (
              <View style={[styles.resultRating, { backgroundColor: ratingColor + '20' }]}>
                <Text style={[styles.resultRatingText, { color: ratingColor }]}>
                  {ratingValue}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Image
          source={{ uri: artist.picture }}
          style={styles.artistImage}
        />
      </TouchableOpacity>
    );
  };

  const renderLocalGenre = (genre) => (
    <TouchableOpacity
      key={`genre-${genre.name}`}
      style={styles.genreCard}
      onPress={() => navigation.navigate('Genre', { genre: genre.name })}
    >
      <View style={styles.genreContent}>
        <View style={styles.genreIconContainer}>
          <Ionicons name="pricetag" size={20} color="#9333EA" />
        </View>
        <View style={styles.genreInfo}>
          <Text style={styles.genreName} numberOfLines={1}>{genre.name}</Text>
          <View style={styles.sourceBadge}>
            <Ionicons name="library-outline" size={10} color="rgba(255,255,255,0.7)" />
            <Text style={styles.sourceBadgeText}>Mi biblioteca</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyLocalMessage = (type) => {
    let icon, title, message;
    
    if (type === 'albums') {
      icon = 'albums-outline';
      title = 'No hay álbumes en tu biblioteca';
      message = 'Los álbumes que guardes aparecerán aquí';
    } else if (type === 'artists') {
      icon = 'people-outline';
      title = 'No hay artistas en tu biblioteca';
      message = 'Los artistas de tus álbumes aparecerán aquí';
    } else if (type === 'genres') {
      icon = 'pricetags-outline';
      title = 'No hay géneros en tu biblioteca';
      message = 'Los géneros de tus álbumes aparecerán aquí';
    } else {
      icon = 'library-outline';
      title = 'No hay resultados en tu biblioteca';
      message = 'Prueba con otra búsqueda o guarda nuevos álbumes';
    }

    return (
      <View style={styles.emptyLocalContainer}>
        <Ionicons name={icon} size={40} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyLocalTitle}>{title}</Text>
        <Text style={styles.emptyLocalSubtitle}>{message}</Text>
      </View>
    );
  };

  const renderResults = () => {
    const isLoading = loadingDeezer || loadingLocal;

    if (!searchQuery.trim() && !isLoading) {
      return (
        <View style={styles.emptySearchState}>
          <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptySearchTitle}>Busca música</Text>
          <Text style={styles.emptySearchSubtitle}>
            Encuentra álbumes y artistas en Deezer o en tu biblioteca
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.resultsContainer}>
          <SearchSkeleton />
        </View>
      );
    }

    const showAll = activeFilter === 'all';
    const showAlbums = activeFilter === 'albums' || showAll;
    const showArtists = activeFilter === 'artists' || showAll;
    const showLocal = activeFilter === 'local' || showAll;

    const hasDeezerAlbums = deezerResults.albums?.length > 0;
    const hasDeezerArtists = deezerResults.artists?.length > 0;
    const hasLocalAlbums = localResults.albums.length > 0;
    const hasLocalArtists = localResults.artists.length > 0;
    const hasLocalGenres = localResults.genres.length > 0;

    const hasAnyResults = hasDeezerAlbums || hasDeezerArtists || hasLocalAlbums || hasLocalArtists || hasLocalGenres;

    if (!hasAnyResults && searchQuery.trim()) {
      return (
        <View style={styles.resultsPlaceholder}>
          <Ionicons name="sad-outline" size={60} color="rgba(255,255,255,0.3)" />
          <Text style={styles.placeholderText}>No se encontraron resultados</Text>
          <Text style={styles.placeholderSubtext}>Prueba con otra búsqueda</Text>
        </View>
      );
    }

    let cardIndex = 0;

    return (
      <View style={styles.resultsContainer}>
        {activeFilter !== 'local' && (hasDeezerAlbums || hasDeezerArtists) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconDeezer}>
                <Ionicons name="cloud" size={14} color="#60A5FA" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#93C5FD' }]}>En Deezer</Text>
            </View>

            {showAlbums && hasDeezerAlbums && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Álbumes</Text>
                {deezerResults.albums.map((album) => {
                  const idx = cardIndex++;
                  return (
                    <AnimatedResultCard
                      key={`deezer-album-${album.id}`}
                      index={idx}
                      style={[styles.albumCard, styles.deezerCard]}
                      onPress={() => navigation.navigate('Album', {
                        album: {
                          id: album.id,
                          title: album.title,
                          cover: album.cover_medium || album.cover_big || album.cover_small,
                          release_date: album.release_date,
                          nb_tracks: album.nb_tracks
                        },
                        artistName: album.artist.name,
                        artistId: album.artist.id
                      })}
                    >
                      <ImageBackground
                        source={{ uri: album.cover_medium || album.cover_big }}
                        style={styles.albumBackground}
                        blurRadius={70}
                      />
                      <View style={[styles.albumOverlay, styles.deezerOverlay]} />
                      <Image source={{ uri: album.cover_medium || album.cover_big }} style={styles.albumCover} />
                      <View style={styles.albumInfo}>
                        <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                        <Text style={styles.albumArtist} numberOfLines={1}>{album.artist.name}</Text>
                        <View style={[styles.sourceBadge, styles.sourceBadgeDeezer]}>
                          <Ionicons name="cloud-outline" size={10} color="#93C5FD" />
                          <Text style={[styles.sourceBadgeText, { color: '#93C5FD' }]}>Deezer</Text>
                        </View>
                      </View>
                    </AnimatedResultCard>
                  );
                })}
              </View>
            )}

            {showArtists && hasDeezerArtists && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Artistas</Text>
                {deezerResults.artists.map((artist) => {
                  const idx = cardIndex++;
                  return (
                    <AnimatedResultCard
                      key={`deezer-artist-${artist.id}`}
                      index={idx}
                      style={[styles.artistCard, styles.deezerCard]}
                      onPress={() => navigation.navigate('Artist', { artist })}
                    >
                      <ImageBackground
                        source={{ uri: artist.picture_medium || artist.picture_big }}
                        style={styles.artistBackground}
                        blurRadius={70}
                      />
                      <View style={[styles.artistOverlay, styles.deezerOverlay]} />
                      <View style={styles.artistInfo}>
                        <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
                        {artist.nb_fan ? (
                          <Text style={styles.artistFans}>{artist.nb_fan.toLocaleString()} fans</Text>
                        ) : null}
                        <View style={[styles.sourceBadge, styles.sourceBadgeDeezer]}>
                          <Ionicons name="cloud-outline" size={10} color="#93C5FD" />
                          <Text style={[styles.sourceBadgeText, { color: '#93C5FD' }]}>Deezer</Text>
                        </View>
                      </View>
                      <Image source={{ uri: artist.picture_medium || artist.picture_big }} style={styles.artistImage} />
                    </AnimatedResultCard>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {(hasLocalAlbums || hasLocalArtists || hasLocalGenres) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconLocal}>
                <Ionicons name="library" size={14} color="#4ADE80" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#86EFAC' }]}>En tu biblioteca</Text>
            </View>

            {(activeFilter === 'all' || activeFilter === 'albums' || activeFilter === 'local') && hasLocalAlbums && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Álbumes</Text>
                {localResults.albums.map((album) => {
                  const idx = cardIndex++;
                  const ratingColor = album.average_rating ? getRatingColor(album.average_rating) : '#9CA3AF';
                  const hasComment = album.user_description && album.user_description.trim().length > 0;
                  return (
                    <AnimatedResultCard
                      key={`local-album-${album.id}`}
                      index={idx}
                      style={[styles.localAlbumCard, styles.localCard, album.is_favorite === 1 && styles.favoriteCard]}
                      onPress={() => navigation.navigate('Album', {
                        album: { id: album.deezer_id, title: album.title, cover: album.cover },
                        artistName: album.artist_name,
                        artistId: album.artist_deezer_id,
                        refresh: true
                      })}
                    >
                      <ImageBackground source={{ uri: album.cover }} style={styles.albumBackground} blurRadius={70} />
                      <View style={[styles.albumOverlay, styles.localOverlay]} />
                      <Image source={{ uri: album.cover }} style={styles.albumCover} />
                      <View style={[styles.albumInfo, hasComment && styles.albumInfoWithComment]}>
                        <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                        <Text style={styles.albumArtist} numberOfLines={1}>{album.artist_name}</Text>
                        <View style={styles.albumMetaRow}>
                          <View style={[styles.sourceBadge, styles.sourceBadgeLocal]}>
                            <Ionicons name="library-outline" size={10} color="#4ADE80" />
                            <Text style={[styles.sourceBadgeText, { color: '#4ADE80' }]}>Mi biblioteca</Text>
                          </View>
                          {album.average_rating > 0 && (
                            <View style={[styles.resultRating, { backgroundColor: ratingColor + '20' }]}>
                              <Text style={[styles.resultRatingText, { color: ratingColor }]}>
                                {formatRating(album.average_rating)}
                              </Text>
                            </View>
                          )}
                        </View>
                        {hasComment && (
                          <View style={styles.commentContainer}>
                            <Ionicons name="chatbubble-outline" size={12} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.albumComment} numberOfLines={2}>{album.user_description}</Text>
                          </View>
                        )}
                      </View>
                    </AnimatedResultCard>
                  );
                })}
              </View>
            )}

            {(activeFilter === 'all' || activeFilter === 'artists' || activeFilter === 'local') && hasLocalArtists && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Artistas</Text>
                {localResults.artists.map((artist) => {
                  const idx = cardIndex++;
                  const ratingColor = artist.average_rating ? getRatingColor(artist.average_rating) : '#9CA3AF';
                  return (
                    <AnimatedResultCard
                      key={`local-artist-${artist.id}`}
                      index={idx}
                      style={[styles.localArtistCard, styles.localCard]}
                      onPress={() => navigation.navigate('Artist', {
                        artist: { id: artist.deezer_id, name: artist.name, picture: artist.picture }
                      })}
                    >
                      <ImageBackground source={{ uri: artist.picture }} style={styles.artistBackground} blurRadius={70} />
                      <View style={[styles.artistOverlay, styles.localOverlay]} />
                      <View style={styles.artistInfo}>
                        <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
                        <Text style={styles.artistFans}>
                          {artist.album_count || 0} {artist.album_count === 1 ? 'álbum' : 'álbumes'} en tu biblioteca
                        </Text>
                        <View style={styles.artistMetaRow}>
                          <View style={[styles.sourceBadge, styles.sourceBadgeLocal]}>
                            <Ionicons name="library-outline" size={10} color="#4ADE80" />
                            <Text style={[styles.sourceBadgeText, { color: '#4ADE80' }]}>Mi biblioteca</Text>
                          </View>
                          {artist.average_rating > 0 && (
                            <View style={[styles.resultRating, { backgroundColor: ratingColor + '20', marginLeft: 8 }]}>
                              <Text style={[styles.resultRatingText, { color: ratingColor }]}>
                                {formatRating(artist.average_rating)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Image source={{ uri: artist.picture }} style={styles.artistImage} />
                    </AnimatedResultCard>
                  );
                })}
              </View>
            )}

            {(activeFilter === 'all' || activeFilter === 'local') && hasLocalGenres && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Géneros</Text>
                {localResults.genres.map((genre) => {
                  const idx = cardIndex++;
                  return (
                    <AnimatedResultCard
                      key={`genre-${genre.name}`}
                      index={idx}
                      style={styles.genreCard}
                      onPress={() => navigation.navigate('Genre', { genre: genre.name })}
                    >
                      <View style={styles.genreContent}>
                        <View style={styles.genreIconContainer}>
                          <Ionicons name="pricetag" size={20} color="#4ADE80" />
                        </View>
                        <View style={styles.genreInfo}>
                          <Text style={styles.genreName} numberOfLines={1}>{genre.name}</Text>
                          <View style={[styles.sourceBadge, styles.sourceBadgeLocal]}>
                            <Ionicons name="library-outline" size={10} color="#4ADE80" />
                            <Text style={[styles.sourceBadgeText, { color: '#4ADE80' }]}>Mi biblioteca</Text>
                          </View>
                        </View>
                      </View>
                    </AnimatedResultCard>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.titulo}>Buscar Música</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca álbumes o artistas..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setLocalResults({ artists: [], albums: [], genres: [] });
            }}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renderResults()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    marginHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    padding: 0,
  },
  filtersContainer: {
    flexGrow: 0,
    marginBottom: 30,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  filterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptySearchTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySearchSubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionIconDeezer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(96,165,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionIconLocal: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(74,222,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deezerCard: {
    borderColor: 'rgba(96,165,250,0.2)',
  },
  deezerOverlay: {
    backgroundColor: 'rgba(10,20,50,0.45)',
  },
  localCard: {
    borderColor: 'rgba(74,222,128,0.2)',
  },
  localOverlay: {
    backgroundColor: 'rgba(5,30,20,0.45)',
  },
  sourceBadgeDeezer: {
    backgroundColor: 'rgba(30,58,138,0.6)',
  },
  sourceBadgeLocal: {
    backgroundColor: 'rgba(5,46,22,0.6)',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  sourceBadgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginLeft: 2,
    fontWeight: '500',
  },
  albumMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  artistMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  albumComment: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 4,
    lineHeight: 16,
  },
  resultRating: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  resultRatingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },

  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  localAlbumCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 90,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  albumBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  albumOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  albumCover: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginLeft: 12,
    marginTop: 10,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  albumInfo: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
    marginVertical: 10,
    zIndex: 2,
  },
  albumInfoWithComment: {
    marginBottom: 8,
  },
  albumTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  albumArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 104,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  localArtistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 104,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  artistBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  artistOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 20,
    marginRight: 90,
    zIndex: 2,
  },
  artistName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  artistFans: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    right: 12,
    zIndex: 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  genreCard: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  genreIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147,51,234,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  genreInfo: {
    flex: 1,
  },
  genreName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  resultsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginHorizontal: 20,
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  emptyLocalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  emptyLocalTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyLocalSubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
  },

  skeletonSection: {
    marginBottom: 30,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonSectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonSubsection: {
    marginBottom: 20,
  },
  skeletonSubsectionTitle: {
    width: 100,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    marginBottom: 12,
    marginLeft: 4,
  },
  skeletonResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    marginBottom: 15,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonAlbumImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonArtistImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonGenreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonResultTitle: {
    width: '70%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonResultSubtitle: {
    width: '50%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonRating: {
    width: 40,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginLeft: 8,
  },
});