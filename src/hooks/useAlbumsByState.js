// hooks/useAlbumsByState.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { executeDBOperation } from '../database/Index';
import { useFocusEffect } from '@react-navigation/native';

export const useAlbumsByState = (state) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('recent_desc');
  const [totalCount, setTotalCount] = useState(0);

  const mountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const lastFocusTimeRef = useRef(0);

  // Opciones de ordenamiento según el estado
  const sortOptions = [
    { id: 'recent_desc', label: 'Más recientes', icon: 'time' },
    { id: 'recent_asc', label: 'Más antiguos', icon: 'time-outline' },
    { id: 'name_asc', label: 'Nombre A-Z', icon: 'arrow-up' },
    { id: 'name_desc', label: 'Nombre Z-A', icon: 'arrow-down' },
  ];

  // Para 'listened' agregamos opciones de calificación
  const allSortOptions = state === 'listened' 
    ? [
        ...sortOptions,
        { id: 'rating_desc', label: 'Mejor calificados', icon: 'star' },
        { id: 'rating_asc', label: 'Peor calificados', icon: 'star-outline' },
      ]
    : sortOptions;

  // 👈 CORREGIDO: Usamos average_rating
  const getOrderClause = (sortOption) => {
    switch (sortOption) {
      case 'recent_desc':
        return 'ORDER BY a.downloaded_at DESC';
      case 'recent_asc':
        return 'ORDER BY a.downloaded_at ASC';
      case 'name_asc':
        return 'ORDER BY a.title ASC';
      case 'name_desc':
        return 'ORDER BY a.title DESC';
      case 'rating_desc':
        return 'ORDER BY average_rating DESC';
      case 'rating_asc':
        return 'ORDER BY average_rating ASC';
      default:
        return 'ORDER BY a.downloaded_at DESC';
    }
  };

  // Cargar datos SOLO del estado específico
  const loadData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      await executeDBOperation(async (db) => {
        // 1. Obtener el total de álbumes en este estado
        const countResult = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM albums WHERE state = ?',
          [state]
        );

        if (mountedRef.current) {
          setTotalCount(countResult?.count || 0);
        }

        // 2. Obtener los álbumes con sus estadísticas
        const orderClause = getOrderClause(sortBy);
        
        const albumsData = await db.getAllAsync(`
          SELECT 
            a.*, 
            ar.name as artist_name,
            ar.deezer_id as artist_deezer_id,
            COUNT(t.id) as total_tracks,
            COUNT(CASE WHEN t.rating IS NOT NULL THEN 1 END) as rated_tracks,
            AVG(t.rating) as average_rating
          FROM albums a
          LEFT JOIN artists ar ON a.artist_id = ar.id
          LEFT JOIN tracks t ON a.id = t.album_id
          WHERE a.state = ?
          GROUP BY a.id
          ${orderClause}
        `, [state]);

        if (mountedRef.current) {
          setAlbums(albumsData);
          if (__DEV__) console.log(`✅ Cargados ${albumsData.length} álbumes de estado "${state}"`);
        }
      });
    } catch (error) {
      if (__DEV__) console.error(`Error cargando álbumes de estado ${state}:`, error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      isLoadingRef.current = false;
    }
  }, [state, sortBy]);

  // Función de refresh
  const refreshData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;

    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // useFocusEffect - CON THROTTLE
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusTimeRef.current < 2000) return;
      lastFocusTimeRef.current = now;
      refreshData().catch(e => { if (__DEV__) console.error(e); });

      return () => {};
    }, [refreshData, state])
  );

  // Carga inicial
  useEffect(() => {
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cambiar ordenamiento
  const handleSortChange = useCallback((optionId) => {
    if (optionId === sortBy) return;
    setSortBy(optionId);
  }, [sortBy]);

  const isMountedSortRef = useRef(false);

  // Efecto para recargar cuando cambia el ordenamiento (no al montar)
  useEffect(() => {
    if (!isMountedSortRef.current) {
      isMountedSortRef.current = true;
      return;
    }
    loadData();
  }, [sortBy]);

  return {
    albums,
    loading,
    refreshing,
    sortBy,
    totalCount,
    sortOptions: allSortOptions,
    handleSortChange,
    onRefresh: refreshData,
  };
};