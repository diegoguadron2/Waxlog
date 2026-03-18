import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RatingSummary from './RatingSummary';
import { getRatingColor, formatRating } from '../../shared/RatingBadge';

const formatAlbumType = (type) => {
    if (!type) return 'Álbum';
    const types = {
        'ep': 'EP', 'single': 'Single', 'album': 'Álbum',
        'live': 'En Vivo', 'compilation': 'Compilación',
        'remix': 'Remix', 'soundtrack': 'Banda Sonora', 'audiobook': 'Audiolibro',
    };
    return types[type.toLowerCase()] || type;
};

const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
};

const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, (month || 1) - 1, day || 1);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return dateString; }
};

// Fila de detalle con ícono
const DetailRow = ({ icon, label, value, valueColor, last = false }) => (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
        <View style={styles.detailLeft}>
            <Ionicons name={icon} size={15} color="rgba(255,255,255,0.45)" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, valueColor && { color: valueColor }]} numberOfLines={1}>
            {value}
        </Text>
    </View>
);

// Card de estadística individual
const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const COMMON_GENRES = [
    'Rock', 'Pop', 'Hip Hop', 'Rap', 'Electrónica', 'House', 'Techno',
    'Jazz', 'Blues', 'Clásica', 'Reggae', 'Funk', 'Soul', 'R&B',
    'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternativo',
    'Latina', 'Salsa', 'Bachata', 'Reggaetón', 'K-Pop', 'J-Pop',
    'Animé', 'Soundtrack', 'Bandas Sonoras', 'Música Asiática',
];

const AlbumInfo = ({ albumDetails, tracks, albumRating, dominantColor, onSaveGenres }) => {
    const [editingGenres, setEditingGenres] = useState(false);
    const [genreQuery, setGenreQuery] = useState('');
    const [localGenres, setLocalGenres] = useState(null); // null = usar los del albumDetails
    if (!albumDetails) return null;

    let genresList = localGenres !== null ? localGenres : [];
    if (localGenres === null && albumDetails.genres) {
        try {
            const parsed = JSON.parse(albumDetails.genres);
            if (Array.isArray(parsed)) {
                genresList = parsed.map(g => typeof g === 'object' ? (g.name || g) : g);
            }
        } catch (e) {}
    }

    const filteredSuggestions = genreQuery.trim().length > 0
        ? COMMON_GENRES.filter(g =>
            g.toLowerCase().includes(genreQuery.toLowerCase()) &&
            !genresList.includes(g)
          ).slice(0, 6)
        : COMMON_GENRES.filter(g => !genresList.includes(g)).slice(0, 6);

    const handleAddGenre = async (genre) => {
        const newList = [...genresList, genre];
        setLocalGenres(newList);
        setGenreQuery('');
        if (onSaveGenres) await onSaveGenres(newList);
    };

    const handleRemoveGenre = async (genre) => {
        const newList = genresList.filter(g => g !== genre);
        setLocalGenres(newList);
        if (onSaveGenres) await onSaveGenres(newList);
    };

    const ratedTracks = tracks.filter(t => t.rating && t.rating > 0);
    const ratedCount = ratedTracks.length;
    const completionPct = tracks.length > 0 ? Math.round((ratedCount / tracks.length) * 100) : 0;
    const accentColor = dominantColor || '#6366f1';

    return (
        <View style={styles.container}>

            {/* ESTADÍSTICAS en grid 3 columnas */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="stats-chart" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                </View>
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="musical-notes"
                        value={tracks.length}
                        label="Canciones"
                        color="#60A5FA"
                    />
                    <StatCard
                        icon="checkmark-circle"
                        value={`${completionPct}%`}
                        label="Calificadas"
                        color="#4ADE80"
                    />
                    {albumRating > 0 && (
                        <StatCard
                            icon="star"
                            value={formatRating(albumRating)}
                            label="Promedio"
                            color={getRatingColor(albumRating)}
                        />
                    )}
                </View>
            </View>

            {/* DISTRIBUCIÓN */}
            {ratedCount > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bar-chart" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.sectionTitle}>Distribución</Text>
                    </View>
                    <RatingSummary tracks={tracks} dominantColor={accentColor} />
                </View>
            )}

            {/* GÉNEROS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pricetag" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.sectionTitle}>Géneros</Text>
                    {onSaveGenres && (
                        <TouchableOpacity
                            style={styles.editGenresBtn}
                            onPress={() => { setEditingGenres(!editingGenres); setGenreQuery(''); }}
                        >
                            <Ionicons
                                name={editingGenres ? 'checkmark' : 'add'}
                                size={16}
                                color={accentColor}
                            />
                            <Text style={[styles.editGenresBtnText, { color: accentColor }]}>
                                {editingGenres ? 'Listo' : 'Agregar'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Chips de géneros actuales */}
                <View style={styles.genresContainer}>
                    {genresList.map((genre, i) => (
                        <View key={`${genre}-${i}`} style={[styles.genreChip, { borderColor: accentColor + '50', backgroundColor: accentColor + '18' }]}>
                            <Text style={[styles.genreChipText, { color: 'white' }]}>{genre}</Text>
                            {editingGenres && (
                                <TouchableOpacity onPress={() => handleRemoveGenre(genre)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                    <Ionicons name="close" size={12} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    {genresList.length === 0 && !editingGenres && (
                        <Text style={styles.noGenresText}>Sin géneros</Text>
                    )}
                </View>

                {/* Editor de géneros */}
                {editingGenres && (
                    <View style={styles.genreEditor}>
                        <View style={styles.genreInputRow}>
                            <Ionicons name="search" size={14} color="rgba(255,255,255,0.3)" />
                            <TextInput
                                style={styles.genreInput}
                                placeholder="Buscar o escribir género..."
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={genreQuery}
                                onChangeText={setGenreQuery}
                                autoFocus
                            />
                            {genreQuery.trim().length > 0 && !COMMON_GENRES.map(g => g.toLowerCase()).includes(genreQuery.toLowerCase().trim()) && (
                                <TouchableOpacity
                                    style={[styles.addCustomBtn, { backgroundColor: accentColor }]}
                                    onPress={() => handleAddGenre(genreQuery.trim())}
                                >
                                    <Text style={styles.addCustomBtnText}>Agregar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Sugerencias */}
                        <View style={styles.suggestions}>
                            {filteredSuggestions.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={styles.suggestionChip}
                                    onPress={() => handleAddGenre(g)}
                                >
                                    <Ionicons name="add" size={12} color="rgba(255,255,255,0.5)" />
                                    <Text style={styles.suggestionText}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* DETALLES */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.sectionTitle}>Detalles</Text>
                </View>
                {albumDetails.record_type && (
                    <DetailRow icon="disc" label="Tipo" value={formatAlbumType(albumDetails.record_type)} />
                )}
                {albumDetails.duration > 0 && (
                    <DetailRow icon="time" label="Duración" value={formatDuration(albumDetails.duration)} />
                )}
                {albumDetails.record_label && (
                    <DetailRow icon="business" label="Sello" value={albumDetails.record_label} />
                )}
                {albumDetails.release_date && (
                    <DetailRow
                        icon="calendar"
                        label="Lanzamiento"
                        value={formatDate(albumDetails.release_date)}
                        last
                    />
                )}
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },

    // Sección
    section: {
        marginBottom: 14,
        backgroundColor: 'rgba(0,0,0,0.22)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
        flex: undefined,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },

    // Stats grid
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
    },

    // Géneros
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    genreChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    genreChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noGenresText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
    },
    editGenresBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 'auto',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    editGenresBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Editor
    genreEditor: {
        marginTop: 12,
        gap: 10,
    },
    genreInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    genreInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        padding: 0,
    },
    addCustomBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    addCustomBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    suggestionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },

    // Detalles
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    detailRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailIcon: {
        marginRight: 8,
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
    },
    detailValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'right',
        maxWidth: '55%',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
    },
});

export default AlbumInfo;