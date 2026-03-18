// components/album/ShareCard/index.js
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_SIZE = width - 40;
const CARD_HEIGHT = CARD_SIZE * 1.25; // más alto para que quepa todo con espacio

const getRatingColor = (rating) => {
    if (!rating) return '#9CA3AF';
    const colors = [
        '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
        '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
    ];
    return colors[Math.min(9, Math.max(0, Math.floor(rating) - 1))];
};

const ShareCard = ({ album, artistName, albumRating, tracks, dominantColor }) => {
    const ratingColor = getRatingColor(albumRating);
    const accent = dominantColor || '#1a1a1a';

    // Top 3 canciones con mayor nota
    const topTracks = [...tracks]
        .filter(t => t.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

    const ratingDisplay = albumRating
        ? (albumRating === 10 ? '10' : albumRating.toFixed(1))
        : '–';

    return (
        <View style={[styles.card, { width: CARD_SIZE }]}>
            {/* Fondo con portada borrosa */}
            <Image
                source={{ uri: album.cover }}
                style={styles.bgImage}
                blurRadius={25}
            />

            {/* Overlay oscuro */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.95)']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Contenido */}
            <View style={styles.content}>
                {/* Portada + info */}
                <View style={styles.topRow}>
                    <Image source={{ uri: album.cover }} style={styles.cover} />
                    <View style={styles.albumInfo}>
                        <Text style={styles.albumTitle} numberOfLines={2}>{album.title}</Text>
                        <Text style={styles.artistName} numberOfLines={1}>{artistName}</Text>

                        {/* Nota grande */}
                        <View style={styles.ratingRow}>
                            <Text style={[styles.ratingNum, { color: ratingColor }]}>
                                {ratingDisplay}
                            </Text>
                            <Text style={styles.ratingSlash}>/10</Text>
                        </View>
                    </View>
                </View>

                {/* Barra de color debajo */}
                <View style={[styles.colorBar, { backgroundColor: ratingColor }]} />

                {/* Top canciones */}
                {topTracks.length > 0 && (
                    <View style={styles.tracksSection}>
                        <Text style={styles.tracksTitle}>
                            <Ionicons name="star" size={11} color={ratingColor} /> Top canciones
                        </Text>
                        {topTracks.map((t, i) => (
                            <View key={t.id} style={styles.trackRow}>
                                <Text style={[styles.trackPos, { color: ratingColor }]}>{i + 1}</Text>
                                <Text style={styles.trackName} numberOfLines={1}>{t.title}</Text>
                                <Text style={[styles.trackRating, { color: getRatingColor(t.rating) }]}>
                                    {t.rating.toFixed(1)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>WaxLog</Text>
                    <Ionicons name="musical-notes" size={12} color="rgba(255,255,255,0.3)" />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_SIZE,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 20,
    },

    // Top row
    topRow: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    cover: {
        width: 110,
        height: 110,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    albumInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 4,
    },
    albumTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 22,
        marginBottom: 4,
    },
    artistName: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        marginBottom: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    ratingNum: {
        fontSize: 44,
        fontWeight: '900',
        lineHeight: 48,
    },
    ratingSlash: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 16,
        fontWeight: '500',
    },

    // Barra
    colorBar: {
        height: 3,
        borderRadius: 2,
        marginVertical: 16,
        opacity: 0.8,
    },

    // Tracks
    tracksSection: {
        gap: 10,
        marginBottom: 16,
    },
    tracksTitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    trackPos: {
        fontSize: 13,
        fontWeight: '800',
        width: 16,
    },
    trackName: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    trackRating: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    footerText: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
});

export default ShareCard;