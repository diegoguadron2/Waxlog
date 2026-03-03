import { useState, useCallback } from 'react';
import { searchAll, searchTracks, searchAlbums, searchArtists, searchGenres } from '../services/deezerApi';

export const useDeezerSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({
    tracks: [],
    albums: [],
    artists: [],
    genres: [], // ← Agregamos géneros
  });

  const search = useCallback(async (query, type = 'all') => {
    if (!query.trim()) {
      setResults({ tracks: [], albums: [], artists: [], genres: [] }); // ← Actualizado
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data;
      
      switch (type) {
        case 'tracks':
          data = await searchTracks(query);
          setResults({ tracks: data, albums: [], artists: [], genres: [] });
          break;
        case 'albums':
          data = await searchAlbums(query);
          setResults({ tracks: [], albums: data, artists: [], genres: [] });
          break;
        case 'artists':
          data = await searchArtists(query);
          setResults({ tracks: [], albums: [], artists: data, genres: [] });
          break;
        case 'genres': // ← Nuevo caso para géneros
          data = await searchGenres(query);
          setResults({ tracks: [], albums: [], artists: [], genres: data });
          break;
        default:
          data = await searchAll(query);
          setResults(data); // searchAll ya debería incluir géneros
      }
    } catch (err) {
      setError('Error en la búsqueda. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    results,
    search,
  };
};