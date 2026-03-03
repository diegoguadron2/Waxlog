import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDB, dbHelpers } from '../database/Index';
import deezerApi from '../services/deezerApi';

const { width, height } = Dimensions.get('window');

export default function SaveAlbumScreen({ navigation }) {
    // Referencias para inputs
    const artistInputRef = useRef(null);
    const albumTitleInputRef = useRef(null);

    // Estados principales
    const [loading, setLoading] = useState(false);
    const [artistSearch, setArtistSearch] = useState('');
    const [artistResults, setArtistResults] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [showArtistResults, setShowArtistResults] = useState(false);

    const [albumTitle, setAlbumTitle] = useState('');
    const [albumYear, setAlbumYear] = useState('');
    const [albumType, setAlbumType] = useState('album');
    const [coverUrl, setCoverUrl] = useState('');

    const [tracks, setTracks] = useState([]);
    const [currentTrack, setCurrentTrack] = useState({ title: '', duration: '' });

    // Estados para búsqueda de géneros
    const [genreSearch, setGenreSearch] = useState('');
    const [genreResults, setGenreResults] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [showGenreResults, setShowGenreResults] = useState(false);

    // Lista de géneros comunes (para búsqueda)
    const commonGenres = [
        'Rock', 'Pop', 'Hip Hop', 'Rap', 'Electrónica', 'House', 'Techno',
        'Jazz', 'Blues', 'Clásica', 'Reggae', 'Funk', 'Soul', 'R&B',
        'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternativo',
        'Latina', 'Salsa', 'Bachata', 'Reggaetón', 'Cumbia', 'Tango',
        'K-Pop', 'J-Pop', 'Animé', 'Soundtrack', 'Bandas Sonoras'
    ];

    useEffect(() => {
        navigation.getParent()?.setOptions({
            tabBarStyle: { display: 'none' }
        });
    }, [navigation]);

    // Buscar artistas locales o en Deezer
    useEffect(() => {
        const searchArtists = async () => {
            if (artistSearch.length < 2) {
                setArtistResults([]);
                return;
            }

            try {
                const db = await getDB();

                // Buscar en BD local
                const localArtists = await db.getAllAsync(
                    `SELECT id, deezer_id, name, picture FROM artists 
                     WHERE name LIKE ? ORDER BY name ASC LIMIT 10`,
                    [`%${artistSearch}%`]
                );

                // Buscar en Deezer (si hay conexión)
                let deezerArtists = [];
                try {
                    const deezerResponse = await deezerApi.searchArtists(artistSearch);

                    if (Array.isArray(deezerResponse)) {
                        deezerArtists = deezerResponse.slice(0, 5).map(a => ({
                            id: `deezer_${a.id}`,
                            deezer_id: a.id,
                            name: a.name,
                            picture: a.picture_medium || a.picture,
                            fromDeezer: true,
                            fromLocal: false
                        }));
                    } else if (deezerResponse && deezerResponse.data && Array.isArray(deezerResponse.data)) {
                        deezerArtists = deezerResponse.data.slice(0, 5).map(a => ({
                            id: `deezer_${a.id}`,
                            deezer_id: a.id,
                            name: a.name,
                            picture: a.picture_medium || a.picture,
                            fromDeezer: true,
                            fromLocal: false
                        }));
                    }
                } catch (error) {
                    console.log('Error buscando en Deezer:', error);
                }

                // Marcar artistas locales
                const localMarked = localArtists.map(a => ({
                    ...a,
                    fromLocal: true,
                    fromDeezer: false,
                    id: `local_${a.id}`
                }));

                // Combinar resultados
                const combined = [
                    ...localMarked,
                    ...deezerArtists.filter(d => !localMarked.some(l => l.deezer_id == d.deezer_id))
                ];

                setArtistResults(combined);
                setShowArtistResults(true);

            } catch (error) {
                console.error('Error buscando artistas:', error);
            }
        };

        const timer = setTimeout(searchArtists, 500);
        return () => clearTimeout(timer);
    }, [artistSearch]);

    // Buscar géneros
    useEffect(() => {
        if (genreSearch.length < 1) {
            setGenreResults([]);
            return;
        }

        const filtered = commonGenres
            .filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()))
            .slice(0, 10);

        setGenreResults(filtered);
        setShowGenreResults(true);
    }, [genreSearch]);

    const selectArtist = (artist) => {
        setSelectedArtist(artist);
        setArtistSearch(artist.name);
        setShowArtistResults(false);
        artistInputRef.current?.blur();
    };

    const addGenre = (genre) => {
        if (!selectedGenres.includes(genre)) {
            setSelectedGenres([...selectedGenres, genre]);
        }
        setGenreSearch('');
        setShowGenreResults(false);
    };

    const removeGenre = (genre) => {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
    };

    const parseDurationToSeconds = (durationStr) => {
        if (!durationStr) return null;
        if (!isNaN(durationStr) && durationStr.trim() !== '') {
            return parseInt(durationStr);
        }
        const parts = durationStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return (minutes * 60) + seconds;
        }
        return null;
    };

    const addTrack = () => {
        if (!currentTrack.title.trim()) {
            Alert.alert('Error', 'El título de la canción es obligatorio');
            return;
        }

        const durationInSeconds = parseDurationToSeconds(currentTrack.duration);

        setTracks([
            ...tracks,
            {
                id: Date.now().toString(),
                title: currentTrack.title.trim(),
                duration: durationInSeconds,
                track_number: tracks.length + 1
            }
        ]);

        setCurrentTrack({ title: '', duration: '' });
    };

    const removeTrack = (trackId) => {
        setTracks(tracks.filter(t => t.id !== trackId));
    };

    const saveArtistToDB = async (artistData) => {
        try {
            const db = await getDB();
            const existing = await db.getAllAsync(
                'SELECT id FROM artists WHERE deezer_id = ?',
                [artistData.deezer_id]
            );

            if (existing.length > 0) {
                await db.runAsync(
                    `UPDATE artists 
                     SET name = ?, picture = ?, last_updated = ? 
                     WHERE deezer_id = ?`,
                    [
                        artistData.name,
                        artistData.picture,
                        new Date().toISOString(),
                        artistData.deezer_id
                    ]
                );
                return existing[0].id;
            } else {
                const result = await db.runAsync(
                    `INSERT INTO artists (deezer_id, name, picture, downloaded_at, last_updated) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        artistData.deezer_id,
                        artistData.name,
                        artistData.picture,
                        new Date().toISOString(),
                        new Date().toISOString()
                    ]
                );
                return result.lastInsertRowId;
            }
        } catch (error) {
            console.error('Error en saveArtistToDB:', error);
            throw error;
        }
    };

    const saveAlbum = async () => {
        if (!selectedArtist) {
            Alert.alert('Error', 'Debes seleccionar un artista');
            return;
        }
        if (!albumTitle.trim()) {
            Alert.alert('Error', 'El título del álbum es obligatorio');
            return;
        }
        if (!coverUrl.trim()) {
            Alert.alert('Error', 'Debes agregar una URL de portada');
            return;
        }

        setLoading(true);

        try {
            const db = await getDB();
            let artistId;
            let now = new Date().toISOString();

            console.log('Selected artist:', selectedArtist);

            if (selectedArtist.fromDeezer && !selectedArtist.fromLocal) {
                console.log('Guardando artista de Deezer con ID:', selectedArtist.deezer_id);
                const artistDetails = await deezerApi.getArtistById(selectedArtist.deezer_id);
                console.log('Artist details:', artistDetails);

                const artistData = {
                    deezer_id: artistDetails.id,
                    name: artistDetails.name,
                    picture: artistDetails.picture_medium || artistDetails.picture || null
                };

                artistId = await saveArtistToDB(artistData);
                console.log('Artista guardado con ID:', artistId);
            }
            else if (selectedArtist.fromLocal) {
                artistId = parseInt(selectedArtist.id.replace('local_', ''));
                console.log('Usando artista local con ID:', artistId);
            }
            else if (selectedArtist.id && !isNaN(parseInt(selectedArtist.id))) {
                artistId = parseInt(selectedArtist.id);
                console.log('Usando artista con ID directo:', artistId);
            }

            if (!artistId) {
                throw new Error('No se pudo determinar el ID del artista');
            }

            artistId = Number(artistId);
            console.log('artistId como número:', artistId, 'tipo:', typeof artistId);

            // Procesar géneros en formato JSON
            let genresData = null;
            if (selectedGenres.length > 0) {
                // Usar el formato que espera AlbumScreen (array de strings)
                genresData = JSON.stringify(selectedGenres);
                console.log('Géneros seleccionados:', selectedGenres);
                console.log('JSON string:', genresData);
            }

            console.log('Guardando álbum con artistId:', artistId);

            const fixedTitle = albumTitle.trim();
            const fixedCover = coverUrl.trim();
            const fixedReleaseDate = albumYear ? `${albumYear}-01-01` : '';
            const fixedRecordType = albumType;

            // Preparar datos para el helper
            const albumData = {
                artist_id: artistId,
                title: fixedTitle,
                cover: fixedCover,
                release_date: fixedReleaseDate,
                record_type: fixedRecordType,
                genres: genresData,
                state: 'to_listen'
            };

            console.log('📝 Enviando a saveManualAlbum:', albumData);

            // Usar el helper que ahora funciona correctamente
            const albumId = await dbHelpers.saveManualAlbum(albumData);

            console.log('✅ Álbum guardado con ID:', albumId);

            // Guardar las canciones
            if (tracks.length > 0) {
                console.log('Guardando', tracks.length, 'canciones');

                for (const track of tracks) {
                    const trackData = {
                        album_id: albumId,
                        title: track.title,
                        track_number: track.track_number,
                        duration: track.duration
                    };
                    await dbHelpers.saveManualTrack(trackData);
                    console.log('✅ Canción guardada:', track.title);
                }
            }

            Alert.alert(
                '✅ Éxito',
                'Álbum guardado correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );

        } catch (error) {
            console.error('❌ Error guardando álbum:', error);
            Alert.alert('❌ Error', 'No se pudo guardar el álbum: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'transparent']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agregar álbum manual</Text>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Artista */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Artista <Text style={styles.required}>*</Text></Text>

                    <TextInput
                        ref={artistInputRef}
                        style={styles.input}
                        placeholder="Buscar artista..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={artistSearch}
                        onChangeText={setArtistSearch}
                        onFocus={() => setShowArtistResults(true)}
                    />

                    {showArtistResults && artistResults.length > 0 && (
                        <View style={styles.resultsContainer}>
                            {artistResults.map(artist => (
                                <TouchableOpacity
                                    key={artist.id}
                                    style={styles.resultItem}
                                    onPress={() => selectArtist(artist)}
                                >
                                    <View style={styles.resultLeft}>
                                        {artist.picture ? (
                                            <Image source={{ uri: artist.picture }} style={styles.resultImage} />
                                        ) : (
                                            <View style={styles.resultImagePlaceholder}>
                                                <Ionicons name="person" size={20} color="#666" />
                                            </View>
                                        )}
                                        <Text style={styles.resultText}>{artist.name}</Text>
                                    </View>
                                    {artist.fromLocal && (
                                        <View style={styles.localBadge}>
                                            <Text style={styles.localBadgeText}>En tu biblioteca</Text>
                                        </View>
                                    )}
                                    {artist.fromDeezer && !artist.fromLocal && (
                                        <View style={styles.deezerBadge}>
                                            <Text style={styles.deezerBadgeText}>Deezer</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Álbum */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Álbum <Text style={styles.required}>*</Text></Text>

                    <TextInput
                        ref={albumTitleInputRef}
                        style={styles.input}
                        placeholder="Título del álbum"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={albumTitle}
                        onChangeText={setAlbumTitle}
                    />

                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="Año"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={albumYear}
                            onChangeText={setAlbumYear}
                            keyboardType="numeric"
                            maxLength={4}
                        />

                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Tipo:</Text>
                            <TouchableOpacity
                                style={[styles.typeButton, albumType === 'album' && styles.typeButtonActive]}
                                onPress={() => setAlbumType('album')}
                            >
                                <Text style={[styles.typeButtonText, albumType === 'album' && styles.typeButtonTextActive]}>
                                    Álbum
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, albumType === 'ep' && styles.typeButtonActive]}
                                onPress={() => setAlbumType('ep')}
                            >
                                <Text style={[styles.typeButtonText, albumType === 'ep' && styles.typeButtonTextActive]}>
                                    EP
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, albumType === 'single' && styles.typeButtonActive]}
                                onPress={() => setAlbumType('single')}
                            >
                                <Text style={[styles.typeButtonText, albumType === 'single' && styles.typeButtonTextActive]}>
                                    Single
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Géneros */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Géneros</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Buscar género..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={genreSearch}
                        onChangeText={setGenreSearch}
                        onFocus={() => setShowGenreResults(true)}
                    />

                    {showGenreResults && genreResults.length > 0 && (
                        <View style={styles.resultsContainer}>
                            {genreResults.map(genre => (
                                <TouchableOpacity
                                    key={genre}
                                    style={styles.resultItem}
                                    onPress={() => addGenre(genre)}
                                >
                                    <Text style={styles.resultText}>{genre}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {selectedGenres.length > 0 && (
                        <View style={styles.genresContainer}>
                            {selectedGenres.map(genre => (
                                <View key={genre} style={styles.genreChip}>
                                    <Text style={styles.genreChipText}>{genre}</Text>
                                    <TouchableOpacity onPress={() => removeGenre(genre)}>
                                        <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Portada */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Portada <Text style={styles.required}>*</Text></Text>

                    <TextInput
                        style={styles.input}
                        placeholder="URL de la imagen"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={coverUrl}
                        onChangeText={setCoverUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                    />

                    {coverUrl ? (
                        <View style={styles.coverPreview}>
                            <Image
                                source={{ uri: coverUrl }}
                                style={styles.previewImage}
                                onError={() => Alert.alert('Error', 'No se pudo cargar la imagen. Verifica la URL.')}
                            />
                        </View>
                    ) : null}
                </View>

                {/* Canciones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Canciones</Text>

                    <View style={styles.trackInput}>
                        <TextInput
                            style={[styles.input, { flex: 2, marginRight: 8 }]}
                            placeholder="Título"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={currentTrack.title}
                            onChangeText={(text) => setCurrentTrack({ ...currentTrack, title: text })}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Duración (mm:ss o seg)"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={currentTrack.duration}
                            onChangeText={(text) => setCurrentTrack({ ...currentTrack, duration: text })}
                            keyboardType="default"
                        />
                        <TouchableOpacity style={styles.addTrackButton} onPress={addTrack}>
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {tracks.length > 0 && (
                        <View style={styles.tracksList}>
                            {tracks.map((track, index) => (
                                <View key={track.id} style={styles.trackItem}>
                                    <Text style={styles.trackNumber}>{index + 1}</Text>
                                    <View style={styles.trackInfo}>
                                        <Text style={styles.trackTitle}>{track.title}</Text>
                                        {track.duration > 0 && (
                                            <Text style={styles.trackDuration}>
                                                {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                                            </Text>
                                        )}
                                    </View>
                                    <TouchableOpacity onPress={() => removeTrack(track.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Botón guardar */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={saveAlbum}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="white" />
                            <Text style={styles.saveButtonText}>Guardar álbum</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    halfInput: {
        flex: 1,
        marginRight: 8,
    },
    pickerContainer: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginRight: 8,
    },
    typeButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: 'rgba(255,255,255,0.5)',
    },
    typeButtonText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    typeButtonTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    resultsContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxHeight: 200,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    resultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    resultImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 12,
    },
    resultImagePlaceholder: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultText: {
        color: 'white',
        fontSize: 14,
    },
    localBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    localBadgeText: {
        color: '#4ADE80',
        fontSize: 10,
    },
    deezerBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    deezerBadgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
    },
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    genreChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    genreChipText: {
        color: 'white',
        fontSize: 12,
        marginRight: 4,
    },
    coverPreview: {
        alignItems: 'center',
        marginTop: 12,
    },
    previewImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    trackInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addTrackButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tracksList: {
        marginTop: 16,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    trackNumber: {
        color: 'rgba(255,255,255,0.4)',
        width: 30,
        fontSize: 14,
    },
    trackInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginRight: 8,
    },
    trackTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    trackDuration: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    saveButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});