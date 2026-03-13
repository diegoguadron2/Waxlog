import { useState, useEffect, useRef, useCallback } from 'react';
import { executeDBOperation } from '../database/Index';
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
  const lastFocusTimeRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

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

    return filtered;
  }, []);

  useEffect(() => {
    if (albums.length > 0) {
      const cacheKey = `${activeTab}-${sortBy}`;

      if (cachedAlbums[cacheKey]) {
        setFilteredAlbums(cachedAlbums[cacheKey]);
      } else {
        const newFilteredData = filterAlbumsLocally(albums, activeTab, sortBy);
        setFilteredAlbums(newFilteredData);

        setCachedAlbums(prev => ({
          ...prev,
          [cacheKey]: newFilteredData
        }));
      }
    }
  }, [albums, activeTab, sortBy, cachedAlbums, filterAlbumsLocally]);

  const handleTabChange = useCallback((tabId) => {
    if (tabId === activeTab) return;

    console.log(`🔄 Cambiando a pestaña: ${tabId}`);
    setActiveTab(tabId);

    if (sortBy !== 'recent_desc') {
      setSortBy('recent_desc');
    }
  }, [activeTab, sortBy]);

  const handleSortChange = useCallback((optionId) => {
    if (optionId === sortBy) return;
    console.log(`🔄 Cambiando orden a: ${optionId}`);
    setSortBy(optionId);
  }, [sortBy]);

  const loadInitialData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current || initialLoadDoneRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      await executeDBOperation(async (db) => {
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

        if (mountedRef.current) {
          setTabCounts(newTabCounts);
        }

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
          console.log(` Cargados ${allAlbums.length} álbumes`);
          initialLoadDoneRef.current = true;
        }
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      isLoadingRef.current = false;
    }
  }, [tabs, filterAlbumsLocally]);

  const refreshData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;

    console.log(`🔄 Actualizando datos...`);
    isLoadingRef.current = true;
    setRefreshing(true);

    try {
      await executeDBOperation(async (db) => {
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

        if (mountedRef.current) {
          setTabCounts(newTabCounts);
        }

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
          console.log(`✅ Actualizados ${allAlbums.length} álbumes`);
        }
      });
    } catch (error) {
      console.error('Error actualizando datos:', error);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
      isLoadingRef.current = false;
    }
  }, [tabs, filterAlbumsLocally]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusTimeRef.current < 2000) {
        console.log('⏱️ Library recarga ignorada (throttle)');
        return;
      }
      lastFocusTimeRef.current = now;

      console.log('📱 LibraryScreen enfocada - actualizando datos...');

      if (initialLoadDoneRef.current) {
        refreshData().catch(console.error);
      }

      return () => { };
    }, [])
  );

  useEffect(() => {
    loadInitialData();
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
    onRefresh: refreshData,
    getSortOptionsForTab: useCallback((tabId) => {
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
    }, []),
  };
};