import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Linking,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Gradient from '../../shared/Gradient';
import PressAnimation from '../../shared/PressAnimation';
import RatingBadge, { getRatingColor } from '../../shared/RatingBadge';
import FavoriteStar from '../../shared/FavoriteStar';
import ImageWithFallback from '../../shared/ImageWithFallback';
import SharedElement from '../../shared/SharedElement';

const { width, height } = Dimensions.get('window');

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
        'audiobook': 'Audiolibro',
    };
    return types[type.toLowerCase()] || type;
};

const openStreaming = (platform, title, artist) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    const urls = {
        spotify: `https://open.spotify.com/search/${query}`,
        deezer:  `https://www.deezer.com/search/${query}`,
        apple:   `https://music.apple.com/search?term=${query}`,
    };
    Linking.openURL(urls[platform]).catch(() => {});
};

const StreamingButton = ({ platform, title, artist }) => {
    const config = {
        spotify: { color: '#1DB954' },
        deezer:  { color: '#A238FF' },
        apple:   { color: '#FC3C44' },
    }[platform];

    const renderLogo = () => {
        if (platform === 'spotify') {
            return <FontAwesome5 name="spotify" size={26} color={config.color} brand />;
        }
        if (platform === 'apple') {
            return <FontAwesome5 name="apple" size={26} color={config.color} brand />;
        }
        // Deezer — logo estilizado con texto bold
        return (
            <Text style={[styles.deezerLogo, { color: config.color }]}>dz</Text>
        );
    };

    return (
        <TouchableOpacity
            style={styles.streamingBtn}
            onPress={() => openStreaming(platform, title, artist)}
            activeOpacity={0.65}
        >
            {renderLogo()}
        </TouchableOpacity>
    );
};

const AlbumHeader = ({
    album,
    albumDetails,
    tracks,
    albumRating,
    isFavorite,
    isSaved,
    artistName,
    dominantColor,
    imageUrl,
    onToggleFavorite,
    onSaveAlbum,
    onShowStateModal,
    onGoBack,
    onArtistPress,
    imageAnimatedStyle,
}) => {
    const navigation = useNavigation();

    const handleGoBack = () => {
        if (onGoBack) onGoBack();
        else navigation.goBack();
    };

    return (
        <>
            {/* Botón volver */}
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* Botón acción */}
            <View style={styles.actionButton}>
                {isSaved ? (
                    <PressAnimation onPress={onShowStateModal}>
                        <View style={styles.iconButton}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                        </View>
                    </PressAnimation>
                ) : (
                    <PressAnimation onPress={onSaveAlbum}>
                        <View style={[styles.iconButton, styles.transparentButton]}>
                            <Ionicons name="download-outline" size={24} color="white" />
                        </View>
                    </PressAnimation>
                )}
            </View>

            {/* Portada */}
            <View style={styles.imageContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, imageAnimatedStyle]}>
                    <SharedElement id={`album-${album.id}`}>
                        <ImageWithFallback
                            source={imageUrl}
                            style={styles.image}
                            contentFit="cover"
                            showLoading={false}
                            transition={0}
                        />
                    </SharedElement>
                </Animated.View>
                <Gradient
                    colors={['transparent', dominantColor + 'FF']}
                    style={styles.gradient}
                />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>

                {/* Título completo — sin numberOfLines */}
                <Text style={styles.title}>{album.title}</Text>

                {/* Artista */}
                {onArtistPress ? (
                    <TouchableOpacity
                        onPress={onArtistPress}
                        style={styles.artistRow}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.artistName}>{artistName}</Text>
                        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.artistName}>{artistName}</Text>
                )}

                {/* Metadata */}
                <View style={styles.metadata}>
                    <Text style={styles.metaText}>
                        {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                    </Text>
                    {albumDetails?.record_type && (
                        <>
                            <Text style={styles.dot}>·</Text>
                            <Text style={styles.metaText}>
                                {formatAlbumType(albumDetails.record_type)}
                            </Text>
                        </>
                    )}
                </View>

                {/* Barra de acciones: rating | favorito | streaming */}
                <View style={styles.actionsRow}>

                    <Text style={[styles.ratingNumber, { color: getRatingColor(albumRating) }]}>
                        {albumRating ? (albumRating === 10 ? '10' : albumRating.toFixed(1)) : '–'}
                    </Text>

                    <View style={styles.divider} />

                    <FavoriteStar
                        isFavorite={isFavorite}
                        onPress={onToggleFavorite}
                        size={28}
                        animated={true}
                    />

                    <View style={styles.divider} />

                    <View style={styles.streamingRow}>
                        <StreamingButton platform="spotify" title={album.title} artist={artistName} />
                        <StreamingButton platform="deezer"  title={album.title} artist={artistName} />
                        <StreamingButton platform="apple"   title={album.title} artist={artistName} />
                    </View>

                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 20,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    transparentButton: {
        backgroundColor: 'transparent',
    },

    // Portada
    imageContainer: {
        width: width,
        height: height * 0.46,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.2,
        zIndex: 10,
    },

    // Info
    infoContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        zIndex: 15,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 34,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
        marginBottom: 6,
    },
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    artistName: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 17,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    metaText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
    },
    dot: {
        color: 'rgba(255,255,255,0.3)',
        marginHorizontal: 6,
    },

    // Acciones
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    ratingNumber: {
        fontSize: 38,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },

    // Streaming
    streamingRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    streamingBtn: {
        padding: 6,
    },
    deezerLogo: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
        fontStyle: 'italic',
    },
});

export default AlbumHeader;