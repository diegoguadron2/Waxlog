import axios from 'axios';

const BASE_URL = 'https://api.deezer.com';

// Configuración base de axios
const deezerClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Buscar canciones
export const searchTracks = async (query, limit = 25) => {
  try {
    const response = await deezerClient.get('/search', {
      params: { q: query, limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error buscando canciones:', error);
    return [];
  }
};

// Buscar álbumes
export const searchAlbums = async (query, limit = 25) => {
  try {
    const response = await deezerClient.get('/search/album', {
      params: { q: query, limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error buscando álbumes:', error);
    return [];
  }
};

// Buscar artistas
export const searchArtists = async (query, limit = 25) => {
  try {
    const response = await deezerClient.get('/search/artist', {
      params: { q: query, limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error buscando artistas:', error);
    return [];
  }
};

// Buscar géneros
export const searchGenres = async (query, limit = 25) => {
  try {
    const response = await deezerClient.get('/genre');
    const allGenres = response.data.data || [];
    const filteredGenres = allGenres.filter(genre =>
      genre.name.toLowerCase().includes(query.toLowerCase())
    );
    return filteredGenres.slice(0, limit);
  } catch (error) {
    console.error('Error buscando géneros:', error);
    return [];
  }
};

// Búsqueda combinada
export const searchAll = async (query, limit = 10) => {
  try {
    const [tracks, albums, artists, genres] = await Promise.all([
      searchTracks(query, limit),
      searchAlbums(query, limit),
      searchArtists(query, limit),
      searchGenres(query, limit),
    ]);

    return {
      tracks,
      albums,
      artists,
      genres,
    };
  } catch (error) {
    console.error('Error en búsqueda combinada:', error);
    return { tracks: [], albums: [], artists: [], genres: [] };
  }
};

// Obtener artista por ID
export const getArtistById = async (artistId) => {
  try {
    const response = await deezerClient.get(`/artist/${artistId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo artista:', error);
    return null;
  }
};

// Obtener top tracks del artista
export const getArtistTopTracks = async (artistId) => {
  try {
    const response = await deezerClient.get(`/artist/${artistId}/top`, {
      params: { limit: 10 }
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo top tracks:', error);
    return { data: [] };
  }
};

// Obtener álbumes del artista
export const getArtistAlbums = async (artistId) => {
  try {
    const response = await deezerClient.get(`/artist/${artistId}/albums`, {
      params: { limit: 50 }
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo álbumes:', error);
    return { data: [] };
  }
};

// Obtener artistas relacionados
export const getRelatedArtists = async (artistId) => {
  try {
    const response = await deezerClient.get(`/artist/${artistId}/related`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo artistas relacionados:', error);
    return { data: [] };
  }
};

// Obtener tracks de un álbum
export const getAlbumTracks = async (albumId) => {
  try {
    let allTracks = [];
    let nextUrl = null;
    let pageCount = 0;

    console.log(`📀 Obteniendo tracks del álbum ${albumId}...`);

    // Primera petición
    const firstResponse = await deezerClient.get(`/album/${albumId}/tracks`);

    if (!firstResponse.data || !firstResponse.data.data) {
      console.log('⚠️ No se encontraron tracks');
      return { data: [] };
    }

    // Agregar tracks de la primera página
    allTracks = [...firstResponse.data.data];
    nextUrl = firstResponse.data.next;

    console.log(`📊 Página 1: ${firstResponse.data.data.length} tracks (Total acumulado: ${allTracks.length})`);

    // Mientras haya una URL "next", seguir pidiendo más páginas
    while (nextUrl) {
      pageCount++;

      // Extraer el índice de la URL para logging
      const nextPageMatch = nextUrl.match(/index=(\d+)/);
      const nextIndex = nextPageMatch ? nextPageMatch[1] : 'desconocido';

      console.log(`⏩ Página ${pageCount + 1} (desde índice ${nextIndex})...`);

      // Hacer petición a la siguiente página
      const nextResponse = await deezerClient.get(nextUrl);

      if (nextResponse.data && nextResponse.data.data) {
        const newTracks = nextResponse.data.data;
        allTracks = [...allTracks, ...newTracks];
        console.log(`📊 Página ${pageCount + 1}: ${newTracks.length} tracks (Total acumulado: ${allTracks.length})`);

        // Actualizar nextUrl para la siguiente iteración
        nextUrl = nextResponse.data.next;
      } else {
        // Si no hay datos, salir del bucle
        nextUrl = null;
      }

      // Pequeña pausa para no saturar la API
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Total final: ${allTracks.length} tracks obtenidos del álbum ${albumId}`);

    return {
      data: allTracks,
      total: allTracks.length,
    };

  } catch (error) {
    console.error('❌ Error obteniendo tracks del álbum con paginación:', error);
    return { data: [] };
  }
};

// Obtener detalles completos de un álbum
export const getAlbumById = async (albumId) => {
  try {
    const response = await deezerClient.get(`/album/${albumId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo álbum:', error);
    return null;
  }
};

// 🔥 NUEVA FUNCIÓN: Obtener detalles de una canción
export const getTrackById = async (trackId) => {
  try {
    const response = await deezerClient.get(`/track/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo track:', error);
    return null;
  }
};

// Exportar todo como objeto
export default {
  searchTracks,
  searchAlbums,
  searchArtists,
  searchGenres,
  searchAll,
  getArtistById,
  getArtistTopTracks,
  getArtistAlbums,
  getRelatedArtists,
  getAlbumTracks,
  getAlbumById,
  getTrackById, // ← Agregada
};