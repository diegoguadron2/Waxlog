import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDB } from '../database/Index';
import { tabBarStyle } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Generar color pastel basado en string (para géneros)
const getGenreColor = (genre) => {
  if (!genre) return '#1a1a1a';

  // Generar un hash simple del nombre
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Colores pastel predefinidos
  const pastelColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
    '#F1C40F', '#E74C3C', '#1ABC9C', '#9B59B6', '#34495E',
    '#FF8C42', '#A8E6CF', '#FFD3B6', '#D4A5A5', '#9B59B6',
  ];

  // Usar el hash para seleccionar un color
  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
};

// 🔴 COMPONENTE SKELETON PARA GÉNEROS
const GenresSkeleton = () => {
  return (
    <View style={styles.scrollContent}>
      <View style={styles.skeletonSearchContainer} />
      <View style={styles.skeletonSortContainer} />
      
      <View style={styles.skeletonStatsContainer}>
        <View style={styles.skeletonStatCard} />
        <View style={styles.skeletonStatCard} />
        <View style={styles.skeletonStatCard} />
      </View>

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonGenreCard}>
          <View style={styles.skeletonGenreColor} />
          <View style={styles.skeletonGenreInfo}>
            <View style={styles.skeletonGenreName} />
            <View style={styles.skeletonGenreCount} />
          </View>
          <View style={styles.skeletonGenreArrow} />
        </View>
      ))}
    </View>
  );
};

export default function ArtistsAlbumsScreen({ navigation }) {
  const [genres, setGenres] = useState([]);
  const [filteredGenres, setFilteredGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' o 'count'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [stats, setStats] = useState({
    totalGenres: 0,
    totalAlbums: 0,
    mostCommonGenre: '',
  });

  const mountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: tabBarStyle
      });
    }, [navigation])
  );

  useEffect(() => {
    mountedRef.current = true;
    loadGenres();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Filtrar y ordenar géneros cuando cambia la búsqueda o el ordenamiento
    let filtered = [...genres];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(query)
      );
    }

    // Ordenar
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'count') {
      filtered.sort((a, b) => b.count - a.count);
    }

    setFilteredGenres(filtered);
  }, [genres, searchQuery, sortBy]);

  const loadGenres = async () => {
    setLoading(true);
    try {
      const db = await getDB();

      // Obtener todos los géneros únicos y contar álbumes
      const genreResults = await db.getAllAsync(`
        SELECT 
          a.genres,
          COUNT(*) as album_count
        FROM albums a
        WHERE a.genres IS NOT NULL
        GROUP BY a.genres
        ORDER BY album_count DESC
      `);

      const genreMap = new Map();

      genreResults.forEach(item => {
        if (item.genres) {
          try {
            const parsed = JSON.parse(item.genres);
            if (Array.isArray(parsed)) {
              parsed.forEach(g => {
                const genreName = typeof g === 'object' ? g.name : g;
                if (genreName) {
                  const currentCount = genreMap.get(genreName) || 0;
                  genreMap.set(genreName, currentCount + parseInt(item.album_count));
                }
              });
            }
          } catch (e) {
            // Ignorar errores de parseo
          }
        }
      });

      // Convertir mapa a array
      const genresList = Array.from(genreMap.entries()).map(([name, count]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count,
        color: getGenreColor(name),
      }));

      // Ordenar por nombre por defecto
      genresList.sort((a, b) => a.name.localeCompare(b.name));

      // Calcular estadísticas
      const totalGenres = genresList.length;
      const totalAlbums = genresList.reduce((sum, g) => sum + g.count, 0);
      const mostCommonGenre = genresList.length > 0 
        ? genresList.reduce((max, g) => g.count > max.count ? g : max, genresList[0]).name
        : 'Ninguno';

      if (mountedRef.current) {
        setGenres(genresList);
        setFilteredGenres(genresList);
        setStats({
          totalGenres,
          totalAlbums,
          mostCommonGenre,
        });
      }

    } catch (error) {
      console.error('Error cargando géneros:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleGenrePress = (genre) => {
    navigation.navigate('Genre', { 
      genre: genre.name,
      color: genre.color 
    });
  };

  const toggleSortMenu = () => {
    setShowSortMenu(!showSortMenu);
  };

  const selectSort = (option) => {
    setSortBy(option);
    setShowSortMenu(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Renderizar tarjeta de género
  const renderGenreCard = (genre) => {
    const isLarge = genre.count > 10; // Para dar énfasis a géneros populares

    return (
      <TouchableOpacity
        key={genre.id}
        style={[
          styles.genreCard,
          isLarge && styles.largeGenreCard
        ]}
        onPress={() => handleGenrePress(genre)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[genre.color + '40', genre.color + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.genreGradient}
        />
        
        <View style={[styles.genreColorBar, { backgroundColor: genre.color }]} />
        
        <View style={styles.genreContent}>
          <View style={styles.genreHeader}>
            <Text style={styles.genreName} numberOfLines={1}>
              {genre.name}
            </Text>
            {isLarge && (
              <View style={[styles.popularBadge, { backgroundColor: genre.color + '40' }]}>
                <Ionicons name="flame" size={12} color={genre.color} />
                <Text style={[styles.popularText, { color: genre.color }]}>Popular</Text>
              </View>
            )}
          </View>
          
          <View style={styles.genreStats}>
            <View style={styles.genreCountContainer}>
              <Ionicons name="albums" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.genreCount}>
                {genre.count} {genre.count === 1 ? 'álbum' : 'álbumes'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.genreArrow}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
        </View>
      </TouchableOpacity>
    );
  };

  // Menú de ordenamiento flotante
  const renderSortMenu = () => {
    if (!showSortMenu) return null;

    return (
      <TouchableOpacity 
        style={styles.sortMenuOverlay}
        activeOpacity={1}
        onPress={() => setShowSortMenu(false)}
      >
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'name' && styles.activeSortOption]}
            onPress={() => selectSort('name')}
          >
            <Ionicons
              name="text"
              size={18}
              color={sortBy === 'name' ? '#9333EA' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.sortOptionText, sortBy === 'name' && styles.activeSortOptionText]}>
              Nombre
            </Text>
            {sortBy === 'name' && (
              <Ionicons name="checkmark" size={18} color="#9333EA" style={styles.sortOptionCheck} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'count' && styles.activeSortOption]}
            onPress={() => selectSort('count')}
          >
            <Ionicons
              name="bar-chart"
              size={18}
              color={sortBy === 'count' ? '#9333EA' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.sortOptionText, sortBy === 'count' && styles.activeSortOptionText]}>
              Cantidad
            </Text>
            {sortBy === 'count' && (
              <Ionicons name="checkmark" size={18} color="#9333EA" style={styles.sortOptionCheck} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.header}>
          <Text style={styles.title}>Géneros</Text>
          <Text style={styles.subtitle}>Explora tu música por categorías</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GenresSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSortMenu()}

      {/* Header con gradiente */}
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'transparent']}
        style={styles.headerGradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Géneros</Text>
        <Text style={styles.subtitle}>Explora tu música por categorías</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar género..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de estadísticas y ordenamiento */}
      <View style={styles.statsBar}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalGenres}</Text>
            <Text style={styles.statLabel}>géneros</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAlbums}</Text>
            <Text style={styles.statLabel}>álbumes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue} numberOfLines={1}>
              {stats.mostCommonGenre.length > 8 
                ? stats.mostCommonGenre.substring(0, 8) + '…' 
                : stats.mostCommonGenre}
            </Text>
            <Text style={styles.statLabel}>popular</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.sortButton} onPress={toggleSortMenu}>
          <Ionicons 
            name={sortBy === 'name' ? 'text' : 'bar-chart'} 
            size={16} 
            color="rgba(255,255,255,0.7)" 
          />
          <Text style={styles.sortButtonText}>
            {sortBy === 'name' ? 'Nombre' : 'Cantidad'}
          </Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* Lista de géneros */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredGenres.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="pricetags-outline" size={48} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No se encontraron géneros' : 'No hay géneros'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() 
                ? 'Prueba con otra búsqueda' 
                : 'Los géneros aparecerán cuando agregues álbumes'}
            </Text>
          </View>
        ) : (
          filteredGenres.map(renderGenreCard)
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
    backgroundColor: '#000000',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    pointerEvents: 'none',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    marginLeft: 10,
    padding: 0,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 3,
    marginRight: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sortButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginHorizontal: 4,
  },
  sortMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  sortMenu: {
    position: 'absolute',
    top: 180,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 160,
    zIndex: 1001,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeSortOption: {
    backgroundColor: 'rgba(147,51,234,0.1)',
  },
  sortOptionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 10,
  },
  activeSortOptionText: {
    color: '#9333EA',
  },
  sortOptionCheck: {
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Estilos para tarjetas de género
  genreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  largeGenreCard: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  genreGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  genreColorBar: {
    width: 6,
    height: '100%',
    alignSelf: 'stretch',
  },
  genreContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  genreName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  genreStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginLeft: 4,
  },
  genreArrow: {
    paddingRight: 16,
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
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },

  // 🔴 ESTILOS PARA SKELETONS
  skeletonSearchContainer: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonSortContainer: {
    height: 40,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  skeletonStatsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  skeletonStatCard: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  skeletonGenreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonGenreColor: {
    width: 6,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginRight: 16,
  },
  skeletonGenreInfo: {
    flex: 1,
  },
  skeletonGenreName: {
    width: '60%',
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonGenreCount: {
    width: '40%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonGenreArrow: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
});