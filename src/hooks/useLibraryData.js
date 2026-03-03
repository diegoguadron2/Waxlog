// hooks/useLibraryData.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { getDB } from '../database/Index';
import { useFocusEffect } from '@react-navigation/native';

export const useLibraryData = (tabs, initialTab = 'to_listen') => {
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [albums, setAlbums] = useState([]);
  const [cachedAlbums, setCachedAlbums] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('recent_desc');
  const [tabCounts, setTabCounts] = useState({
    listened: 0,
    listening: 0,
    to_listen: 0,
  });

  const mountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const pendingRefreshRef = useRef(false); // Para evitar refrescos múltiples
  const lastRefreshTimeRef = useRef(0); // Para throttle de refrescos

  // Función para filtrar localmente
  const filterAlbumsLocally = useCallback((albumsData, tabId, sortOption) => {
    if (!albumsData || albumsData.length === 0) return [];
    
    let filtered = albumsData.filter(album => album && album.state === tabId);
    
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'recent_desc':
          return new Date(b.downloaded_at || 0) - new Date(a.downloaded_at || 0);
        case 'recent_asc':
          return new Date(a.downloaded_at || 0) - new Date(b.downloaded_at || 0);
        case 'name_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name_desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'rating_desc':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'rating_asc':
          return (a.average_rating || 0) - (b.average_rating || 0);
        default:
          return 0;
      }
    });

    return filtered.filter(album => album.cover || album.cover_local);
  }, []);

  // Cambiar pestaña
  const handleTabChange = useCallback((tabId) => {
    if (tabId === activeTab) return;

    console.log(`🔄 Cambiando a pestaña: ${tabId}`);
    
    const newSortBy = 'recent_desc';
    const cacheKey = `${tabId}-${newSortBy}`;
    let newFilteredData;

    if (cachedAlbums[cacheKey]) {
      newFilteredData = cachedAlbums[cacheKey];
      console.log(`📦 Usando caché para pestaña ${tabId} (${newFilteredData.length} álbumes)`);
    } else {
      newFilteredData = filterAlbumsLocally(albums, tabId, newSortBy);
      console.log(`⚡ Filtrando sincrónicamente para pestaña ${tabId} (${newFilteredData.length} álbumes)`);
      
      setCachedAlbums(prev => ({ 
        ...prev, 
        [cacheKey]: newFilteredData 
      }));
    }

    setActiveTab(tabId);
    setSortBy(newSortBy);
    setFilteredAlbums(newFilteredData);
    
  }, [activeTab, albums, cachedAlbums, filterAlbumsLocally]);

  // Cambiar ordenamiento
  const handleSortChange = useCallback((optionId) => {
    if (optionId === sortBy) return;

    console.log(`🔄 Cambiando orden a: ${optionId}`);
    
    const cacheKey = `${activeTab}-${optionId}`;
    let newFilteredData;

    if (cachedAlbums[cacheKey]) {
      newFilteredData = cachedAlbums[cacheKey];
      console.log(`📦 Usando caché para orden ${optionId} (${newFilteredData.length} álbumes)`);
    } else {
      newFilteredData = filterAlbumsLocally(albums, activeTab, optionId);
      console.log(`⚡ Filtrando sincrónicamente para orden ${optionId} (${newFilteredData.length} álbumes)`);
      
      setCachedAlbums(prev => ({ 
        ...prev, 
        [cacheKey]: newFilteredData 
      }));
    }

    setSortBy(optionId);
    setFilteredAlbums(newFilteredData);
  }, [activeTab, sortBy, albums, cachedAlbums, filterAlbumsLocally]);

  // Función para obtener una conexión fresca de la BD
  const getFreshDB = useCallback(async () => {
    try {
      // Pequeña pausa para asegurar que otras operaciones hayan terminado
      await new Promise(resolve => setTimeout(resolve, 50));
      return await getDB();
    } catch (error) {
      console.error('Error obteniendo conexión BD:', error);
      throw error;
    }
  }, []);

  // Cargar datos
  const loadAllData = useCallback(async (skipCache = false) => {
    if (isLoadingRef.current || !mountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      // Usar una conexión fresca
      const db = await getFreshDB();

      // Cargar contadores
      const counts = await Promise.all([
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['listened']),
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['listening']),
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['to_listen']),
      ]);

      const newTabCounts = {
        listened: counts[0]?.count || 0,
        listening: counts[1]?.count || 0,
        to_listen: counts[2]?.count || 0,
      };
      
      setTabCounts(newTabCounts);

      // Cargar TODOS los álbumes
      const allAlbums = await db.getAllAsync(`
        SELECT 
          a.*, 
          ar.name as artist_name,
          ar.deezer_id as artist_deezer_id,
          COUNT(t.id) as total_tracks,
          AVG(t.rating) as average_rating
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.id
        LEFT JOIN tracks t ON a.id = t.album_id
        GROUP BY a.id
      `);

      if (mountedRef.current) {
        setAlbums(allAlbums);

        // Obtener opciones de ordenamiento
        const baseOptions = [
          { id: 'recent_desc', label: 'Más recientes', icon: 'time' },
          { id: 'recent_asc', label: 'Más antiguos', icon: 'time-outline' },
          { id: 'name_asc', label: 'Nombre A-Z', icon: 'arrow-up' },
          { id: 'name_desc', label: 'Nombre Z-A', icon: 'arrow-down' },
        ];
        
        const listenedOptions = [
          ...baseOptions,
          { id: 'rating_desc', label: 'Mejor calificados', icon: 'star' },
          { id: 'rating_asc', label: 'Peor calificados', icon: 'star-outline' },
        ];

        // Pre-cargar caché
        const newCache = {};
        
        tabs.filter(t => t.id !== 'listened').forEach(tab => {
          baseOptions.forEach(option => {
            const key = `${tab.id}-${option.id}`;
            newCache[key] = filterAlbumsLocally(allAlbums, tab.id, option.id);
          });
        });
        
        const listenedTab = tabs.find(t => t.id === 'listened');
        if (listenedTab) {
          listenedOptions.forEach(option => {
            const key = `${listenedTab.id}-${option.id}`;
            newCache[key] = filterAlbumsLocally(allAlbums, listenedTab.id, option.id);
          });
        }

        setCachedAlbums(newCache);
        
        const currentFiltered = filterAlbumsLocally(allAlbums, activeTab, sortBy);
        setFilteredAlbums(currentFiltered);
        
        console.log(`✅ Cargados ${allAlbums.length} álbumes, ${currentFiltered.length} en pestaña ${activeTab}`);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      isLoadingRef.current = false;
      isRefreshingRef.current = false;
    }
  }, [activeTab, sortBy, tabs, filterAlbumsLocally, getFreshDB]);

  // Forzar actualización - CON THROTTLE
  const forceRefreshCurrentTab = useCallback(async () => {
    // Throttle: no refrescar más de una vez por segundo
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 1000) {
      console.log('⏱️ Refresco ignorado (throttle)');
      return;
    }
    
    if (isRefreshingRef.current || !mountedRef.current) return;
    
    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;
    
    console.log(`🔄 Forzando actualización de pestaña: ${activeTab}`);

    try {
      // Pequeña pausa para asegurar que otras operaciones hayan terminado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const db = await getFreshDB();

      const allAlbums = await db.getAllAsync(`
        SELECT 
          a.*, 
          ar.name as artist_name,
          ar.deezer_id as artist_deezer_id,
          COUNT(t.id) as total_tracks,
          AVG(t.rating) as average_rating
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.id
        LEFT JOIN tracks t ON a.id = t.album_id
        GROUP BY a.id
      `);

      const counts = await Promise.all([
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['listened']),
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['listening']),
        db.getFirstAsync('SELECT COUNT(*) as count FROM albums WHERE state = ?', ['to_listen']),
      ]);

      if (mountedRef.current) {
        const newTabCounts = {
          listened: counts[0]?.count || 0,
          listening: counts[1]?.count || 0,
          to_listen: counts[2]?.count || 0,
        };
        
        setTabCounts(newTabCounts);
        setAlbums(allAlbums);

        // Reconstruir caché
        const baseOptions = [
          { id: 'recent_desc', label: 'Más recientes', icon: 'time' },
          { id: 'recent_asc', label: 'Más antiguos', icon: 'time-outline' },
          { id: 'name_asc', label: 'Nombre A-Z', icon: 'arrow-up' },
          { id: 'name_desc', label: 'Nombre Z-A', icon: 'arrow-down' },
        ];
        
        const listenedOptions = [
          ...baseOptions,
          { id: 'rating_desc', label: 'Mejor calificados', icon: 'star' },
          { id: 'rating_asc', label: 'Peor calificados', icon: 'star-outline' },
        ];

        const newCache = {};
        
        tabs.filter(t => t.id !== 'listened').forEach(tab => {
          baseOptions.forEach(option => {
            const key = `${tab.id}-${option.id}`;
            newCache[key] = filterAlbumsLocally(allAlbums, tab.id, option.id);
          });
        });
        
        const listenedTab = tabs.find(t => t.id === 'listened');
        if (listenedTab) {
          listenedOptions.forEach(option => {
            const key = `${listenedTab.id}-${option.id}`;
            newCache[key] = filterAlbumsLocally(allAlbums, listenedTab.id, option.id);
          });
        }

        setCachedAlbums(newCache);

        const currentFiltered = filterAlbumsLocally(allAlbums, activeTab, sortBy);
        setFilteredAlbums(currentFiltered);

        console.log(`✅ Datos actualizados - ${currentFiltered.length} álbumes en pestaña ${activeTab}`);
      }
    } catch (error) {
      console.error('Error actualizando datos:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [activeTab, sortBy, tabs, filterAlbumsLocally, getFreshDB]);

  // Refresh manual
  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setCachedAlbums({});
    await loadAllData(true);
  }, [loadAllData, refreshing]);

  // Helper para opciones de ordenamiento
  const getSortOptionsForTab = useCallback((tabId) => {
    const baseOptions = [
      { id: 'recent_desc', label: 'Más recientes', icon: 'time' },
      { id: 'recent_asc', label: 'Más antiguos', icon: 'time-outline' },
      { id: 'name_asc', label: 'Nombre A-Z', icon: 'arrow-up' },
      { id: 'name_desc', label: 'Nombre Z-A', icon: 'arrow-down' },
    ];

    if (tabId === 'listened') {
      return [
        ...baseOptions,
        { id: 'rating_desc', label: 'Mejor calificados', icon: 'star' },
        { id: 'rating_asc', label: 'Peor calificados', icon: 'star-outline' },
      ];
    }

    return baseOptions;
  }, []);

  // Focus effect - CON RETRASO PARA EVITAR CONFLICTOS
  useFocusEffect(
    useCallback(() => {
      console.log(`📱 Hook: Pantalla enfocada - pestaña: ${activeTab}`);
      
      // Pequeño retraso para asegurar que AlbumScreen haya liberado la BD
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          if (albums.length > 0 && !isRefreshingRef.current) {
            forceRefreshCurrentTab();
          } else if (albums.length === 0) {
            loadAllData();
          }
        }
      }, 300); // 300ms de retraso
      
      return () => {
        clearTimeout(timer);
      };
    }, [activeTab, albums.length]) // Dependencias mínimas
  );

  // Effect de montaje/desmontaje
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
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
  };
};