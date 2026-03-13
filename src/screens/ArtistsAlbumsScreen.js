// screens/ArtistsAlbumsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { executeDBOperation } from '../database/Index';
import { getRatingColor } from '../utils/colors';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 10;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.1;

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <View style={sk.container}>
    <View style={sk.header}>
      <View style={sk.title} />
      <View style={sk.subtitle} />
    </View>
    <View style={sk.search} />
    <View style={sk.grid}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={[sk.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]} />
      ))}
    </View>
  </View>
);

const sk = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: PADDING },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { width: 160, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 8 },
  subtitle: { width: 220, height: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 },
  search: { height: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: GAP },
});

// ─── Card de género ───────────────────────────────────────────────────────────
const GenreCard = ({ genre, isTop3, onPress }) => {
  const hasImage = !!genre.coverImage;

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      onPress={() => onPress(genre)}
      activeOpacity={0.82}
    >
      {/* Fondo: portada o color sólido */}
      {hasImage ? (
        <ImageBackground
          source={{ uri: genre.coverImage }}
          style={StyleSheet.absoluteFillObject}
          imageStyle={{ borderRadius: 16 }}
          blurRadius={0}
        >
          {/* Gradiente oscuro para legibilidad */}
          <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[genre.color + 'CC', genre.color + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Badge top 3 */}
      {isTop3 && (
        <View style={styles.flameBadge}>
          <Ionicons name="flame" size={11} color="#FF6B35" />
        </View>
      )}

      {/* Rating promedio (esquina superior derecha) */}
      {genre.avgRating > 0 && (
        <View style={[styles.ratingBadge, { borderColor: getRatingColor(genre.avgRating) + '80' }]}>
          <Text style={[styles.ratingText, { color: getRatingColor(genre.avgRating) }]}>
            {genre.avgRating.toFixed(1)}
          </Text>
        </View>
      )}

      {/* Info abajo */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{genre.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="albums" size={11} color="rgba(255,255,255,0.6)" />
          <Text style={styles.cardCount}>
            {genre.count} {genre.count === 1 ? 'álbum' : 'álbumes'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ArtistsAlbumsScreen({ navigation }) {
  const [genres, setGenres] = useState([]);
  const [filteredGenres, setFilteredGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('count'); // default: más álbumes primero
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [stats, setStats] = useState({ totalGenres: 0, totalAlbums: 0 });

  // Restaurar tab bar al volver
  useFocusEffect(
    useCallback(() => {
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
    }, [navigation])
  );

  useEffect(() => { loadGenres(); }, []);

  useEffect(() => {
    if (!genres.length) return;
    let result = [...genres];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => sortBy === 'name'
      ? a.name.localeCompare(b.name)
      : b.count - a.count
    );
    setFilteredGenres(result);
  }, [genres, searchQuery, sortBy]);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const result = await executeDBOperation(async (db) => {
        // Álbumes con géneros + una portada por género + rating promedio
        const albums = await db.getAllAsync(`
          SELECT a.genres, a.cover,
            AVG(t.rating) as average_rating
          FROM albums a
          LEFT JOIN tracks t ON a.id = t.album_id
          WHERE a.genres IS NOT NULL AND a.genres != ''
          GROUP BY a.id
        `);

        const genreMap = new Map(); // name → { count, covers, ratingSum, ratingCount }

        albums.forEach(item => {
          if (!item.genres) return;
          try {
            const parsed = JSON.parse(item.genres);
            if (!Array.isArray(parsed)) return;
            parsed.forEach(g => {
              const name = typeof g === 'object' ? g.name : g;
              if (!name?.trim()) return;
              const existing = genreMap.get(name) || { count: 0, covers: [], ratingSum: 0, ratingCount: 0 };
              existing.count++;
              if (item.cover && existing.covers.length < 3) existing.covers.push(item.cover);
              if (item.average_rating > 0) {
                existing.ratingSum += item.average_rating;
                existing.ratingCount++;
              }
              genreMap.set(name, existing);
            });
          } catch (_) {}
        });

        // Colores pastel para fallback
        const pastelColors = [
          '#7C3AED', '#E67E22', '#16A085', '#C0392B', '#2980B9',
          '#8E44AD', '#27AE60', '#D35400', '#2C3E50', '#E91E63',
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F39C12',
        ];
        let colorIndex = 0;

        const genresArray = Array.from(genreMap.entries()).map(([name, data]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count: data.count,
          coverImage: data.covers[0] || null,
          avgRating: data.ratingCount > 0 ? data.ratingSum / data.ratingCount : 0,
          color: pastelColors[colorIndex++ % pastelColors.length],
        }));

        return {
          genres: genresArray,
          stats: {
            totalGenres: genresArray.length,
            totalAlbums: albums.length,
          }
        };
      });

      if (result) {
        // Default: ordenar por cantidad
        const sorted = [...result.genres].sort((a, b) => b.count - a.count);
        setGenres(sorted);
        setFilteredGenres(sorted);
        setStats(result.stats);
      }
    } catch (error) {
      if (__DEV__) console.error('Error cargando géneros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenrePress = useCallback((genre) => {
    navigation.navigate('Genre', { genre: genre.name, color: genre.color });
  }, [navigation]);

  // Top 3 por cantidad de álbumes
  const top3Ids = new Set(
    [...genres].sort((a, b) => b.count - a.count).slice(0, 3).map(g => g.id)
  );

  if (loading) {
    return <View style={styles.container}><Skeleton /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Menú de ordenamiento */}
      {showSortMenu && (
        <TouchableOpacity
          style={styles.sortOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.sortMenu}>
            {[
              { key: 'count', label: 'Más álbumes', icon: 'bar-chart' },
              { key: 'name', label: 'Nombre A–Z', icon: 'text' },
              { key: 'rating', label: 'Mejor rating', icon: 'star' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortBy(opt.key); setShowSortMenu(false); }}
              >
                <Ionicons name={opt.icon} size={16} color={sortBy === opt.key ? 'white' : 'rgba(255,255,255,0.5)'} />
                <Text style={[styles.sortOptionText, sortBy === opt.key && { color: 'white' }]}>
                  {opt.label}
                </Text>
                {sortBy === opt.key && <Ionicons name="checkmark" size={16} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Géneros</Text>
          <Text style={styles.subtitle}>
            {stats.totalGenres} géneros · {stats.totalAlbums} álbumes
          </Text>
        </View>

        {/* Búsqueda + ordenar */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar género..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(true)}>
            <Ionicons name="funnel" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Grid */}
        {filteredGenres.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'Sin resultados' : 'No hay géneros'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() ? 'Prueba con otra búsqueda' : 'Aparecerán cuando guardes álbumes'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredGenres.map(genre => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isTop3={top3Ids.has(genre.id)}
                onPress={handleGenrePress}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingHorizontal: PADDING,
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },

  // Controles
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    padding: 0,
  },
  sortBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: GAP,
    backgroundColor: '#1a1a1a',
    justifyContent: 'flex-end',
  },
  flameBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.5)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },

  // Sort menu
  sortOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  sortMenu: {
    position: 'absolute',
    top: 130,
    right: PADDING,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 6,
    width: 190,
    zIndex: 101,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sortOptionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    textAlign: 'center',
  },
});