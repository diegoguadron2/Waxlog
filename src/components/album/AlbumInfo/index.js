import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GenreChip from './GenreChip';
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

const AlbumInfo = ({ albumDetails, tracks, albumRating, dominantColor }) => {
    if (!albumDetails) return null;

    let genresList = [];
    if (albumDetails.genres) {
        try {
            const parsed = JSON.parse(albumDetails.genres);
            if (Array.isArray(parsed)) {
                genresList = parsed.map(g => typeof g === 'object' ? (g.name || g) : g);
            }
        } catch (e) {}
    }

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
            {genresList.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pricetag" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.sectionTitle}>Géneros</Text>
                    </View>
                    <View style={styles.genresContainer}>
                        {genresList.map((genre, i) => (
                            <GenreChip
                                key={`${genre}-${i}`}
                                genre={genre}
                                backgroundColor={accentColor + '25'}
                                borderColor={accentColor + '80'}
                            />
                        ))}
                    </View>
                </View>
            )}

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