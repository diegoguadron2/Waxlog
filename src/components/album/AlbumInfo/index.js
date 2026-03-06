// components/album/AlbumInfo/index.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GenreChip from './GenreChip';
import RatingSummary from './RatingSummary'; // 👈 IMPORTAR EL NUEVO COMPONENTE
import { getRatingColor, formatRating } from '../../shared/RatingBadge';

// Funciones de utilidad (se mantienen igual)
const formatAlbumType = (type) => {
    if (!type) return 'Álbum';
    const types = {
        'ep': 'EP',
        'single': 'Single',
        'album': 'Álbum',
        'live': 'En Vivo',
        'compilation': 'Compilación',
        'remix': 'Remix',
        'soundtrack': 'Banda Sonora',
        'audiobook': 'Audiolibro'
    };
    return types[type.toLowerCase()] || type;
};

const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.getFullYear().toString();
    } catch (e) {
        return dateString;
    }
};

const AlbumInfo = ({ albumDetails, tracks, albumRating, dominantColor }) => {
    if (!albumDetails) return null;

    // Parsear géneros
    let genresList = [];
    if (albumDetails.genres) {
        try {
            const parsed = JSON.parse(albumDetails.genres);
            if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object') {
                    genresList = parsed.map(g => g.name || g);
                } else {
                    genresList = parsed;
                }
            }
        } catch (e) {
            console.log('Error parseando géneros:', e);
        }
    }

    const ratedTracksCount = tracks.filter(t => t.rating && t.rating > 0).length;

    return (
        <View style={styles.container}>
            {/* RESUMEN DE CALIFICACIONES - NUEVA SECCIÓN */}
            {ratedTracksCount > 0 && (
                <View style={styles.section}>
                    <RatingSummary tracks={tracks} />
                </View>
            )}

            {/* Géneros */}
            {genresList.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Géneros</Text>
                    <View style={styles.genresContainer}>
                        {genresList.map((genre, index) => (
                            <GenreChip
                                key={`${genre}-${index}`}
                                genre={genre}
                                backgroundColor={dominantColor + '20'}
                                borderColor={dominantColor}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Detalles */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles</Text>

                {albumDetails.record_type && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tipo:</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {formatAlbumType(albumDetails.record_type)}
                        </Text>
                    </View>
                )}

                {albumDetails.duration > 0 && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duración total:</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {formatDuration(albumDetails.duration)}
                        </Text>
                    </View>
                )}

                {albumDetails.record_label && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Sello:</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {albumDetails.record_label}
                        </Text>
                    </View>
                )}

                {albumDetails.release_date && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Lanzamiento:</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {formatDate(albumDetails.release_date)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Estadísticas */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estadísticas</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Canciones calificadas:</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                        {ratedTracksCount} / {tracks.length}
                    </Text>
                </View>

                {albumRating > 0 && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Promedio:</Text>
                        <Text style={[styles.infoValue, { color: getRatingColor(albumRating) }]} numberOfLines={1}>
                            {formatRating(albumRating)}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        flexShrink: 1,
        marginRight: 8,
    },
    infoValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        flexShrink: 1,
        textAlign: 'right',
        maxWidth: '60%',
    },
});

export default AlbumInfo;