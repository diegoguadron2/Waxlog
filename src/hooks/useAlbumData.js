import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import deezerApi from '../services/deezerApi';
import { executeDBOperation, dbHelpers } from '../database/Index';

export const useAlbumData = (initialAlbum, artistName, artistId) => {
    const [album, setAlbum] = useState(initialAlbum || {});
    const [albumDetails, setAlbumDetails] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [albumState, setAlbumState] = useState(null);
    const [albumRating, setAlbumRating] = useState(0);
    const [albumComment, setAlbumComment] = useState('');
    const [localAlbumId, setLocalAlbumId] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [dominantColor, setDominantColor] = useState('#000000');
    const [resolvedArtistId, setResolvedArtistId] = useState(artistId || null);

    const mountedRef = useRef(true);
    const operationInProgressRef = useRef(false);

    const waitForDB = async (ms = 300) => {
        await new Promise(resolve => setTimeout(resolve, ms));
    };

    // Verificar si el álbum está guardado
    const checkIfSaved = useCallback(async () => {
        return executeDBOperation(async (db) => {
            const deezerAlbumId = album?.id || initialAlbum?.id;

            let localAlbum = null;

            if (deezerAlbumId) {
                localAlbum = await db.getFirstAsync(
                    `SELECT a.*, ar.name as artist_name, ar.id as artist_id 
                     FROM albums a 
                     LEFT JOIN artists ar ON a.artist_id = ar.id 
                     WHERE a.deezer_id = ?`,
                    [deezerAlbumId.toString()]
                );
            }

            if (!localAlbum && artistName && album?.title) {
                localAlbum = await db.getFirstAsync(
                    `SELECT a.*, ar.name as artist_name, ar.id as artist_id 
                     FROM albums a 
                     LEFT JOIN artists ar ON a.artist_id = ar.id 
                     WHERE a.title = ? AND ar.name = ?`,
                    [album.title, artistName]
                );
            }

            if (localAlbum) {
                setIsSaved(true);
                setLocalAlbumId(localAlbum.id);
                setAlbumState(localAlbum.state);
                setAlbumComment(localAlbum.user_description || '');
                setIsFavorite(localAlbum.is_favorite === 1);
                setAlbumDetails(localAlbum);

                if (!artistId && localAlbum.artist_id) {
                    const artistRow = await db.getFirstAsync(
                        'SELECT deezer_id FROM artists WHERE id = ?',
                        [localAlbum.artist_id]
                    );
                    if (artistRow?.deezer_id) {
                        setResolvedArtistId(artistRow.deezer_id);
                    }
                } else if (artistId) {
                    setResolvedArtistId(artistId);
                }

                const savedTracks = await db.getAllAsync(
                    `SELECT * FROM tracks WHERE album_id = ? ORDER BY id`, [localAlbum.id]
                );

                if (savedTracks.length > 0) {
                    setTracks(savedTracks);

                    const ratedTracks = savedTracks.filter(t => t.rating);
                    if (ratedTracks.length > 0) {
                        const avg = ratedTracks.reduce((sum, t) => sum + t.rating, 0) / ratedTracks.length;
                        setAlbumRating(avg);
                    }
                } else {
                    setTracks([]);
                }
            } else {
                setIsSaved(false);
                setLocalAlbumId(null);
                setAlbumDetails(null);

                if (deezerAlbumId) {
                    try {
                        const tracksRes = await deezerApi.getAlbumTracks(deezerAlbumId);
                        const tempTracks = (tracksRes.data || []).map((track, index) => ({
                            id: track.id,
                            title: track.title,
                            track_number: track.track_position || index + 1,
                            duration: track.duration,
                            rating: null,
                            comment: null
                        }));
                        setTracks(tempTracks);
                    } catch (error) {
                        if (__DEV__) console.log('Error cargando tracks de Deezer:', error);
                        setTracks([]);
                    }
                } else {
                    setTracks([]);
                }
            }
        });
    }, [album, initialAlbum, artistName]);

    // Cargar datos iniciales
    const loadAlbumData = useCallback(async () => {
        setLoading(true);
        try {
            await checkIfSaved();
        } catch (error) {
            if (__DEV__) console.error('Error cargando datos:', error);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [checkIfSaved]);

    // Guardar álbum (descargar)
    const saveAlbum = useCallback(async () => {
        if (operationInProgressRef.current) return;

        operationInProgressRef.current = true;
        setLoading(true);
        if (__DEV__) console.log('🔄 Guardando álbum');

        try {
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();

                // 1. Verificar/Guardar artista
                let localArtist = await db.getFirstAsync('SELECT id FROM artists WHERE deezer_id = ?', [artistId.toString()]);

                if (!localArtist) {
                    const artistDetails = await deezerApi.getArtistById(artistId);
                    const artistResult = await db.runAsync(
                        `INSERT INTO artists (deezer_id, name, picture, downloaded_at, last_updated) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            artistId.toString(),
                            artistDetails.name,
                            artistDetails.picture_medium,
                            now,
                            now
                        ]
                    );
                    localArtist = { id: artistResult.lastInsertRowId };
                }

                // 2. Obtener detalles del álbum de Deezer
                const albumDetails = await deezerApi.getAlbumById(album.id);

                // 3. Procesar géneros, duración y sello
                let genres = null;
                if (albumDetails.genres?.data) {
                    const genreNames = albumDetails.genres.data.map(g => g.name);
                    genres = JSON.stringify(genreNames);
                }
                const duration    = albumDetails.duration ? parseInt(albumDetails.duration) : null;
                const recordLabel = albumDetails.label    ? String(albumDetails.label)       : null;

                // 4. Guardar álbum con toda la información disponible
                const insertQuery = `
                    INSERT INTO albums (
                        deezer_id, artist_id, title, cover, release_date, record_type,
                        genres, duration, record_label, downloaded_at, last_updated, state
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const params = [
                    album.id.toString(),
                    localArtist.id,
                    albumDetails.title,
                    albumDetails.cover_medium || albumDetails.cover,
                    albumDetails.release_date,
                    albumDetails.record_type || 'album',
                    genres,
                    duration,
                    recordLabel,
                    now,
                    now,
                    'to_listen'
                ];

                const result = await db.runAsync(insertQuery, params);
                const newAlbumId = result.lastInsertRowId;

                // 5. Guardar tracks
                const tracksRes = await deezerApi.getAlbumTracks(album.id);
                if (tracksRes.data && tracksRes.data.length > 0) {
                    for (let i = 0; i < tracksRes.data.length; i++) {
                        const track = tracksRes.data[i];
                        await db.runAsync(
                            `INSERT INTO tracks (album_id, title, track_number, duration, last_modified)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                newAlbumId,
                                track.title,
                                track.track_position,
                                track.duration,
                                now
                            ]
                        );
                    }
                }
            });

            await waitForDB(800);
            await checkIfSaved();
            Alert.alert('✅ Éxito', 'Álbum guardado correctamente');
            if (__DEV__) console.log('✅ Álbum guardado');

        } catch (error) {
            if (__DEV__) console.error('Error guardando álbum:', error);
            Alert.alert('❌ Error', 'No se pudo guardar el álbum: ' + error.message);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
            operationInProgressRef.current = false;
        }
    }, [album.id, artistId, checkIfSaved]);

    const updateAlbumState = useCallback(async (state) => {
        if (!localAlbumId || operationInProgressRef.current) return;

        operationInProgressRef.current = true;
        if (__DEV__) console.log(`🔄 Actualizando estado a: ${state}`);

        try {
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();
                await db.runAsync(
                    `UPDATE albums SET state = ?, last_updated = ? WHERE id = ?`,
                    [state, now, localAlbumId]
                );
            });

            await waitForDB(300);
            setAlbumState(state);
            if (__DEV__) console.log(`✅ Estado actualizado a: ${state}`);

        } catch (error) {
            if (__DEV__) console.error('Error actualizando estado:', error);
            Alert.alert('Error', 'No se pudo actualizar el estado');
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId]);

    // Toggle favorito
    const toggleFavorite = useCallback(async () => {
        if (!localAlbumId || operationInProgressRef.current) return;

        operationInProgressRef.current = true;
        if (__DEV__) console.log(`🔄 Toggle favorito: ${!isFavorite}`);

        try {
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();
                const newValue = isFavorite ? 0 : 1;
                await db.runAsync(
                    `UPDATE albums SET is_favorite = ?, last_updated = ? WHERE id = ?`,
                    [newValue, now, localAlbumId]
                );
            });

            await waitForDB(300);
            setIsFavorite(!isFavorite);
            if (__DEV__) console.log(`✅ Favorito actualizado: ${!isFavorite}`);

        } catch (error) {
            if (__DEV__) console.error('Error toggling favorito:', error);
            Alert.alert('Error', 'No se pudo actualizar favorito');
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId, isFavorite]);

    // Eliminar álbum
    const deleteAlbum = useCallback(async () => {
        if (!localAlbumId || operationInProgressRef.current) return false;

        operationInProgressRef.current = true;
        if (__DEV__) console.log('🔄 Eliminando álbum');

        try {
            const album = await executeDBOperation(async (db) => {
                return await db.getFirstAsync('SELECT cover_local FROM albums WHERE id = ?', [localAlbumId]);
            });

            if (album?.cover_local) {
                await FileSystem.deleteAsync(album.cover_local).catch(() => { });
            }

            await dbHelpers.deleteAlbumAndCleanup(localAlbumId);

            await waitForDB(500);
            if (__DEV__) console.log('✅ Álbum eliminado');
            return true;

        } catch (error) {
            if (__DEV__) console.error('Error eliminando álbum:', error);
            Alert.alert('Error', 'No se pudo eliminar el álbum');
            return false;
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId]);

    // Guardar comentario del álbum
    // Guardar géneros del álbum
    const saveGenres = useCallback(async (genresList) => {
        if (!localAlbumId || operationInProgressRef.current) return false;

        operationInProgressRef.current = true;

        try {
            const genresJson = JSON.stringify(genresList);
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();
                await db.runAsync(
                    `UPDATE albums SET genres = ?, last_updated = ? WHERE id = ?`,
                    [genresJson, now, localAlbumId]
                );
            });

            await waitForDB(300);
            // Actualizar albumDetails localmente
            if (albumDetails) {
                setAlbumDetails({ ...albumDetails, genres: JSON.stringify(genresList) });
            }
            return true;

        } catch (error) {
            if (__DEV__) console.error('Error guardando géneros:', error);
            Alert.alert('Error', 'No se pudieron guardar los géneros');
            return false;
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId, albumDetails]);

    const saveAlbumComment = useCallback(async (comment) => {
        if (!localAlbumId || operationInProgressRef.current) return false;

        operationInProgressRef.current = true;
        if (__DEV__) console.log('🔄 Guardando comentario');

        try {
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();
                await db.runAsync(
                    `UPDATE albums SET user_description = ?, last_updated = ? WHERE id = ?`,
                    [comment, now, localAlbumId]
                );
            });

            await waitForDB(300);
            setAlbumComment(comment);
            if (__DEV__) console.log('✅ Comentario guardado');
            return true;

        } catch (error) {
            if (__DEV__) console.error('Error guardando comentario:', error);
            Alert.alert('Error', 'No se pudo guardar el comentario');
            return false;
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId]);

    // Guardar calificación de canción
    const saveTrackRating = useCallback(async (trackId, rating, comment) => {
        if (!localAlbumId || operationInProgressRef.current) return;

        operationInProgressRef.current = true;
        if (__DEV__) console.log(`🔄 Guardando calificación para track ${trackId}: ${rating}`);

        try {
            await executeDBOperation(async (db) => {
                const now = new Date().toISOString();
                await db.runAsync(
                    `UPDATE tracks SET rating = ?, comment = ?, last_modified = ? WHERE id = ?`,
                    [rating, comment, now, trackId]
                );
            });

            const updatedTracks = tracks.map(t =>
                t.id === trackId ? { ...t, rating, comment } : t
            );
            setTracks(updatedTracks);

            const ratedTracks = updatedTracks.filter(t => t.rating);
            if (ratedTracks.length > 0) {
                const avg = ratedTracks.reduce((sum, t) => sum + t.rating, 0) / ratedTracks.length;
                setAlbumRating(avg);
            }

            await waitForDB(300);
            Alert.alert('Éxito', 'Calificación guardada');
            if (__DEV__) console.log('✅ Calificación guardada');

        } catch (error) {
            if (__DEV__) console.error('Error guardando calificación:', error);
            Alert.alert('Error', 'No se pudo guardar la calificación');
        } finally {
            operationInProgressRef.current = false;
        }
    }, [localAlbumId, tracks]);

    const refreshAlbumInfo = useCallback(async () => {
        if (!isSaved || !localAlbumId || operationInProgressRef.current) return;

        operationInProgressRef.current = true;
        setRefreshing(true);
        if (__DEV__) console.log('🔄 Actualizando información desde Deezer');

        try {
            await executeDBOperation(async (db) => {
                const deezerAlbumId = album?.id || initialAlbum?.id;

                if (!deezerAlbumId) {
                    throw new Error('No se pudo obtener el ID de Deezer');
                }

                const albumDetails = await deezerApi.getAlbumById(deezerAlbumId);

                if (!albumDetails) {
                    throw new Error('No se pudo obtener información de Deezer');
                }

                const now = new Date().toISOString();

                const record_type = albumDetails.record_type ? String(albumDetails.record_type) : null;
                const duration = albumDetails.duration ? parseInt(albumDetails.duration) : null;
                const record_label = albumDetails.label ? String(albumDetails.label) : null;

                let genres = null;
                if (albumDetails.genres?.data && Array.isArray(albumDetails.genres.data)) {
                    const genreNames = albumDetails.genres.data
                        .map(g => g.name)
                        .filter(name => name && typeof name === 'string');

                    if (genreNames.length > 0) {
                        genres = JSON.stringify(genreNames);
                    }
                }

                await db.runAsync(
                    `UPDATE albums SET
                        record_type = ?,
                        duration = ?,
                        genres = ?,
                        record_label = ?,
                        last_updated = ?
                     WHERE id = ?`,
                    [
                        record_type,
                        duration,
                        genres,
                        record_label,
                        now,
                        localAlbumId
                    ]
                );
            });

            await waitForDB(500);
            await checkIfSaved();
            Alert.alert('✅ Éxito', 'Información del álbum actualizada correctamente');
            if (__DEV__) console.log('✅ Información actualizada');

        } catch (error) {
            if (__DEV__) console.error('❌ Error actualizando información:', error);
            Alert.alert('❌ Error', 'No se pudo actualizar la información: ' + error.message);
        } finally {
            if (mountedRef.current) {
                setRefreshing(false);
            }
            operationInProgressRef.current = false;
        }
    }, [isSaved, localAlbumId, album?.id, initialAlbum?.id, checkIfSaved]);

    const updateAlbum = useCallback((newAlbum) => {
        setAlbum(newAlbum);
    }, []);

    return {
        album,
        albumDetails,
        tracks,
        loading,
        refreshing,
        isSaved,
        albumState,
        albumRating,
        albumComment,
        localAlbumId,
        isFavorite,
        dominantColor,
        setDominantColor,
        resolvedArtistId,

        loadAlbumData,
        saveAlbum,
        updateAlbumState,
        toggleFavorite,
        deleteAlbum,
        saveAlbumComment,
        saveGenres,
        saveTrackRating,
        refreshAlbumInfo,
        updateAlbum,

        setTracks,
    };
};