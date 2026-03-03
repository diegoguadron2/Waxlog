// components/album/TracksList/index.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TrackItem from './TrackItem';

/**
 * Componente TracksList
 * Lista completa de canciones del álbum
 * 
 * @param {Object} props
 * @param {Array} props.tracks - Lista de canciones
 * @param {boolean} props.isSaved - Si el álbum está guardado
 * @param {Function} props.onTrackPress - Función al presionar una canción
 * @param {Object} props.expandedComments - Objeto con IDs de comentarios expandidos
 * @param {Function} props.onToggleComment - Función para expandir/colapsar comentario
 */
const TracksList = ({
    tracks,
    isSaved,
    onTrackPress,
    expandedComments = {},
    onToggleComment
}) => {
    return (
        <View>
            <Text style={styles.title}>Canciones</Text>

            {tracks.map((track, index) => (
                <TrackItem
                    key={track.id || index}
                    track={track}
                    index={index}
                    isSaved={isSaved}
                    isExpanded={expandedComments[track.id]}
                    onPress={onTrackPress}
                    onToggleComment={onToggleComment}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
});

export default TracksList;