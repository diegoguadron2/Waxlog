// screens/SaveAlbumScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, StyleSheet,
    Dimensions, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { executeDBOperation } from '../database/Index';
import { dbHelpers } from '../database/Index';
import deezerApi from '../services/deezerApi';

const { width } = Dimensions.get('window');

const STEPS = ['Artista', 'Álbum', 'Canciones'];

const ALBUM_TYPES = [
    { key: 'album',  label: 'Álbum',  icon: 'albums' },
    { key: 'ep',     label: 'EP',     icon: 'disc' },
    { key: 'single', label: 'Single', icon: 'musical-note' },
    { key: 'live',   label: 'Live',   icon: 'mic' },
];

const COMMON_GENRES = [
    'Rock', 'Pop', 'Hip Hop', 'Rap', 'Electrónica', 'House', 'Techno',
    'Jazz', 'Blues', 'Clásica', 'Reggae', 'Funk', 'Soul', 'R&B',
    'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternativo',
    'Latina', 'Salsa', 'Bachata', 'Reggaetón', 'Cumbia', 'Tango',
    'K-Pop', 'J-Pop', 'Animé', 'Soundtrack', 'Bandas Sonoras',
];

// ─── Indicador de pasos ───────────────────────────────────────────────────────
const StepIndicator = ({ current }) => (
    <View style={si.row}>
        {STEPS.map((label, i) => {
            const done    = i < current;
            const active  = i === current;
            return (
                <React.Fragment key={label}>
                    <View style={si.step}>
                        <View style={[si.circle, done && si.done, active && si.active]}>
                            {done
                                ? <Ionicons name="checkmark" size={13} color="#000" />
                                : <Text style={[si.num, active && si.numActive]}>{i + 1}</Text>
                            }
                        </View>
                        <Text style={[si.label, active && si.labelActive]}>{label}</Text>
                    </View>
                    {i < STEPS.length - 1 && (
                        <View style={[si.line, done && si.lineDone]} />
                    )}
                </React.Fragment>
            );
        })}
    </View>
);

const si = StyleSheet.create({
    row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 28 },
    step:       { alignItems: 'center', gap: 6 },
    circle:     { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    active:     { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.15)' },
    done:       { backgroundColor: 'white', borderColor: 'white' },
    num:        { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
    numActive:  { color: 'white' },
    label:      { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
    labelActive:{ color: 'white', fontWeight: '600' },
    line:       { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 18, marginHorizontal: 6 },
    lineDone:   { backgroundColor: 'white' },
});

// ─── Campo de entrada ─────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <View style={f.container}>
        <Text style={f.label}>
            {label}{required && <Text style={f.req}> *</Text>}
        </Text>
        {children}
    </View>
);

const f = StyleSheet.create({
    container: { marginBottom: 18 },
    label:     { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
    req:       { color: '#f87171' },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SaveAlbumScreen({ navigation }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Paso 1 — Artista
    const [artistQuery, setArtistQuery]       = useState('');
    const [artistResults, setArtistResults]   = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);

    // Paso 2 — Álbum
    const [albumTitle, setAlbumTitle]       = useState('');
    const [albumDate, setAlbumDate]         = useState('');
    const [albumType, setAlbumType]         = useState('album');
    const [coverUrl, setCoverUrl]           = useState('');
    const [genreQuery, setGenreQuery]       = useState('');
    const [genreResults, setGenreResults]   = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Paso 3 — Canciones
    const [tracks, setTracks]                   = useState([]);
    const [trackTitle, setTrackTitle]           = useState('');
    const [trackDuration, setTrackDuration]     = useState('');
    const trackTitleRef = useRef(null);

    // Ocultar tab bar
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
        return () => navigation.getParent()?.setOptions({
            tabBarStyle: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', borderTopWidth: 0, elevation: 0, height: 70, paddingBottom: 10, paddingTop: 10 }
        });
    }, [navigation]);

    // Buscar artistas
    useEffect(() => {
        if (artistQuery.length < 2) { setArtistResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const local = await executeDBOperation(db =>
                    db.getAllAsync(
                        'SELECT id, deezer_id, name, picture FROM artists WHERE name LIKE ? LIMIT 5',
                        [`%${artistQuery}%`]
                    )
                );
                let deezer = [];
                try {
                    const res = await deezerApi.searchArtists(artistQuery);
                    const data = Array.isArray(res) ? res : (res?.data || []);
                    deezer = data.slice(0, 5).map(a => ({
                        id: `deezer_${a.id}`, deezer_id: a.id,
                        name: a.name, picture: a.picture_medium || a.picture,
                        fromDeezer: true,
                    }));
                } catch (_) {}

                const localMarked = (local || []).map(a => ({ ...a, id: `local_${a.id}`, fromLocal: true }));
                const combined = [...localMarked, ...deezer.filter(d => !localMarked.some(l => l.deezer_id == d.deezer_id))];
                setArtistResults(combined);
            } catch (_) {}
        }, 400);
        return () => clearTimeout(t);
    }, [artistQuery]);

    // Buscar géneros
    useEffect(() => {
        if (genreQuery.length < 1) { setGenreResults([]); return; }
        setGenreResults(
            COMMON_GENRES.filter(g => g.toLowerCase().includes(genreQuery.toLowerCase())).slice(0, 8)
        );
    }, [genreQuery]);

    const selectArtist = (a) => {
        setSelectedArtist(a);
        setArtistQuery(a.name);
        setArtistResults([]);
    };

    const addGenre = (g) => {
        if (!selectedGenres.includes(g)) setSelectedGenres(prev => [...prev, g]);
        setGenreQuery('');
        setGenreResults([]);
    };

    // Formatear input de fecha — agrega / automáticamente
    const handleDateChange = (text) => {
        // Solo dígitos
        const digits = text.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length >= 3) formatted = digits.slice(0,2) + '/' + digits.slice(2);
        if (digits.length >= 5) formatted = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4,8);
        setAlbumDate(formatted);
    };

    // Convierte dd/mm/yyyy → yyyy-mm-dd para la BD
    const parseDateForDB = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
        if (dateStr.length === 4 && !isNaN(dateStr)) return `${dateStr}-01-01`;
        return '';
    };

    const addTrack = () => {
        const parts = trackDuration.split(':');
        let secs = null;
        if (parts.length === 2) secs = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        else if (!isNaN(trackDuration) && trackDuration) secs = parseInt(trackDuration);

        setTracks(prev => [...prev, {
            id: Date.now().toString(),
            title: trackTitle.trim(),
            duration: secs,
            track_number: prev.length + 1,
        }]);
        setTrackTitle('');
        setTrackDuration('');
        trackTitleRef.current?.focus();
    };

    const canNext = () => {
        if (step === 0) return !!selectedArtist;
        if (step === 1) return albumTitle.trim().length > 0 && coverUrl.trim().length > 0;
        return true;
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let artistId;

            if (selectedArtist.fromDeezer && !selectedArtist.fromLocal) {
                const details = await deezerApi.getArtistById(selectedArtist.deezer_id);
                artistId = await executeDBOperation(async (db) => {
                    const exists = await db.getFirstAsync('SELECT id FROM artists WHERE deezer_id = ?', [details.id.toString()]);
                    if (exists) return exists.id;
                    const r = await db.runAsync(
                        'INSERT INTO artists (deezer_id, name, picture, downloaded_at, last_updated) VALUES (?,?,?,?,?)',
                        [details.id.toString(), details.name, details.picture_medium || null, new Date().toISOString(), new Date().toISOString()]
                    );
                    return r.lastInsertRowId;
                });
            } else if (selectedArtist.fromLocal) {
                artistId = parseInt(selectedArtist.id.replace('local_', ''));
            }

            if (!artistId) throw new Error('No se pudo determinar el artista');

            const albumId = await dbHelpers.saveManualAlbum({
                artist_id: Number(artistId),
                title: albumTitle.trim(),
                cover: coverUrl.trim(),
                release_date: parseDateForDB(albumDate),
                record_type: albumType,
                genres: selectedGenres.length > 0 ? JSON.stringify(selectedGenres) : null,
                state: 'to_listen',
            });

            for (const t of tracks) {
                await dbHelpers.saveManualTrack({ album_id: albumId, title: t.title, track_number: t.track_number, duration: t.duration });
            }

            Alert.alert('✅ Guardado', `"${albumTitle}" agregado a tu biblioteca`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            if (__DEV__) console.error('Error guardando álbum:', err);
            Alert.alert('Error', 'No se pudo guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Render por paso ──────────────────────────────────────────────────────

    const renderStep0 = () => (
        <View>
            <Field label="Buscar artista" required>
                <View style={styles.inputWrapper}>
                    <Ionicons name="search" size={16} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Nombre del artista..."
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={artistQuery}
                        onChangeText={t => { setArtistQuery(t); setSelectedArtist(null); }}
                        autoFocus
                    />
                    {artistQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setArtistQuery(''); setSelectedArtist(null); setArtistResults([]); }}>
                            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                    )}
                </View>
            </Field>

            {/* Artista seleccionado */}
            {selectedArtist && (
                <View style={styles.selectedCard}>
                    {selectedArtist.picture
                        ? <Image source={{ uri: selectedArtist.picture }} style={styles.selectedImg} />
                        : <View style={styles.selectedImgPlaceholder}><Ionicons name="person" size={22} color="rgba(255,255,255,0.4)" /></View>
                    }
                    <View style={{ flex: 1 }}>
                        <Text style={styles.selectedName}>{selectedArtist.name}</Text>
                        <Text style={styles.selectedSub}>
                            {selectedArtist.fromLocal ? '✓ En tu biblioteca' : 'Deezer'}
                        </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color="#4ADE80" />
                </View>
            )}

            {/* Resultados */}
            {artistResults.length > 0 && !selectedArtist && (
                <View style={styles.dropdown}>
                    {artistResults.map(a => (
                        <TouchableOpacity key={a.id} style={styles.dropdownItem} onPress={() => selectArtist(a)}>
                            {a.picture
                                ? <Image source={{ uri: a.picture }} style={styles.dropdownImg} />
                                : <View style={styles.dropdownImgPlaceholder}><Ionicons name="person" size={16} color="#666" /></View>
                            }
                            <Text style={styles.dropdownText} numberOfLines={1}>{a.name}</Text>
                            <View style={[styles.badge, a.fromLocal ? styles.badgeGreen : styles.badgeGray]}>
                                <Text style={[styles.badgeText, a.fromLocal ? { color: '#4ADE80' } : { color: 'rgba(255,255,255,0.5)' }]}>
                                    {a.fromLocal ? 'Biblioteca' : 'Deezer'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {artistQuery.length >= 2 && artistResults.length === 0 && !selectedArtist && (
                <Text style={styles.noResults}>Sin resultados — puedes continuar igualmente</Text>
            )}
        </View>
    );

    const renderStep1 = () => (
        <View>
            <Field label="Título" required>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del álbum"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={albumTitle}
                    onChangeText={setAlbumTitle}
                    autoFocus
                />
            </Field>

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Field label="Fecha de lanzamiento">
                        <TextInput
                            style={styles.input}
                            placeholder="dd/mm/yyyy"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            value={albumDate}
                            onChangeText={handleDateChange}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    </Field>
                </View>
                <View style={{ flex: 2 }}>
                    <Field label="Tipo">
                        <View style={styles.typeRow}>
                            {ALBUM_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.typeBtn, albumType === t.key && styles.typeBtnActive]}
                                    onPress={() => setAlbumType(t.key)}
                                >
                                    <Text style={[styles.typeBtnText, albumType === t.key && styles.typeBtnTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Field>
                </View>
            </View>

            <Field label="URL de portada" required>
                <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={coverUrl}
                    onChangeText={setCoverUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                />
            </Field>

            {/* Preview portada */}
            {coverUrl.trim().length > 10 && (
                <View style={styles.coverPreview}>
                    <Image
                        source={{ uri: coverUrl }}
                        style={styles.coverImg}
                        onError={() => {}}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.coverLabel} numberOfLines={1}>{albumTitle || 'Sin título'}</Text>
                </View>
            )}

            <Field label="Géneros">
                <View style={styles.inputWrapper}>
                    <Ionicons name="pricetag" size={14} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Buscar género..."
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={genreQuery}
                        onChangeText={setGenreQuery}
                    />
                </View>
                {genreResults.length > 0 && (
                    <View style={styles.dropdown}>
                        {genreResults.map(g => (
                            <TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => addGenre(g)}>
                                <Text style={styles.dropdownText}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {selectedGenres.length > 0 && (
                    <View style={styles.chips}>
                        {selectedGenres.map(g => (
                            <TouchableOpacity key={g} style={styles.chip} onPress={() => setSelectedGenres(prev => prev.filter(x => x !== g))}>
                                <Text style={styles.chipText}>{g}</Text>
                                <Ionicons name="close" size={12} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Field>
        </View>
    );

    const renderStep2 = () => (
        <View>
            {/* Input agregar canción */}
            <View style={styles.trackAddRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <TextInput
                        ref={trackTitleRef}
                        style={styles.input}
                        placeholder="Título de la canción"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={trackTitle}
                        onChangeText={setTrackTitle}
                        onSubmitEditing={addTrack}
                        returnKeyType="done"
                    />
                </View>
                <View style={{ width: 90, marginRight: 8 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="mm:ss"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={trackDuration}
                        onChangeText={setTrackDuration}
                        keyboardType="numbers-and-punctuation"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, !trackTitle.trim() && styles.addBtnDisabled]}
                    onPress={addTrack}
                    disabled={!trackTitle.trim()}
                >
                    <Ionicons name="add" size={22} color="white" />
                </TouchableOpacity>
            </View>

            <Text style={styles.trackHint}>mm:ss o segundos · opcional</Text>

            {/* Lista de canciones */}
            {tracks.length > 0 && (
                <View style={styles.trackList}>
                    {tracks.map((t, i) => (
                        <View key={t.id} style={styles.trackRow}>
                            <Text style={styles.trackNum}>{i + 1}</Text>
                            <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
                            {t.duration && (
                                <Text style={styles.trackDur}>
                                    {Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}
                                </Text>
                            )}
                            <TouchableOpacity onPress={() => setTracks(prev => prev.filter(x => x.id !== t.id))}>
                                <Ionicons name="trash-outline" size={16} color="#f87171" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {tracks.length === 0 && (
                <View style={styles.emptyTracks}>
                    <Ionicons name="musical-notes-outline" size={36} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyTracksText}>Puedes agregar canciones ahora{'\n'}o hacerlo más tarde</Text>
                </View>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#000' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Agregar álbum</Text>
                    <Text style={styles.headerSub}>Paso {step + 1} de {STEPS.length}</Text>
                </View>
            </View>

            <StepIndicator current={step} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}

                {/* Botón siguiente / guardar */}
                <View style={styles.footer}>
                    {step < STEPS.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
                            onPress={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                        >
                            <Text style={styles.nextBtnText}>Continuar</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <>
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text style={styles.saveBtnText}>Guardar álbum</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        gap: 14,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    headerSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },

    // Contenido
    content: { paddingHorizontal: 20, paddingBottom: 60 },

    // Inputs
    input: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 14,
        color: 'white', fontSize: 15,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12, paddingHorizontal: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    inputIcon:     { marginRight: 8 },
    inputWithIcon: { flex: 1, color: 'white', fontSize: 15, paddingVertical: 14 },
    row:           { flexDirection: 'row' },

    // Artista seleccionado
    selectedCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(74,222,128,0.08)',
        borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
    },
    selectedImg:            { width: 44, height: 44, borderRadius: 22 },
    selectedImgPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    selectedName:           { color: 'white', fontSize: 15, fontWeight: '600' },
    selectedSub:            { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

    // Dropdown
    dropdown: {
        backgroundColor: '#141414', borderRadius: 12, marginTop: 6,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 12, paddingHorizontal: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dropdownImg:            { width: 32, height: 32, borderRadius: 16 },
    dropdownImgPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
    dropdownText:           { flex: 1, color: 'white', fontSize: 14 },
    badge:                  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeGreen:             { backgroundColor: 'rgba(74,222,128,0.12)' },
    badgeGray:              { backgroundColor: 'rgba(255,255,255,0.07)' },
    badgeText:              { fontSize: 11, fontWeight: '600' },
    noResults:              { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', marginTop: 16 },

    // Tipo de álbum
    typeRow:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    typeBtn:          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    typeBtnActive:    { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.4)' },
    typeBtnText:      { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
    typeBtnTextActive:{ color: 'white', fontWeight: '700' },

    // Portada preview
    coverPreview: {
        height: 160, borderRadius: 16, overflow: 'hidden',
        marginBottom: 18, justifyContent: 'flex-end',
    },
    coverImg:   { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    coverLabel: { color: 'white', fontWeight: '700', fontSize: 16, padding: 14 },

    // Chips géneros
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    chipText: { color: 'white', fontSize: 13 },

    // Tracks
    trackAddRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    trackHint:   { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 18 },
    addBtn:         { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    addBtnDisabled: { opacity: 0.3 },
    trackList:   { gap: 6 },
    trackRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    trackNum:    { color: 'rgba(255,255,255,0.3)', fontSize: 13, width: 22 },
    trackTitle:  { flex: 1, color: 'white', fontSize: 14, fontWeight: '500' },
    trackDur:    { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
    emptyTracks: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyTracksText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', lineHeight: 20 },

    // Footer
    footer:  { marginTop: 32 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    nextBtnDisabled: { opacity: 0.35 },
    nextBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 16 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});