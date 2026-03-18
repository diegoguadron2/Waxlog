import * as SQLite from 'expo-sqlite';

let db = null;

let dbOperationQueue = Promise.resolve();
let dbConnectionCount = 0;

export const getDB = async () => {
  if (!db) {
    console.log('Abriendo base de datos...');
    db = await SQLite.openDatabaseAsync('bitacora.db');
    console.log(' Base de datos lista');
  }
  return db;
};

export const executeDBOperation = async (operation) => {
  dbOperationQueue = dbOperationQueue.then(async () => {
    dbConnectionCount++;
    console.log(`Iniciando operación BD (${dbConnectionCount})`);

    const startTime = Date.now();

    try {
      const db = await getDB();
      const result = await operation(db);
      const duration = Date.now() - startTime;
      console.log(` Operación completada en ${duration}ms (${dbConnectionCount})`);
      return result;
    } catch (error) {
      console.error(' Error en operación BD:', error);
      throw error;
    } finally {
      dbConnectionCount--;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });

  return dbOperationQueue;
};

export const executeTransaction = async (operations) => {
  return executeDBOperation(async (db) => {
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      console.log(' Transacción iniciada');

      const result = await operations(db);

      await db.execAsync('COMMIT;');
      console.log(' Transacción completada');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.log(' Transacción cancelada (rollback)');
      throw error;
    }
  });
};

export const resetDB = async () => {
  return executeDBOperation(async () => {
    if (db) {
      try {
        await db.closeAsync();
        console.log(' Conexión cerrada');
      } catch (e) {
        console.log(' Error cerrando conexión:', e);
      }
      db = null;
    }
    console.log(' Base de datos reiniciada');
  });
};

export const cleanupOrphanArtists = async () => {
  return executeDBOperation(async (db) => {
    const result = await db.runAsync(`
      DELETE FROM artists 
      WHERE id NOT IN (SELECT DISTINCT artist_id FROM albums WHERE artist_id IS NOT NULL)
    `);

    console.log(` Eliminados ${result.changes || 0} artistas huérfanos`);
    return result.changes || 0;
  });
};

export const verifyRelations = async () => {
  return executeDBOperation(async (db) => {
    let fixes = { orphanTracks: 0, orphanAlbums: 0, orphanArtists: 0 };

    const orphanTracks = await db.getAllAsync(`
      SELECT t.id, t.title 
      FROM tracks t
      LEFT JOIN albums a ON t.album_id = a.id
      WHERE a.id IS NULL
    `);

    if (orphanTracks.length > 0) {
      console.log(` Encontradas ${orphanTracks.length} canciones huérfanas`);

      await db.runAsync(`
        DELETE FROM tracks 
        WHERE album_id NOT IN (SELECT id FROM albums)
      `);
      fixes.orphanTracks = orphanTracks.length;
    }

    const orphanAlbums = await db.getAllAsync(`
      SELECT a.id, a.title 
      FROM albums a
      LEFT JOIN artists ar ON a.artist_id = ar.id
      WHERE ar.id IS NULL AND a.artist_id IS NOT NULL
    `);

    if (orphanAlbums.length > 0) {
      console.log(` Encontrados ${orphanAlbums.length} álbumes huérfanos`);

      await db.runAsync(`
        UPDATE albums SET artist_id = NULL 
        WHERE artist_id NOT IN (SELECT id FROM artists)
      `);
      fixes.orphanAlbums = orphanAlbums.length;
    }

    const deletedArtists = await cleanupOrphanArtists();
    fixes.orphanArtists = deletedArtists;

    console.log('Verificación completada:', fixes);
    return fixes;
  });
};

export const refreshAlbumStats = async () => {
  return executeDBOperation(async (db) => {
    await db.runAsync(`
      UPDATE albums 
      SET total_tracks = (
        SELECT COUNT(*) FROM tracks WHERE tracks.album_id = albums.id
      )
      WHERE id IN (SELECT DISTINCT album_id FROM tracks)
    `);

    console.log('Estadísticas de álbumes actualizadas');
    return true;
  });
};

export const runFullCleanup = async () => {
  console.log('Iniciando limpieza completa de la base de datos...');

  const relations = await verifyRelations();

  await refreshAlbumStats();

  console.log('Limpieza completada');
  return relations;
};

export const initDatabase = async () => {
  return executeDBOperation(async (database) => {
    // Crear tabla artists
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deezer_id TEXT UNIQUE,
        name TEXT NOT NULL,
        picture TEXT,
        picture_local TEXT,
        biography TEXT,
        nb_fans INTEGER,
        genres TEXT,
        downloaded_at TEXT,
        last_updated TEXT
      );
    `);

    // Crear tabla albums
    await database.execAsync(`
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
        record_label TEXT,
        explicit_lyrics INTEGER DEFAULT 0,
        state TEXT DEFAULT 'to_listen',
        is_favorite INTEGER DEFAULT 0,
        user_description TEXT,
        downloaded_at TEXT,
        last_updated TEXT,
        tracklist TEXT,
        FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
      );
    `);

    // Crear tabla tracks
    await database.execAsync(`
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

    console.log('Tablas listas');

    // Migración: agregar tier_position si no existe
    try {
      await database.execAsync(`ALTER TABLE albums ADD COLUMN tier_position TEXT;`);
    } catch (_) {
      // La columna ya existe — ignorar el error
    }
  });
};

export const dbHelpers = {

  saveManualAlbum: async (albumData) => {
    return executeDBOperation(async (db) => {
      const now = new Date().toISOString();

      // Verificar que el artista existe
      if (!albumData.artist_id) {
        throw new Error('El ID del artista es obligatorio');
      }

      const escapeSQL = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${String(str).replace(/'/g, "''")}'`;
      };

      const deezer_id = albumData.deezer_id === null || albumData.deezer_id === undefined
        ? 'NULL'
        : `'${String(albumData.deezer_id).replace(/'/g, "''")}'`;

      const artist_id = Number(albumData.artist_id);
      const title = escapeSQL(albumData.title || '');
      const cover = escapeSQL(albumData.cover || '');
      const release_date = escapeSQL(albumData.release_date || '');
      const record_type = escapeSQL(albumData.record_type || 'album');

      let genres = 'NULL';
      if (albumData.genres !== null && albumData.genres !== undefined) {
        genres = escapeSQL(albumData.genres);
      }

      const downloaded_at = escapeSQL(albumData.downloaded_at || now);
      const last_updated = escapeSQL(albumData.last_updated || now);
      const state = escapeSQL(albumData.state || 'to_listen');

      // Query completa
      const query = `
        INSERT INTO albums (
          deezer_id, artist_id, title, cover, release_date, record_type,
          genres, downloaded_at, last_updated, state
        ) VALUES (
          ${deezer_id}, ${artist_id}, ${title}, ${cover}, ${release_date}, 
          ${record_type}, ${genres}, ${downloaded_at}, ${last_updated}, ${state}
        );
      `;

      console.log('📝 Query a ejecutar:', query);

      try {
        await db.execAsync(query);

        // Obtener el último ID insertado
        const result = await db.getFirstAsync('SELECT last_insert_rowid() as id');
        console.log('Álbum guardado con ID:', result.id);
        return result.id;

      } catch (error) {
        console.error('Error en saveManualAlbum:', error);
        console.error(' Query que falló:', query);
        throw error;
      }
    });
  },

  saveManualTrack: async (trackData) => {
    return executeDBOperation(async (db) => {
      const { album_id, title, track_number, duration } = trackData;
      const now = new Date().toISOString();

      return await db.runAsync(
        `INSERT INTO tracks (album_id, title, track_number, duration, last_modified)
       VALUES (?, ?, ?, ?, ?)`,
        [album_id, title, track_number, duration, now]
      );
    });
  },

  // Artistas
  saveArtist: async (artistData) => {
    return executeDBOperation(async (db) => {
      const now = new Date().toISOString();

      const deezer_id = artistData.deezer_id ? artistData.deezer_id.toString() : null;

      if (!deezer_id) {
        throw new Error('deezer_id es requerido');
      }

      const existing = await db.getFirstAsync(
        'SELECT id FROM artists WHERE deezer_id = ?',
        [deezer_id]
      );

      if (existing) {
        await db.runAsync(
          `UPDATE artists SET 
            name = ?, picture = ?, last_updated = ?
           WHERE deezer_id = ?`,
          [
            artistData.name,
            artistData.picture,
            now,
            deezer_id
          ]
        );
        return existing.id;
      } else {
        const result = await db.runAsync(
          `INSERT INTO artists 
           (deezer_id, name, picture, downloaded_at, last_updated)
           VALUES (?, ?, ?, ?, ?)`,
          [
            deezer_id,
            artistData.name,
            artistData.picture,
            now,
            now
          ]
        );
        return result.lastInsertRowId;
      }
    });
  },

  saveAlbum: async (albumData, artistId) => {
    return executeDBOperation(async (db) => {
      const now = new Date().toISOString();
      const deezer_id = albumData.id ? albumData.id.toString() : null;

      let genres = null;
      if (albumData.genres?.data) {
        try {
          genres = JSON.stringify(albumData.genres.data);
        } catch (e) {
          console.log(' Error procesando géneros:', e);
        }
      }

      const existing = await db.getFirstAsync(
        'SELECT id FROM albums WHERE deezer_id = ?',
        [deezer_id]
      );

      if (existing) {
        await db.runAsync(
          `UPDATE albums SET
            title = ?, 
            cover = ?, 
            cover_small = ?, 
            cover_medium = ?,
            cover_big = ?, 
            cover_xl = ?, 
            release_date = ?, 
            record_type = ?,
            total_tracks = ?,
            duration = ?,
            genres = ?,
            description = ?,
            record_label = ?,
            explicit_lyrics = ?, 
            last_updated = ?
           WHERE deezer_id = ?`,
          [
            albumData.title,
            albumData.cover_medium,
            albumData.cover_small,
            albumData.cover_medium,
            albumData.cover_big,
            albumData.cover_xl,
            albumData.release_date,
            albumData.record_type,
            albumData.nb_tracks,
            albumData.duration,
            genres,
            albumData.description,
            albumData.label,
            albumData.explicit_lyrics ? 1 : 0,
            now,
            deezer_id
          ]
        );
        return existing.id;
      } else {
        const result = await db.runAsync(
          `INSERT INTO albums 
           (deezer_id, artist_id, title, cover, cover_small, cover_medium, cover_big, cover_xl,
            release_date, record_type, total_tracks, duration, genres, description, record_label,
            explicit_lyrics, downloaded_at, last_updated, state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            deezer_id,
            artistId,
            albumData.title,
            albumData.cover_medium,
            albumData.cover_small,
            albumData.cover_medium,
            albumData.cover_big,
            albumData.cover_xl,
            albumData.release_date,
            albumData.record_type,
            albumData.nb_tracks,
            albumData.duration,
            genres,
            albumData.description,
            albumData.label,
            albumData.explicit_lyrics ? 1 : 0,
            now,
            now,
            'to_listen'
          ]
        );
        return result.lastInsertRowId;
      }
    });
  },

  saveTracks: async (tracksData, albumId) => {
    return executeDBOperation(async (db) => {
      const now = new Date().toISOString();
      const results = [];

      for (const track of tracksData) {
        const deezer_id = track.id ? track.id.toString() : null;

        const existing = await db.getFirstAsync(
          'SELECT id FROM tracks WHERE deezer_id = ?',
          [deezer_id]
        );

        if (!existing) {
          const result = await db.runAsync(
            `INSERT INTO tracks 
             (deezer_id, album_id, title, track_number, duration, preview, explicit_lyrics, last_modified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              deezer_id,
              albumId,
              track.title,
              track.track_position,
              track.duration,
              track.preview,
              track.explicit_lyrics ? 1 : 0,
              now
            ]
          );
          results.push(result.lastInsertRowId);
        }
      }
      return results;
    });
  },

  deleteAlbumAndCleanup: async (albumId) => {
    return executeTransaction(async (db) => {
      const album = await db.getFirstAsync(
        'SELECT artist_id FROM albums WHERE id = ?',
        [albumId]
      );

      const artistId = album?.artist_id;

      await db.runAsync('DELETE FROM albums WHERE id = ?', [albumId]);

      if (artistId) {
        const remainingAlbums = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM albums WHERE artist_id = ?',
          [artistId]
        );

        if (remainingAlbums?.count === 0) {
          await db.runAsync('DELETE FROM artists WHERE id = ?', [artistId]);
          console.log(` Artista ${artistId} eliminado (sin álbumes)`);
        }
      }

      return true;
    });
  },

  searchAlbums: async (searchText) => {
    return executeDBOperation(async (db) => {
      return await db.getAllAsync(
        `SELECT a.*, ar.name as artist_name 
         FROM albums a
         LEFT JOIN artists ar ON a.artist_id = ar.id
         WHERE a.title LIKE ? OR ar.name LIKE ?
         ORDER BY a.downloaded_at DESC`,
        [`%${searchText}%`, `%${searchText}%`]
      );
    });
  },

  // Obtener estadísticas
  getStats: async () => {
    return executeDBOperation(async (db) => {
      const totalAlbums = await db.getFirstAsync('SELECT COUNT(*) as count FROM albums');
      const totalTracks = await db.getFirstAsync('SELECT COUNT(*) as count FROM tracks');
      const totalArtists = await db.getFirstAsync('SELECT COUNT(*) as count FROM artists');

      const stateCounts = await db.getAllAsync(
        `SELECT state, COUNT(*) as count FROM albums GROUP BY state`
      );

      const favoriteCount = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM albums WHERE is_favorite = 1`
      );

      const states = {
        listened: 0,
        listening: 0,
        to_listen: 0
      };

      stateCounts.forEach(item => {
        if (states.hasOwnProperty(item.state)) {
          states[item.state] = item.count;
        }
      });

      return {
        totalAlbums: totalAlbums.count,
        totalTracks: totalTracks.count,
        totalArtists: totalArtists.count,
        favoriteAlbums: favoriteCount.count,
        ...states
      };
    });
  },

  // Obtener álbumes por estado
  getAlbumsByState: async (state, sortBy = 'recent_desc') => {
    return executeDBOperation(async (db) => {
      let orderClause = 'ORDER BY a.downloaded_at DESC';
      if (sortBy === 'name_asc') orderClause = 'ORDER BY a.title ASC';
      if (sortBy === 'name_desc') orderClause = 'ORDER BY a.title DESC';
      if (sortBy === 'rating_desc') orderClause = 'ORDER BY avg_rating DESC';
      if (sortBy === 'rating_asc') orderClause = 'ORDER BY avg_rating ASC';

      return await db.getAllAsync(
        `SELECT 
          a.*, 
          ar.name as artist_name,
          ar.deezer_id as artist_deezer_id,
          COUNT(t.id) as total_tracks,
          AVG(t.rating) as avg_rating
         FROM albums a
         LEFT JOIN artists ar ON a.artist_id = ar.id
         LEFT JOIN tracks t ON a.id = t.album_id
         WHERE a.state = ?
         GROUP BY a.id
         ${orderClause}`,
        [state]
      );
    });
  }
};

export default {
  getDB,
  executeDBOperation,
  executeTransaction,
  resetDB,
  initDatabase,
  cleanupOrphanArtists,
  verifyRelations,
  refreshAlbumStats,
  runFullCleanup,
  dbHelpers
};