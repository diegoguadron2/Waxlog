// components/album/AlbumHeader/index.js
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated, // 👈 IMPORTAR Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Componentes shared
import Gradient from '../../shared/Gradient';
import PressAnimation from '../../shared/PressAnimation';
import RatingBadge, { getRatingColor, formatRating } from '../../shared/RatingBadge';
import FavoriteStar from '../../shared/FavoriteStar';
import ImageWithFallback from '../../shared/ImageWithFallback';
import SharedElement from '../../shared/SharedElement';

const { width, height } = Dimensions.get('window');

// Función auxiliar para formatear tipo de álbum
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
    // 👇 NUEVA PROP: estilos animados para la imagen (parallax)
    imageAnimatedStyle,
}) => {
    const navigation = useNavigation();

    const handleGoBack = () => {
        if (onGoBack) {
            onGoBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <>
            {/* Botón de retroceso */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* Botón de acción (descargar o menú) */}
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

            {/* Contenedor de imagen con parallax */}
            <View style={styles.imageContainer}>
                {/* 👇 APLICAR LOS ESTILOS ANIMADOS A LA IMAGEN */}
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

                {/* Gradiente (se mantiene fijo sobre la imagen) */}
                <Gradient
                    colors={['transparent', dominantColor + 'FF']}
                    style={styles.gradient}
                />
            </View>

            {/* Información del álbum (se mantiene fija) */}
            <View style={styles.infoContainer}>
                <View style={styles.titleRow}>
                    <View style={styles.titleContainer}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.title} numberOfLines={2}>
                                {album.title}
                            </Text>
                            <FavoriteStar
                                isFavorite={isFavorite}
                                onPress={onToggleFavorite}
                                size={28}
                                animated={true}
                                style={styles.favoriteStar}
                            />
                        </View>

                        <Text style={styles.artistName}>{artistName}</Text>

                        <View style={styles.metadata}>
                            <Text style={styles.trackCount}>
                                {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                            </Text>
                            {albumDetails?.record_type && (
                                <>
                                    <Text style={styles.dot}>•</Text>
                                    <Text style={styles.albumType}>
                                        {formatAlbumType(albumDetails.record_type)}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingLabel}>Nota</Text>
                        <RatingBadge
                            rating={albumRating}
                            size="large"
                            showBackground={false}
                            style={styles.ratingBadge}
                            textStyle={styles.ratingText}
                        />
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
    imageContainer: {
        width: width,
        height: height * 0.5,
        position: 'relative',
        overflow: 'hidden', // 👈 IMPORTANTE: ocultar lo que se salga
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
        zIndex: 10, // 👈 Asegurar que el gradiente esté sobre la imagen
    },
    infoContainer: {
        paddingHorizontal: 20,
        marginTop: -50,
        zIndex: 15, // 👈 Asegurar que la info esté sobre la imagen
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        flex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    favoriteStar: {
        marginLeft: 8,
    },
    artistName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    trackCount: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    dot: {
        color: 'rgba(255,255,255,0.3)',
        marginHorizontal: 6,
    },
    albumType: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    ratingContainer: {
        alignItems: 'center',
        marginLeft: 16,
    },
    ratingLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    ratingBadge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    ratingText: {
        fontSize: 28,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
});

export default AlbumHeader;