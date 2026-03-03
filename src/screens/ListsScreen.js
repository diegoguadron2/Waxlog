// screens/ListsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { executeDBOperation } from '../database/Index';
import { useFocusEffect } from '@react-navigation/native';
import { tabBarStyle } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// Colores pastel del 1 al 10
const getRatingColor = (rating) => {
  if (!rating) return '#9CA3AF';
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return colors[index];
};

// Formatear nota
const formatRating = (rating) => {
  if (!rating) return '-';
  if (rating === 10) return '10';
  return rating.toFixed(1);
};

// Componente Skeleton para listas
const ListsSkeleton = () => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
    {/* Random album skeleton */}
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionHeader}>
        <View style={styles.skeletonSectionIcon} />
        <View style={styles.skeletonSectionTitle} />
      </View>
      <View style={styles.skeletonRandomAlbumCard} />
      <View style={styles.skeletonRandomAlbumButton} />
    </View>

    {/* Recent albums skeleton */}
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionHeader}>
        <View style={styles.skeletonSectionIcon} />
        <View style={styles.skeletonSectionTitle} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={`recent-${i}`} style={styles.skeletonAlbumCard} />
        ))}
      </ScrollView>
    </View>

    {/* Decades skeleton */}
    {['2020s', '2010s', '2000s', '90s', '80s'].map((decade) => (
      <View key={decade} style={styles.skeletonSection}>
        <View style={styles.skeletonSectionHeader}>
          <View style={styles.skeletonSectionIcon} />
          <View style={[styles.skeletonSectionTitle, { width: 60 }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={`${decade}-${i}`} style={styles.skeletonAlbumCard} />
          ))}
        </ScrollView>
      </View>
    ))}

    {/* Anniversaries skeleton */}
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionHeader}>
        <View style={styles.skeletonSectionIcon} />
        <View style={styles.skeletonSectionTitle} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={`anniv-${i}`} style={styles.skeletonAlbumCard} />
        ))}
      </ScrollView>
    </View>
  </ScrollView>
);

// Componente Skeleton para estadísticas
const StatsSkeleton = () => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={[styles.tabContent, styles.statsTabContent]}
  >
    {/* Stats grid skeleton - primera fila */}
    <View style={styles.statsGrid}>
      {[1, 2, 3].map((i) => (
        <View key={`stat1-${i}`} style={styles.skeletonStatCard}>
          <View style={styles.skeletonStatIcon} />
          <View style={styles.skeletonStatValue} />
          <View style={styles.skeletonStatLabel} />
        </View>
      ))}
    </View>

    {/* Stats grid skeleton - segunda fila */}
    <View style={styles.statsGrid}>
      {[1, 2, 3].map((i) => (
        <View key={`stat2-${i}`} style={styles.skeletonStatCard}>
          <View style={styles.skeletonStatIcon} />
          <View style={styles.skeletonStatValue} />
          <View style={styles.skeletonStatLabel} />
        </View>
      ))}
    </View>

    {/* Chart skeleton */}
    <View style={styles.skeletonChartContainer}>
      <View style={styles.skeletonChartTitle} />
      <View style={styles.barChart}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <View key={`bar-${i}`} style={styles.barColumn}>
            <View style={[styles.skeletonBar, { height: Math.random() * 100 + 50 }]} />
            <View style={styles.skeletonBarLabel} />
            <View style={styles.skeletonBarCount} />
          </View>
        ))}
      </View>
    </View>

    {/* Completion detail skeleton */}
    <View style={styles.skeletonCompletionDetail}>
      <View style={styles.completionHeader}>
        <View style={styles.skeletonCompletionTitle} />
        <View style={styles.skeletonCompletionValue} />
      </View>
      <View style={styles.skeletonProgressContainer}>
        <View style={[styles.skeletonProgressBar, { width: '60%' }]} />
      </View>
      <View style={styles.skeletonCompletionSubtext} />
    </View>

    <View style={styles.bottomSpacer} />
  </ScrollView>
);

export default function ListsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('lists');
  const [randomAlbumLoading, setRandomAlbumLoading] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalArtists: 0,
    totalAlbums: 0,
    totalTracks: 0,
    totalRatedTracks: 0,
    avgRating: 0,
    completionRate: 0,
    ratedPercentage: 0,
    ratingDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [lists, setLists] = useState({
    recentAlbums: [],
    byDecade: {
      '80s': [],
      '90s': [],
      '2000s': [],
      '2010s': [],
      '2020s': [],
    },
    anniversaries: [],
    forgotten: [],
    topRated: [],
    pending: [],
    completed: [],
  });

  const [randomAlbum, setRandomAlbum] = useState(null);

  const tabs = [
    { id: 'lists', label: 'Listas', icon: 'list' },
    { id: 'stats', label: 'Estadísticas', icon: 'stats-chart' },
  ];

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: tabBarStyle
      });
    }, [navigation])
  );

  // Cargar todos los datos al montar
  useEffect(() => {
    loadAllData();
  }, []);

  // Función para extraer color de la imagen
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
      console.error('Error extrayendo color:', error);
      return '#000000';
    }
  };

  // Cargar álbum aleatorio
  const loadRandomAlbum = async () => {
    try {
      const album = await executeDBOperation(async (db) => {
        return await db.getFirstAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.state IN ('to_listen', 'listening') AND a.cover IS NOT NULL
          ORDER BY RANDOM()
          LIMIT 1
        `);
      });

      setRandomAlbum(album);

      if (album) {
        const color = await getAlbumColor(album);
        setBackgroundColor(color);
      } else {
        setBackgroundColor('#1a1a1a');
      }
    } catch (error) {
      console.error('Error cargando álbum aleatorio:', error);
      setBackgroundColor('#1a1a1a');
    }
  };

  // Cargar todas las listas
  const loadLists = async () => {
    try {
      const result = await executeDBOperation(async (db) => {
        // Álbumes recientes (últimos 10 agregados)
        const recent = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.cover IS NOT NULL
          ORDER BY a.downloaded_at DESC
          LIMIT 10
        `);

        // Por década
        const byDecade = {
          '80s': [],
          '90s': [],
          '2000s': [],
          '2010s': [],
          '2020s': [],
        };

        const decadeAlbums = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id,
                 strftime('%Y', a.release_date) as release_year
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.release_date IS NOT NULL AND a.cover IS NOT NULL
          ORDER BY a.release_date DESC
        `);

        decadeAlbums.forEach(album => {
          const year = parseInt(album.release_year);
          if (year >= 2020) byDecade['2020s'].push(album);
          else if (year >= 2010) byDecade['2010s'].push(album);
          else if (year >= 2000) byDecade['2000s'].push(album);
          else if (year >= 1990) byDecade['90s'].push(album);
          else if (year >= 1980) byDecade['80s'].push(album);
        });

        // Limitar a 5 por década
        Object.keys(byDecade).forEach(key => {
          byDecade[key] = byDecade[key].slice(0, 5);
        });

        // Aniversarios (álbumes que cumplen años este mes)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;

        const anniversaries = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id,
                 strftime('%Y', a.release_date) as release_year
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.release_date IS NOT NULL 
            AND a.cover IS NOT NULL
            AND strftime('%m', a.release_date) = ?
          ORDER BY a.release_date DESC
          LIMIT 10
        `, [currentMonth.toString().padStart(2, '0')]);

        // Olvidados (álbumes en 'to_listen' con más de 30 días)
        const forgotten = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.state = 'to_listen' 
            AND a.cover IS NOT NULL
            AND julianday('now') - julianday(a.downloaded_at) > 30
          ORDER BY a.downloaded_at ASC
          LIMIT 10
        `);

        // Mejor calificados
        const topRated = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id,
                 AVG(t.rating) as avg_rating
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          LEFT JOIN tracks t ON a.id = t.album_id
          WHERE a.cover IS NOT NULL
          GROUP BY a.id
          HAVING avg_rating >= 8
          ORDER BY avg_rating DESC
          LIMIT 10
        `);

        // Pendientes
        const pending = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          WHERE a.state = 'to_listen' AND a.cover IS NOT NULL
          ORDER BY a.downloaded_at DESC
          LIMIT 10
        `);

        // Completos
        const completed = await db.getAllAsync(`
          SELECT a.*, ar.name as artist_name, ar.deezer_id as artist_deezer_id,
                 COUNT(t.id) as total_tracks,
                 COUNT(CASE WHEN t.rating IS NOT NULL THEN 1 END) as rated_tracks
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          LEFT JOIN tracks t ON a.id = t.album_id
          WHERE a.cover IS NOT NULL
          GROUP BY a.id
          HAVING total_tracks > 0 AND total_tracks = rated_tracks
          ORDER BY a.downloaded_at DESC
          LIMIT 10
        `);

        return {
          recentAlbums: recent,
          byDecade,
          anniversaries,
          forgotten,
          topRated,
          pending,
          completed,
        };
      });

      setLists(result);
    } catch (error) {
      console.error('Error cargando listas:', error);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const result = await executeDBOperation(async (db) => {
        // Estadísticas generales
        const generalStats = await db.getFirstAsync(`
          SELECT 
            (SELECT COUNT(*) FROM artists) as totalArtists,
            (SELECT COUNT(*) FROM albums) as totalAlbums,
            (SELECT COUNT(*) FROM tracks t
             INNER JOIN albums a ON t.album_id = a.id) as totalTracks,
            (SELECT COUNT(*) FROM tracks t
             INNER JOIN albums a ON t.album_id = a.id
             WHERE t.rating IS NOT NULL) as totalRatedTracks,
            (SELECT AVG(t.rating) FROM tracks t
             INNER JOIN albums a ON t.album_id = a.id
             WHERE t.rating IS NOT NULL) as avgRating
        `);

        // Distribución por álbumes
        const albumRatings = await db.getAllAsync(`
          SELECT 
            a.id,
            AVG(t.rating) as album_avg_rating
          FROM albums a
          INNER JOIN tracks t ON a.id = t.album_id
          WHERE t.rating IS NOT NULL
          GROUP BY a.id
          HAVING album_avg_rating IS NOT NULL
        `);

        const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        albumRatings.forEach(item => {
          if (item.album_avg_rating) {
            const ratingFloor = Math.floor(item.album_avg_rating);
            if (ratingFloor >= 1 && ratingFloor <= 10) {
              distribution[ratingFloor - 1] += 1;
            }
          }
        });

        // Tasa de completitud
        const completionStats = await db.getFirstAsync(`
          SELECT 
            COUNT(*) as totalAlbums,
            COUNT(CASE WHEN a.id IN (
              SELECT album_id 
              FROM tracks t
              GROUP BY album_id 
              HAVING COUNT(*) = COUNT(CASE WHEN t.rating IS NOT NULL THEN 1 END)
            ) THEN 1 END) as completedAlbums
          FROM albums a
        `);

        const completionRate = completionStats?.totalAlbums > 0
          ? Math.round((completionStats.completedAlbums / completionStats.totalAlbums) * 100)
          : 0;

        const ratedPercentage = generalStats?.totalTracks > 0
          ? Math.round((generalStats.totalRatedTracks / generalStats.totalTracks) * 100)
          : 0;

        return {
          totalArtists: generalStats?.totalArtists || 0,
          totalAlbums: generalStats?.totalAlbums || 0,
          totalTracks: generalStats?.totalTracks || 0,
          totalRatedTracks: generalStats?.totalRatedTracks || 0,
          avgRating: generalStats?.avgRating ? parseFloat(generalStats.avgRating).toFixed(1) : '0.0',
          completionRate,
          ratedPercentage,
          ratingDistribution: distribution,
        };
      });

      setStats(result);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Cargar en paralelo
      await Promise.all([
        loadRandomAlbum(),
        loadLists(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomAlbumPress = async () => {
    setRandomAlbumLoading(true);
    await loadRandomAlbum();
    setRandomAlbumLoading(false);
  };

  const renderAlbumCard = (album) => {
    if (!album || !album.cover) return null;

    return (
      <TouchableOpacity
        key={album.id}
        style={styles.albumCard}
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
        <Image
          source={{ uri: album.cover }}
          style={styles.albumImage}
          contentFit="cover"
        />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={styles.albumArtist} numberOfLines={1}>
            {album.artist_name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDecadeSection = (decade, albums) => {
    if (!albums || albums.length === 0) return null;

    const decadeNames = {
      '80s': '80s',
      '90s': '90s',
      '2000s': '2000s',
      '2010s': '2010s',
      '2020s': '2020s',
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.8)" />
          <Text style={styles.sectionTitle}>{decadeNames[decade]}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {albums.map(album => renderAlbumCard(album))}
        </ScrollView>
      </View>
    );
  };

  const renderListsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      {/* Widget de álbum aleatorio */}
      {randomAlbum && (
        <View style={styles.randomAlbumSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shuffle" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Álbum aleatorio</Text>
          </View>
          <TouchableOpacity
            style={styles.randomAlbumCard}
            onPress={() => navigation.navigate('Album', {
              album: {
                id: randomAlbum.deezer_id,
                title: randomAlbum.title,
                cover: randomAlbum.cover
              },
              artistName: randomAlbum.artist_name,
              artistId: randomAlbum.artist_deezer_id,
              refresh: true
            })}
          >
            <Image
              source={{ uri: randomAlbum.cover }}
              style={styles.randomAlbumImage}
              contentFit="cover"
            />
            <View style={styles.randomAlbumOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.randomAlbumInfo}>
                <Text style={styles.randomAlbumTitle} numberOfLines={2}>
                  {randomAlbum.title}
                </Text>
                <Text style={styles.randomAlbumArtist}>
                  {randomAlbum.artist_name}
                </Text>
                <View style={styles.randomAlbumBadge}>
                  <Ionicons
                    name={randomAlbum.state === 'listening' ? 'headset' : 'time'}
                    size={12}
                    color="white"
                  />
                  <Text style={styles.randomAlbumBadgeText}>
                    {randomAlbum.state === 'listening' ? 'Escuchando' : 'Por escuchar'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.randomAlbumButton}
            onPress={handleRandomAlbumPress}
            disabled={randomAlbumLoading}
          >
            {randomAlbumLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="white" />
                <Text style={styles.randomAlbumButtonText}>Otro álbum</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Recientes */}
      {lists.recentAlbums.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Agregados recientemente</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.recentAlbums.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {/* Por década */}
      {renderDecadeSection('2020s', lists.byDecade['2020s'])}
      {renderDecadeSection('2010s', lists.byDecade['2010s'])}
      {renderDecadeSection('2000s', lists.byDecade['2000s'])}
      {renderDecadeSection('90s', lists.byDecade['90s'])}
      {renderDecadeSection('80s', lists.byDecade['80s'])}

      {/* Aniversarios */}
      {lists.anniversaries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Cumpleaños este mes</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.anniversaries.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {/* Olvidados */}
      {lists.forgotten.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Olvidados (+30 días)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.forgotten.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {/* Mejor calificados */}
      {lists.topRated.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Mejor calificados</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.topRated.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {/* Pendientes */}
      {lists.pending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bookmark" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Por escuchar</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.pending.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {/* Completos */}
      {lists.completed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sectionTitle}>Completos</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lists.completed.map(album => renderAlbumCard(album))}
          </ScrollView>
        </View>
      )}

      {lists.recentAlbums.length === 0 &&
        lists.topRated.length === 0 &&
        lists.pending.length === 0 &&
        lists.completed.length === 0 &&
        lists.anniversaries.length === 0 &&
        lists.forgotten.length === 0 && (
          <View style={styles.emptySection}>
            <Ionicons name="list-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No hay listas para mostrar</Text>
            <Text style={styles.emptySubtext}>Agrega álbumes y califícalos</Text>
          </View>
        )}
    </ScrollView>
  );

  const renderStatsTab = () => {
    const maxCount = Math.max(...stats.ratingDistribution, 1);

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.tabContent, styles.statsTabContent]}
      >
        {/* Tarjetas de estadísticas principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#60A5FA" />
            <Text style={styles.statValue}>{stats.totalArtists}</Text>
            <Text style={styles.statLabel}>Artistas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="albums" size={24} color="#4ADE80" />
            <Text style={styles.statValue}>{stats.totalAlbums}</Text>
            <Text style={styles.statLabel}>Álbumes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="musical-notes" size={24} color="#FBBF24" />
            <Text style={styles.statValue}>{stats.totalTracks}</Text>
            <Text style={styles.statLabel}>Canciones</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#F472B6" />
            <Text style={styles.statValue}>{stats.avgRating}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#A78BFA" />
            <Text style={styles.statValue}>{stats.totalRatedTracks}</Text>
            <Text style={styles.statLabel}>Calificadas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color="#F87171" />
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completitud</Text>
          </View>
        </View>

        {/* Gráfico de distribución de calificaciones */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribución de calificaciones</Text>
          <View style={styles.barChart}>
            {stats.ratingDistribution.map((count, index) => {
              const rating = index + 1;
              const barHeight = maxCount > 0 ? (count / maxCount) * 150 : 0;
              const color = getRatingColor(rating);

              return (
                <View key={rating} style={styles.barColumn}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
                  <Text style={styles.barLabel}>{rating}</Text>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Barra de progreso detallada para completitud */}
        <View style={styles.completionDetail}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Álbumes completos</Text>
            <Text style={styles.completionValue}>{stats.completionRate}%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${stats.completionRate}%` }]} />
          </View>
          <Text style={styles.completionSubtext}>
            {stats.ratedPercentage || 0}% de canciones calificadas
          </Text>
        </View>

        {/* Espacio extra al final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        {/* Overlay muy sutil para dar profundidad */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />

        {/* Gradiente superior */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Header */}
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'transparent']}
          style={styles.header}
        >
          <Text style={styles.title}>Mis Listas</Text>
          <Text style={styles.subtitle}>Descubre tu colección</Text>
        </LinearGradient>

        {/* Tabs skeleton */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <View key={tab.id} style={[styles.tab, styles.skeletonTab]} />
          ))}
        </View>

        {/* Contenido según pestaña - skeleton */}
        <View style={styles.content}>
          {activeTab === 'lists' && <ListsSkeleton />}
          {activeTab === 'stats' && <StatsSkeleton />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Overlay muy sutil para dar profundidad */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />

      {/* Gradiente superior */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'transparent']}
        style={styles.header}
      >
        <Text style={styles.title}>Mis Listas</Text>
        <Text style={styles.subtitle}>Descubre tu colección</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido según pestaña */}
      <View style={styles.content}>
        {activeTab === 'lists' && renderListsTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  randomAlbumSection: {
    marginBottom: 30,
  },
  randomAlbumCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  randomAlbumImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  randomAlbumOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  randomAlbumInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  randomAlbumTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  randomAlbumArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  randomAlbumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  randomAlbumBadgeText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  randomAlbumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  randomAlbumButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  albumCard: {
    width: 120,
    marginRight: 12,
  },
  albumImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  albumInfo: {
    marginTop: 8,
  },
  albumTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  albumArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginBottom: 2,
  },
  barCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  completionDetail: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completionValue: {
    color: '#9333EA',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 4,
  },
  completionSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginTop: 8,
  },
  statsTabContent: {
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 40,
  },
  // Estilos para skeletons
  skeletonTab: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skeletonSection: {
    marginBottom: 24,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonSectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  skeletonSectionTitle: {
    width: 150,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonRandomAlbumCard: {
    height: 160,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonRandomAlbumButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonAlbumCard: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  skeletonStatValue: {
    width: 50,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 60,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonChartContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonChartTitle: {
    width: 200,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 20,
  },
  skeletonBar: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonBarLabel: {
    width: 15,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 2,
    marginBottom: 2,
  },
  skeletonBarCount: {
    width: 20,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 2,
  },
  skeletonCompletionDetail: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonCompletionTitle: {
    width: 120,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonCompletionValue: {
    width: 50,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonProgressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  skeletonProgressBar: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  skeletonCompletionSubtext: {
    width: 150,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
});