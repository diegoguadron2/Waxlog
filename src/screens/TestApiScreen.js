import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import axios from 'axios';

export default function TestApiScreen() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [modo, setModo] = useState('importar');

  const [busqueda, setBusqueda] = useState('queen');
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);

  const [trackId, setTrackId] = useState('');
  const [calificacion, setCalificacion] = useState('8');
  const [comentario, setComentario] = useState('');

  // ============================================
  // FUNCIÓN PARA VERIFICAR/CREAR TABLAS
  // ============================================

  const verificarEstructura = async (db) => {
    console.log('🔧 Verificando estructura de tablas...');

    // 1. Verificar tabla artists
    const artistsColumns = await db.getAllAsync("PRAGMA table_info(artists)");
    console.log('📊 artists columns:', artistsColumns.map(c => c.name));

    if (artistsColumns.length === 0) {
      console.log('📦 Creando tabla artists...');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS artists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deezer_id TEXT UNIQUE,
          name TEXT NOT NULL,
          picture TEXT,
          picture_local TEXT,
          nb_fans INTEGER,
          downloaded_at TEXT,
          last_updated TEXT
        );
      `);
    }

    // 2. Verificar tabla albums
    const albumsColumns = await db.getAllAsync("PRAGMA table_info(albums)");
    console.log('📊 albums columns:', albumsColumns.map(c => c.name));

    if (albumsColumns.length === 0) {
      console.log('📦 Creando tabla albums...');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS albums (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deezer_id TEXT UNIQUE,
          artist_id INTEGER,
          title TEXT NOT NULL,
          cover TEXT,
          cover_small TEXT,
          cover_medium TEXT,
          cover_big TEXT,
          cover_xl TEXT,
          cover_local TEXT,
          release_date TEXT,
          record_type TEXT,
          total_tracks INTEGER,
          duration INTEGER,
          genres TEXT,
          description TEXT,
          upc TEXT,
          record_label TEXT,
          explicit_lyrics INTEGER DEFAULT 0,
          state TEXT DEFAULT 'downloaded',
          is_favorite INTEGER DEFAULT 0,
          user_description TEXT,
          downloaded_at TEXT,
          last_updated TEXT,
          FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
        );
      `);
    } else {
      // Agregar columnas que podrían faltar
      const columnasNecesarias = [
        { name: 'cover_small', type: 'TEXT' },
        { name: 'cover_medium', type: 'TEXT' },
        { name: 'cover_big', type: 'TEXT' },
        { name: 'cover_xl', type: 'TEXT' },
        { name: 'state', type: 'TEXT DEFAULT "downloaded"' }
      ];

      for (const col of columnasNecesarias) {
        const existe = albumsColumns.some(c => c.name === col.name);
        if (!existe) {
          try {
            console.log(`➕ Agregando columna ${col.name} a albums...`);
            await db.execAsync(`ALTER TABLE albums ADD COLUMN ${col.name} ${col.type}`);
          } catch (e) {
            console.log(`⚠️ No se pudo agregar ${col.name}:`, e.message);
          }
        }
      }
    }

    // 3. Verificar tabla tracks
    const tracksColumns = await db.getAllAsync("PRAGMA table_info(tracks)");
    console.log('📊 tracks columns:', tracksColumns.map(c => c.name));

    if (tracksColumns.length === 0) {
      console.log('📦 Creando tabla tracks...');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deezer_id TEXT UNIQUE,
          album_id INTEGER,
          title TEXT NOT NULL,
          track_number INTEGER,
          duration INTEGER,
          preview TEXT,
          lyrics TEXT,
          isrc TEXT,
          explicit_lyrics INTEGER DEFAULT 0,
          contributors TEXT,
          is_favorite INTEGER DEFAULT 0,
          rating INTEGER,
          comment TEXT,
          last_modified TEXT,
          FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE
        );
      `);
    } else {
      // Agregar columnas que podrían faltar
      if (!tracksColumns.some(c => c.name === 'rating')) {
        try {
          await db.execAsync('ALTER TABLE tracks ADD COLUMN rating INTEGER');
        } catch (e) { }
      }
      if (!tracksColumns.some(c => c.name === 'comment')) {
        try {
          await db.execAsync('ALTER TABLE tracks ADD COLUMN comment TEXT');
        } catch (e) { }
      }
    }

    console.log('✅ Estructura verificada');
  };

  // ============================================
  // IMPORTAR ARTISTA (VERSIÓN CORREGIDA)
  // ============================================

  const importarArtista = async (artista) => {
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      console.log('📥 IMPORTANDO ARTISTA:', artista.name);

      const db = await SQLite.openDatabaseAsync('bitacora.db');

      // Verificar estructura ANTES de empezar
      await verificarEstructura(db);

      // 1. Guardar artista
      console.log('🎤 Guardando artista en BD...');

      const existing = await db.getFirstAsync(
        'SELECT id FROM artists WHERE deezer_id = ?',
        [artista.id.toString()]
      );

      const now = new Date().toISOString();
      let artistId;

      if (existing) {
        console.log('🔄 Actualizando artista existente ID:', existing.id);

        await db.runAsync(
          `UPDATE artists 
           SET name = ?, 
               picture = ?, 
               nb_fans = ?,
               last_updated = ?
           WHERE deezer_id = ?`,
          [
            artista.name,
            artista.picture_xl || artista.picture_big || artista.picture_medium || null,
            artista.nb_fan || 0,
            now,
            artista.id.toString()
          ]
        );

        artistId = existing.id;
      } else {
        console.log('🆕 Insertando nuevo artista');

        const result = await db.runAsync(
          `INSERT INTO artists 
           (deezer_id, name, picture, nb_fans, downloaded_at, last_updated)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            artista.id.toString(),
            artista.name,
            artista.picture_xl || artista.picture_big || artista.picture_medium || null,
            artista.nb_fan || 0,
            now,
            now
          ]
        );

        artistId = result.lastInsertRowId;
      }

      console.log('✅ Artista guardado con ID:', artistId);

      // 2. Buscar álbumes del artista
      console.log('📀 Buscando álbumes...');
      const respuestaAlbumes = await axios.get(`https://api.deezer.com/artist/${artista.id}/albums?limit=5`);
      const albumes = respuestaAlbumes.data?.data || [];

      console.log(`📀 Álbumes encontrados: ${albumes.length}`);

      let albumesImportados = 0;
      let cancionesImportadas = 0;

      // 3. Importar cada álbum
      for (const albumData of albumes.slice(0, 3)) {
        console.log(`📀 Importando álbum: ${albumData.title}`);

        const albumExistente = await db.getFirstAsync(
          'SELECT id FROM albums WHERE deezer_id = ?',
          [albumData.id.toString()]
        );

        let albumId;

        if (albumExistente) {
          albumId = albumExistente.id;
          console.log('🔄 Álbum ya existe ID:', albumId);
        } else {
          // Guardar álbum
          const albumResult = await db.runAsync(
            `INSERT INTO albums 
             (deezer_id, artist_id, title, cover, cover_small, cover_medium, cover_big, cover_xl, release_date, downloaded_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              albumData.id.toString(),
              artistId,
              albumData.title,
              albumData.cover_medium || albumData.cover || null,
              albumData.cover_small || null,
              albumData.cover_medium || null,
              albumData.cover_big || null,
              albumData.cover_xl || null,
              albumData.release_date || null,
              now
            ]
          );
          albumId = albumResult.lastInsertRowId;
          albumesImportados++;
        }

        // Buscar canciones del álbum
        console.log(`🎵 Buscando canciones de: ${albumData.title}`);
        const respuestaLTracks = await axios.get(`https://api.deezer.com/album/${albumData.id}/tracks`);
        const tracks = respuestaLTracks.data?.data || [];

        // Guardar canciones
        for (const track of tracks) {
          const trackExistente = await db.getFirstAsync(
            'SELECT id FROM tracks WHERE deezer_id = ?',
            [track.id.toString()]
          );

          if (!trackExistente) {
            await db.runAsync(
              `INSERT INTO tracks 
               (deezer_id, album_id, title, track_number, duration, preview, explicit_lyrics)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                track.id.toString(),
                albumId,
                track.title,
                track.track_position || null,
                track.duration || null,
                track.preview || null,
                track.explicit_lyrics ? 1 : 0
              ]
            );
            cancionesImportadas++;
          }
        }
      }

      await db.closeAsync();

      setResultado({
        success: true,
        mensaje: '✅ IMPORTACIÓN COMPLETADA',
        datos: {
          artista: artista.name,
          artistaId: artistId,
          albumes: albumesImportados,
          canciones: cancionesImportadas,
          fans: artista.nb_fan?.toLocaleString() || 0
        }
      });

    } catch (err) {
      console.error('❌ Error importando:', err);
      setError({
        mensaje: err.message,
        detalle: err.toString()
      });
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // FUNCIONES DE TRACKS
  // ============================================

  const probarUpdateTrackRating = async () => {
    if (!trackId) {
      Alert.alert('⚠️ Error', 'Por favor ingresa un ID de canción');
      return;
    }

    const rating = parseInt(calificacion);
    if (rating < 1 || rating > 10) {
      Alert.alert('⚠️ Error', 'La calificación debe ser entre 1 y 10');
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      console.log('🎵 Probando updateTrackRating...');

      const db = await SQLite.openDatabaseAsync('bitacora.db');

      const trackAntes = await db.getFirstAsync(
        `SELECT t.*, a.title as album_title 
       FROM tracks t
       LEFT JOIN albums a ON t.album_id = a.id
       WHERE t.id = ?`,
        [parseInt(trackId)]
      );

      if (!trackAntes) {
        throw new Error(`No existe canción con ID ${trackId}`);
      }

      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE tracks 
       SET rating = ?, comment = ?, last_modified = ?
       WHERE id = ?`,
        [rating, comentario || null, now, parseInt(trackId)]
      );

      const trackDespues = await db.getFirstAsync(
        `SELECT t.*, a.title as album_title 
       FROM tracks t
       LEFT JOIN albums a ON t.album_id = a.id
       WHERE t.id = ?`,
        [parseInt(trackId)]
      );

      await db.closeAsync();

      // ✅ CORREGIDO: Ahora pasamos strings, no objetos
      setResultado({
        success: true,
        mensaje: '✅ Calificación actualizada',
        datos: `🎵 Canción: ${trackDespues.title}
📀 Álbum: ${trackDespues.album_title}
⭐ Calificación anterior: ${trackAntes.rating || 'sin calificar'}
⭐ Calificación nueva: ${trackDespues.rating}
💬 Comentario: ${trackDespues.comment || 'sin comentario'}`
      });

    } catch (err) {
      console.error('❌ Error:', err);
      setError({ mensaje: err.message });
    } finally {
      setCargando(false);
    }
  };

  const probarToggleFavoriteTrack = async () => {
    if (!trackId) {
      Alert.alert('⚠️ Error', 'Por favor ingresa un ID de canción');
      return;
    }

    setCargando(true);

    try {
      const db = await SQLite.openDatabaseAsync('bitacora.db');
      const track = await db.getFirstAsync(
        'SELECT title, is_favorite FROM tracks WHERE id = ?',
        [parseInt(trackId)]
      );

      if (!track) {
        throw new Error(`No existe canción con ID ${trackId}`);
      }

      const newValue = track.is_favorite ? 0 : 1;

      await db.runAsync(
        `UPDATE tracks SET is_favorite = ?, last_modified = ? WHERE id = ?`,
        [newValue, new Date().toISOString(), parseInt(trackId)]
      );

      await db.closeAsync();

      // ✅ CORREGIDO
      setResultado({
        success: true,
        mensaje: `✅ ${track.title}`,
        datos: newValue ? '❤️ Agregada a favoritos' : '☆ Quitada de favoritos'
      });

    } catch (err) {
      setError({ mensaje: err.message });
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // FUNCIONES DE BÚSQUEDA Y LISTADO
  // ============================================

  const buscarArtista = async () => {
    if (!busqueda.trim()) {
      Alert.alert('⚠️ Error', 'Ingresa un término de búsqueda');
      return;
    }

    setCargando(true);
    setError(null);
    setResultadosBusqueda(null);

    try {
      console.log('🔍 Buscando artista:', busqueda);
      const respuesta = await axios.get(`https://api.deezer.com/search/artist?q=${busqueda}&limit=5`);

      if (respuesta.data?.data?.length > 0) {
        setResultadosBusqueda(respuesta.data.data);
        console.log('✅ Artistas encontrados:', respuesta.data.data.length);
      } else {
        Alert.alert('ℹ️ Info', 'No se encontraron artistas');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError({ mensaje: err.message });
    } finally {
      setCargando(false);
    }
  };

  const listarTracks = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('bitacora.db');
      const tracks = await db.getAllAsync(
        `SELECT t.id, t.title, t.rating, t.is_favorite, t.comment,
                a.title as album_title, ar.name as artist_name
         FROM tracks t
         LEFT JOIN albums a ON t.album_id = a.id
         LEFT JOIN artists ar ON a.artist_id = ar.id
         ORDER BY t.id DESC
         LIMIT 30`
      );

      await db.closeAsync();

      if (tracks.length === 0) {
        Alert.alert('ℹ️ Info', 'No hay canciones. Importa un artista primero.');
      } else {
        let mensaje = '🎵 CANCIONES DISPONIBLES:\n\n';
        tracks.forEach(t => {
          mensaje += `ID: ${t.id}\n`;
          mensaje += `🎵 ${t.title}\n`;
          mensaje += `📀 ${t.album_title || '?'} - ${t.artist_name || '?'}\n`;
          mensaje += `⭐ Calificación: ${t.rating || 'sin calificar'}\n`;
          if (t.comment) mensaje += `💬 "${t.comment}"\n`;
          mensaje += `${t.is_favorite ? '❤️ FAVORITA' : ''}\n`;
          mensaje += '-------------------\n';
        });
        Alert.alert('Canciones', mensaje);
      }

    } catch (error) {
      Alert.alert('❌ Error', error.message);
    }
  };

  const verEstadisticas = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('bitacora.db');

      const stats = await db.getFirstAsync(`
        SELECT 
          (SELECT COUNT(*) FROM artists) as total_artistas,
          (SELECT COUNT(*) FROM albums) as total_albumes,
          (SELECT COUNT(*) FROM tracks) as total_canciones,
          (SELECT COUNT(*) FROM tracks WHERE rating IS NOT NULL) as canciones_calificadas,
          (SELECT AVG(rating) FROM tracks WHERE rating IS NOT NULL) as promedio_general,
          (SELECT COUNT(*) FROM tracks WHERE is_favorite = 1) as favoritos
      `);

      await db.closeAsync();

      let mensaje = '📊 ESTADÍSTICAS:\n\n';
      mensaje += `🎤 Artistas: ${stats.total_artistas || 0}\n`;
      mensaje += `📀 Álbumes: ${stats.total_albumes || 0}\n`;
      mensaje += `🎵 Canciones: ${stats.total_canciones || 0}\n`;
      mensaje += `⭐ Calificadas: ${stats.canciones_calificadas || 0}\n`;
      mensaje += `📊 Promedio: ${stats.promedio_general ? stats.promedio_general.toFixed(1) : 'N/A'}\n`;
      mensaje += `❤️ Favoritos: ${stats.favoritos || 0}`;

      Alert.alert('Estadísticas', mensaje);
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">
            🧪 TEST COMPLETO
          </Text>

          {/* Selector de modo */}
          <View className="flex-row mb-4 bg-white rounded-xl p-2">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${modo === 'importar' ? 'bg-purple-600' : 'bg-gray-200'}`}
              onPress={() => setModo('importar')}
            >
              <Text className={`text-center font-semibold ${modo === 'importar' ? 'text-white' : 'text-gray-600'}`}>
                📥 1. Importar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${modo === 'track' ? 'bg-purple-600' : 'bg-gray-200'}`}
              onPress={() => setModo('track')}
            >
              <Text className={`text-center font-semibold ${modo === 'track' ? 'text-white' : 'text-gray-600'}`}>
                🎵 2. Calificar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel de importación */}
          {modo === 'importar' && (
            <View className="bg-white p-4 rounded-xl mb-4">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                📥 IMPORTAR ARTISTA
              </Text>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1">Buscar artista:</Text>
                <View className="flex-row">
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                    placeholder="Ej: queen, metallica"
                    value={busqueda}
                    onChangeText={setBusqueda}
                  />
                  <TouchableOpacity
                    className="bg-purple-600 px-4 py-2 rounded-lg ml-2 justify-center"
                    onPress={buscarArtista}
                    disabled={cargando}
                  >
                    <Text className="text-white">Buscar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {resultadosBusqueda && (
                <View>
                  <Text className="font-medium mb-2">Selecciona un artista:</Text>
                  {resultadosBusqueda.map((artista) => (
                    <TouchableOpacity
                      key={artista.id}
                      className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200"
                      onPress={() => importarArtista(artista)}
                      disabled={cargando}
                    >
                      <Text className="font-semibold">{artista.name}</Text>
                      <Text className="text-gray-600">🎤 {artista.nb_fan?.toLocaleString()} fans</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Panel de calificaciones */}
          {modo === 'track' && (
            <View className="bg-white p-4 rounded-xl mb-4">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                🎵 CALIFICAR CANCIONES
              </Text>

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 mb-3"
                placeholder="ID de la canción"
                value={trackId}
                onChangeText={setTrackId}
                keyboardType="numeric"
              />

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 mb-3"
                placeholder="Calificación (1-10)"
                value={calificacion}
                onChangeText={setCalificacion}
                keyboardType="numeric"
              />

              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 mb-3"
                placeholder="Comentario (opcional)"
                value={comentario}
                onChangeText={setComentario}
              />

              <TouchableOpacity
                className="bg-green-600 py-3 px-6 rounded-xl mb-2"
                onPress={probarUpdateTrackRating}
                disabled={cargando}
              >
                <Text className="text-white text-center font-semibold">
                  ⭐ Guardar calificación
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-yellow-600 py-3 px-6 rounded-xl"
                onPress={probarToggleFavoriteTrack}
                disabled={cargando}
              >
                <Text className="text-white text-center font-semibold">
                  ❤️ Marcar favorito
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Panel de utilidades */}
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              📋 UTILIDADES
            </Text>

            <View className="flex-row flex-wrap">
              <TouchableOpacity
                className="bg-blue-500 py-2 px-4 rounded-lg m-1"
                onPress={listarTracks}
              >
                <Text className="text-white">🎵 Ver canciones</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-500 py-2 px-4 rounded-lg m-1"
                onPress={verEstadisticas}
              >
                <Text className="text-white">📊 Estadísticas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-100 p-4 rounded-xl mb-4">
              <Text className="text-red-800 font-bold mb-2">❌ Error:</Text>
              <Text className="text-red-700">{error.mensaje}</Text>
            </View>
          )}

          {/* Resultado */}
          {resultado && (
            <View className="bg-green-100 p-4 rounded-xl">
              <Text className="text-green-800 font-bold mb-2">✅ {resultado.mensaje}</Text>
              <View className="bg-white p-3 rounded-lg">
                {Object.entries(resultado.datos || {}).map(([key, value]) => (
                  <Text key={key} className="text-gray-700">
                    {key}: {value}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}