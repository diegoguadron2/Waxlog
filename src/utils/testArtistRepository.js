import { artistRepository } from '../database/repositories/artistRepository';
import deezerApi from '../services/deezerApi';

export const testArtistRepository = async () => {
  console.log('🧪 Probando repositorio de artistas...');
  
  try {
    // 1. Buscar un artista en Deezer (Queen para probar)
    console.log('1. Buscando artista en Deezer...');
    const searchResult = await deezerApi.searchArtists('Queen');
    const deezerArtist = searchResult[0];
    
    if (!deezerArtist) {
      console.log('❌ No se encontró el artista');
      return;
    }
    
    console.log('   Artista encontrado:', deezerArtist.name);
    
    // 2. Guardar el artista en BD
    console.log('2. Guardando artista en BD...');
    const artistId = await artistRepository.saveArtist(deezerArtist);
    console.log('   ✅ Artista guardado con ID:', artistId);
    
    // 3. Recuperar el artista por ID de Deezer
    console.log('3. Recuperando artista por Deezer ID...');
    const artistByDeezerId = await artistRepository.getArtistByDeezerId(deezerArtist.id);
    console.log('   ✅ Artista recuperado:', artistByDeezerId?.name);
    console.log('   📸 Imagen:', artistByDeezerId?.picture?.substring(0, 50) + '...');
    
    // 4. Recuperar todos los artistas
    console.log('4. Listando todos los artistas...');
    const allArtists = await artistRepository.getAllArtists();
    console.log(`   ✅ Total artistas en BD: ${allArtists.length}`);
    
    // 5. Buscar artistas por nombre
    console.log('5. Buscando artistas con "queen"...');
    const searchResults = await artistRepository.searchArtists('queen');
    console.log(`   ✅ Resultados encontrados: ${searchResults.length}`);
    
    // 6. Obtener estadísticas
    console.log('6. Obteniendo estadísticas del artista...');
    const stats = await artistRepository.getArtistStats(artistId);
    console.log('   📊 Estadísticas:', stats);
    
    console.log('🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }

  // ... después de la prueba de artistas, agrega:

// 7. Probar álbumes
console.log('7. Probando repositorio de álbumes...');

// Buscar álbumes del artista en Deezer
const albumsRes = await deezerApi.getArtistAlbums(deezerArtist.id);
const firstAlbum = albumsRes.data[0];

if (firstAlbum) {
  // Guardar álbum
  const albumId = await albumRepository.saveAlbum(firstAlbum, artistId);
  console.log('   ✅ Álbum guardado con ID:', albumId);
  
  // Recuperar álbum
  const album = await albumRepository.getAlbumById(albumId);
  console.log('   📀 Álbum:', album?.title);
  
  // Probar cambio de estado
  await albumRepository.updateAlbumState(albumId, 'listening');
  console.log('   ✅ Estado actualizado');
  
  // Probar favorito
  await albumRepository.toggleFavorite(albumId);
  console.log('   ✅ Favorito toggled');
}
};