import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { executeDBOperation } from '../database/Index';
import { getRatingColor } from '../utils/colors';

const { width } = Dimensions.get('window');

const HomeSkeleton = () => {
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={styles.header}>
        <View style={styles.skeletonHeaderTitle} />
        <View style={styles.skeletonStatsRow}>
          <View style={styles.skeletonStatItem}>
            <View style={styles.skeletonStatNumber} />
            <View style={styles.skeletonStatLabel} />
          </View>
          <View style={styles.skeletonStatDivider} />
          <View style={styles.skeletonStatItem}>
            <View style={styles.skeletonStatNumber} />
            <View style={styles.skeletonStatLabel} />
          </View>
          <View style={styles.skeletonStatDivider} />
          <View style={styles.skeletonStatItem}>
            <View style={styles.skeletonStatNumber} />
            <View style={styles.skeletonStatLabel} />
          </View>
        </View>
      </View>

      <View style={styles.featuredSection}>
        <View style={styles.skeletonSectionHeader}>
          <View style={styles.skeletonSectionIcon} />
          <View style={styles.skeletonSectionTitle} />
        </View>
        <View style={styles.skeletonFeaturedCard} />
      </View>

      {/* Mosaic skeleton */}
      <View style={styles.mosaicSection}>
        <View style={styles.skeletonSectionHeader}>
          <View style={styles.skeletonSectionIcon} />
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonSectionCount} />
        </View>
        <View style={styles.mosaicContainer}>
          {[1, 2, 3, 4].map((row) => (
            <View key={row} style={styles.mosaicRow}>
              <View style={styles.skeletonMosaicItem} />
              <View style={styles.skeletonMosaicItem} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [mosaicAlbums, setMosaicAlbums] = useState([]);
  const [featuredAlbum, setFeaturedAlbum] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [albumRating, setAlbumRating] = useState(0);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    listened: 0,
    listening: 0,
    to_listen: 0,
    favorites: 0
  });

  const mountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      await executeDBOperation(async (db) => {
        
        const stats = await db.getFirstAsync(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN state = 'listened' THEN 1 ELSE 0 END) as listened,
            SUM(CASE WHEN state = 'listening' THEN 1 ELSE 0 END) as listening,
            SUM(CASE WHEN state = 'to_listen' THEN 1 ELSE 0 END) as to_listen,
            SUM(is_favorite) as favorites
          FROM albums
        `);

        if (mountedRef.current) {
          setTotalStats({
            total: stats?.total || 0,
            listened: stats?.listened || 0,
            listening: stats?.listening || 0,
            to_listen: stats?.to_listen || 0,
            favorites: stats?.favorites || 0
          });
        }

        const featured = await db.getFirstAsync(`
          SELECT a.*, ar.name as artist_name
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.cover IS NOT NULL
          ORDER BY RANDOM()
          LIMIT 1
        `);

        if (featured && mountedRef.current) {
          setFeaturedAlbum(featured);

          const color = await getAlbumColor(featured);
          setBackgroundColor(color);

          const ratingResult = await db.getFirstAsync(
            'SELECT AVG(rating) as avg_rating FROM tracks WHERE album_id = ? AND rating IS NOT NULL',
            [featured.id]
          );
          setAlbumRating(ratingResult?.avg_rating || 0);
        }

        const albums = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.cover IS NOT NULL 
            AND a.state IN ('to_listen', 'listening')
          ORDER BY RANDOM()
          LIMIT 15
        `);

        if (mountedRef.current) {
          setMosaicAlbums(albums);
        }
      });
    } catch (error) {
      if (__DEV__) console.error('❌ Error cargando datos:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  const getAlbumColor = async (album) => {
    if (!album?.cover) return '#000000';

    try {
      const colors = await ImageColors.getColors(album.cover, {
        fallback: '#000000',
        cache: true,
        key: album.id?.toString() || 'default',
      });

      switch (colors.platform) {
        case 'android':
          return colors.dominant || colors.vibrant || '#000000';
        case 'ios':
          return colors.background || colors.primary || '#000000';
        default:
          return '#000000';
      }
    } catch (error) {
      if (__DEV__) console.error('Error extrayendo color:', error);
      return '#000000';
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderMosaic = () => {
    if (mosaicAlbums.length === 0) return null;

    const rows = [];
    for (let i = 0; i < mosaicAlbums.length; i += 2) {
      const rowAlbums = mosaicAlbums.slice(i, i + 2);
      rows.push(
        <View key={i} style={styles.mosaicRow}>
          {rowAlbums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={styles.mosaicItem}
              onPress={() => navigation.navigate('Album', {
                album: {
                  id: album.deezer_id,
                  title: album.title,
                  cover: album.cover
                },
                artistName: album.artist_name,
                artistId: album.artist_id,
                refresh: true
              })}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: album.cover }}
                style={styles.mosaicImage}
                contentFit="cover"
                transition={300}
              />

              <View style={[
                styles.stateBadge,
                { backgroundColor: album.state === 'listening' ? '#60A5FA' : '#FBBF24' }
              ]}>
                <Ionicons
                  name={album.state === 'listening' ? 'headset' : 'time'}
                  size={12}
                  color="white"
                />
              </View>
            </TouchableOpacity>
          ))}
          {rowAlbums.length < 2 && (
            <View style={[styles.mosaicItem, styles.mosaicPlaceholder]} />
          )}
        </View>
      );
    }
    return rows;
  };

  if (loading) {
    return <HomeSkeleton />;
  }

  const ratingColor = getRatingColor(albumRating);

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor }]} />

      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />

      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Colección</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalStats.total}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalStats.listened}</Text>
              <Text style={styles.statLabel}>escuchados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalStats.favorites}</Text>
              <Text style={styles.statLabel}>favoritos</Text>
            </View>
          </View>
        </View>

        {featuredAlbum && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.sectionTitle}>Álbum destacado</Text>
            </View>

            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => navigation.navigate('Album', {
                album: {
                  id: featuredAlbum.deezer_id,
                  title: featuredAlbum.title,
                  cover: featuredAlbum.cover
                },
                artistName: featuredAlbum.artist_name,
                artistId: featuredAlbum.artist_id,
                refresh: true
              })}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: featuredAlbum.cover }}
                style={styles.featuredImage}
                contentFit="cover"
              />

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
                style={styles.featuredGradient}
                locations={[0.2, 0.45, 0.72, 1]}
              />

              <View style={styles.featuredOverlay}>
                <View style={styles.featuredStateRow}>
                  {(() => {
                    const STATE_CONFIG = {
                      listened:  { label: 'Escuchado',    icon: 'checkmark-circle', color: '#4ADE80' },
                      listening: { label: 'Escuchando',   icon: 'headset',          color: '#60A5FA' },
                      to_listen: { label: 'Por escuchar', icon: 'time',             color: '#FBBF24' },
                    };
                    const cfg = STATE_CONFIG[featuredAlbum.state];
                    return cfg ? (
                      <View style={[styles.featuredStateChip, { borderColor: cfg.color + '60' }]}>
                        <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                        <Text style={[styles.featuredStateText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    ) : null;
                  })()}
                  {featuredAlbum.is_favorite === 1 && (
                    <View style={styles.featuredFavChip}>
                      <Ionicons name="star" size={11} color="#FFD700" />
                    </View>
                  )}
                </View>

                <View style={styles.featuredHeader}>
                  <View style={styles.featuredTitleContainer}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featuredAlbum.title}
                    </Text>
                    <Text style={styles.featuredArtist}>
                      {featuredAlbum.artist_name}
                    </Text>
                  </View>

                  {albumRating > 0 && (
                    <View style={[styles.featuredRating, { backgroundColor: ratingColor + '20' }]}>
                      <Text style={[styles.featuredRatingText, { color: ratingColor }]}>
                        {albumRating === 10 ? '10' : albumRating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {featuredAlbum.user_description ? (
                  <View style={styles.featuredComment}>
                    <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.featuredCommentText} numberOfLines={2}>
                      {featuredAlbum.user_description}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.featuredFooter}>
                  {featuredAlbum.record_type && (
                    <View style={styles.featuredMeta}>
                      <Ionicons name="disc-outline" size={12} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.featuredMetaText}>
                        {featuredAlbum.record_type.charAt(0).toUpperCase() + featuredAlbum.record_type.slice(1)}
                      </Text>
                    </View>
                  )}
                  {featuredAlbum.total_tracks > 0 && (
                    <>
                      {featuredAlbum.record_type && <Text style={styles.featuredMetaDot}>•</Text>}
                      <View style={styles.featuredMeta}>
                        <Ionicons name="musical-notes" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.featuredMetaText}>
                          {featuredAlbum.total_tracks} canciones
                        </Text>
                      </View>
                    </>
                  )}
                  {featuredAlbum.release_date && (
                    <>
                      <Text style={styles.featuredMetaDot}>•</Text>
                      <View style={styles.featuredMeta}>
                        <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.featuredMetaText}>
                          {new Date(featuredAlbum.release_date).getFullYear()}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {mosaicAlbums.length > 0 ? (
          <View style={styles.mosaicSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.sectionTitle}>Por escuchar</Text>
              <Text style={styles.sectionCount}>{mosaicAlbums.length}</Text>
            </View>
            <View style={styles.mosaicContainer}>
              {renderMosaic()}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-done" size={48} color="#666" />
            </View>
            <Text style={styles.emptyTitle}>¡Todo escuchado!</Text>
            <Text style={styles.emptySubtitle}>
              No tienes álbumes pendientes
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '300',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
    pointerEvents: 'none',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '400',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
    marginLeft: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '300',
  },

  featuredSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featuredTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  featuredArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredRating: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featuredRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuredComment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featuredCommentText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  featuredStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  featuredStateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredStateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  featuredFavChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginLeft: 4,
  },
  featuredMetaDot: {
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
    fontSize: 12,
  },

  mosaicSection: {
    marginBottom: 20,
  },
  mosaicContainer: {
    paddingHorizontal: 16,
  },
  mosaicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mosaicItem: {
    width: (width - 52) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mosaicImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  stateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mosaicGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  mosaicOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  mosaicTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mosaicArtist: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mosaicPlaceholder: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  skeletonHeaderTitle: {
    width: 150,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  skeletonStatNumber: {
    width: 40,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 50,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 8,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonSectionCount: {
    width: 30,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    marginLeft: 8,
  },
  skeletonFeaturedCard: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginHorizontal: 20,
  },
  skeletonMosaicItem: {
    width: (width - 52) / 2,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});