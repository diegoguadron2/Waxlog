import { artistRepository } from '../database/repositories/artistRepository';
import { albumRepository } from '../database/repositories/albumRepository';
import { trackRepository } from '../database/repositories/trackRepository';
import deezerApi from '../services/deezerApi';

export const testAllRepositories = async () => {
  console.log('🧪 ==================================');
  console.log('🧪 PROBANDO TODOS LOS REPOSITORIOS');
  console.log('🧪 ==================================');
  
  try {
    // 1. BUSCAR ARTISTA EN DEEZER
    console.log('\n📌 1. BUSCANDO ARTISTA EN DEEZER');
    const searchResult = await deezerApi.searchArtists('Queen');
    const deezerArtist = searchResult[0];
    
    if (!deezerArtist) {
      console.log('❌ No se encontró el artista');
      return;
    }
    
    console.log(`   ✅ Artista encontrado: ${deezerArtist.name}`);

    // 2. GUARDAR ARTISTA
    console.log('\n📌 2. GUARDANDO ARTISTA EN BD');
    const artistId = await artistRepository.saveArtist(deezerArtist);
    console.log(`   ✅ Artista guardado con ID: ${artistId}`);

    // 3. RECUPERAR ARTISTA
    console.log('\n📌 3. RECUPERANDO ARTISTA');
    const savedArtist = await artistRepository.getArtistById(artistId);
    console.log(`   ✅ Artista: ${savedArtist.name}`);
    console.log(`   📸 Imagen: ${savedArtist.picture?.substring(0, 50)}...`);

    // 4. BUSCAR ÁLBUMES DEL ARTISTA
    console.log('\n📌 4. BUSCANDO ÁLBUMES EN DEEZER');
    const albumsRes = await deezerApi.getArtistAlbums(deezerArtist.id);
    const firstAlbum = albumsRes.data[0];
    
    if (!firstAlbum) {
      console.log('❌ No se encontraron álbumes');
      return;
    }
    
    console.log(`   ✅ Álbum encontrado: ${firstAlbum.title}`);

    // 5. GUARDAR ÁLBUM
    console.log('\n📌 5. GUARDANDO ÁLBUM EN BD');
    const albumId = await albumRepository.saveAlbum(firstAlbum, artistId);
    console.log(`   ✅ Álbum guardado con ID: ${albumId}`);

    // 6. BUSCAR CANCIONES DEL ÁLBUM
    console.log('\n📌 6. BUSCANDO CANCIONES EN DEEZER');
    const tracksRes = await deezerApi.getAlbumTracks(firstAlbum.id);
    const tracks = tracksRes.data || [];
    console.log(`   ✅ ${tracks.length} canciones encontradas`);

    // 7. GUARDAR CANCIONES
    console.log('\n📌 7. GUARDANDO CANCIONES EN BD');
    const trackIds = await trackRepository.saveTracks(tracks, albumId);
    console.log(`   ✅ ${trackIds.length} canciones guardadas`);

    // 8. VERIFICAR CANCIONES GUARDADAS
    console.log('\n📌 8. VERIFICANDO CANCIONES');
    const savedTracks = await trackRepository.getTracksByAlbum(albumId);
    console.log(`   ✅ ${savedTracks.length} canciones en BD`);
    
    if (savedTracks.length > 0) {
      const firstTrack = savedTracks[0];
      console.log(`   🎵 Primera canción: ${firstTrack.title}`);

      // 9. CALIFICAR UNA CANCIÓN
      console.log('\n📌 9. CALIFICANDO CANCIÓN');
      await trackRepository.updateTrackRating(firstTrack.id, 9, '¡Excelente canción!');
      console.log(`   ✅ Canción calificada con 9/10`);

      // 10. VERIFICAR ESTADÍSTICAS
      console.log('\n📌 10. VERIFICANDO ESTADÍSTICAS DEL ÁLBUM');
      const stats = await trackRepository.getAlbumStats(albumId);
      console.log(`   📊 Promedio: ${stats?.average_rating?.toFixed(1) || 0}`);
      console.log(`   📊 Progreso: ${stats?.completion_percentage?.toFixed(0) || 0}%`);

      // 11. MARCAR COMO FAVORITO
      console.log('\n📌 11. PROBANDO FAVORITOS');
      const isFavorite = await trackRepository.toggleFavorite(firstTrack.id);
      console.log(`   ✅ Canción favorita: ${isFavorite ? 'Sí' : 'No'}`);

      // 12. BUSCAR CANCIONES TOP
      console.log('\n📌 12. BUSCANDO TOP CANCIONES');
      const topTracks = await trackRepository.getTopRatedTracks(8);
      console.log(`   ✅ ${topTracks.length} canciones con nota >= 8`);

      // 13. BUSCAR POR TEXTO
      console.log('\n📌 13. PROBANDO BÚSQUEDA');
      const searchResults = await trackRepository.searchTracks('excelente');
      console.log(`   ✅ ${searchResults.length} resultados en comentarios`);
    }

    // 14. PROBAR FILTROS DE ÁLBUM
    console.log('\n📌 14. PROBANDO FILTROS DE ÁLBUM');
    await albumRepository.updateAlbumState(albumId, 'listening');
    const listeningAlbums = await albumRepository.getAlbumsByState('listening');
    console.log(`   ✅ Álbumes en "escuchando": ${listeningAlbums.length}`);

    // 15. PROBAR ESTADÍSTICAS DE ARTISTA
    console.log('\n📌 15. ESTADÍSTICAS DEL ARTISTA');
    const artistStats = await artistRepository.getArtistStats(artistId);
    console.log('   📊 Estadísticas:', artistStats);

    console.log('\n🎉 ==================================');
    console.log('🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('🎉 ==================================');

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS:', error);
  }
};