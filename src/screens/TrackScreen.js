import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';


const getRatingColor = (rating) => {
  if (!rating) return '#4B5563';
  const roundedRating = Math.round(rating);
  const colors = [
    '#FFB3B3', '#FFC4B3', '#FFD6B3', '#FFE8B3', '#FFF9B3',
    '#E6F0B3', '#CCE6B3', '#B3D9B3', '#B3CCB3', '#B3BFB3',
  ];
  return colors[Math.min(9, Math.max(0, roundedRating - 1))];
};

const RatingSelectorModal = ({ visible, onClose, onSelect, currentRating }) => {
  const [selectedRating, setSelectedRating] = useState(currentRating ? Math.floor(currentRating) : 5);
  const [decimal, setDecimal] = useState('0');

  useEffect(() => {
    if (currentRating) {
      const whole = Math.floor(currentRating);
      const dec = Math.round((currentRating - whole) * 10);
      setSelectedRating(whole);
      setDecimal(dec.toString());
    }
  }, [currentRating]);

  const handleSelect = () => {
    const finalRating = selectedRating + (parseInt(decimal) / 10);
    onSelect(finalRating);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={50} className="flex-1 justify-center items-center">
        <TouchableOpacity className="absolute inset-0" onPress={onClose} />
        <View className="bg-black/80 rounded-2xl p-6 w-80 border border-white/10">
          <Text className="text-white text-xl font-bold text-center mb-4">Calificar canción</Text>

          <Text className="text-white/60 text-sm text-center mb-2">Número</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  className="w-14 h-14 mx-1 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: selectedRating === num ? getRatingColor(num) : getRatingColor(num) + '30',
                    borderWidth: selectedRating === num ? 2 : 1,
                    borderColor: selectedRating === num ? 'white' : getRatingColor(num),
                  }}
                  onPress={() => setSelectedRating(num)}
                >
                  <Text className="text-lg font-bold" style={{ color: getRatingColor(num) }}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text className="text-white/60 text-sm text-center mb-2">Decimal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row px-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  className="w-14 h-14 mx-1 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: decimal === num.toString() ? getRatingColor(selectedRating) : getRatingColor(selectedRating) + '30',
                    borderWidth: decimal === num.toString() ? 2 : 1,
                    borderColor: decimal === num.toString() ? 'white' : getRatingColor(selectedRating),
                  }}
                  onPress={() => setDecimal(num.toString())}
                >
                  <Text className="text-lg font-bold" style={{ color: getRatingColor(selectedRating) }}>.{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="items-center mb-4">
            <Text className="text-white/60 text-sm mb-1">Nota seleccionada</Text>
            <Text
              className="text-4xl font-bold"
              style={{ color: getRatingColor(selectedRating + (parseInt(decimal) / 10)) }}
            >
              {(selectedRating + (parseInt(decimal) / 10)).toFixed(1)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mr-2 py-3 rounded-lg bg-white/10"
              onPress={onClose}
            >
              <Text className="text-white/60 text-center">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-2 py-3 rounded-lg bg-purple-600/80"
              onPress={handleSelect}
            >
              <Text className="text-white text-center font-semibold">Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default function TrackScreen({ route, navigation }) {
  const { trackId, trackData: initialTrackData, albumTitle, artistName, albumDeezerId, artistDeezerId } = route.params;

  const [track, setTrack] = useState(initialTrackData || null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [albumCover, setAlbumCover] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [artistInfo, setArtistInfo] = useState({
    id: null,
    name: artistName || '',
    deezerId: artistDeezerId || null
  });

  const [albumInfo, setAlbumInfo] = useState({
    deezerId: albumDeezerId || null,
    title: albumTitle || ''
  });

  useEffect(() => {
    loadTrackData();
  }, []);

  const loadTrackData = async () => {
    setLoading(true);
    try {
      if (trackId) {
        // Usar repositorio - él maneja las conexiones
        const trackData = await trackRepository.getTrackById(trackId);
        if (trackData) {
          setTrack(trackData);
          setRating(trackData.rating);
          setComment(trackData.comment || '');
          setAlbumCover(trackData.album_cover);

          if (trackData.album_id) {
            const album = await albumRepository.getAlbumById(trackData.album_id);
            if (album) {
              setAlbumInfo({
                deezerId: album.deezer_id,
                title: album.title
              });

              if (album.artist_id) {
                const artist = await artistRepository.getArtistById(album.artist_id);
                if (artist) {
                  setArtistInfo({
                    id: artist.id,
                    name: artist.name,
                    deezerId: artist.deezer_id
                  });
                }
              }
            }
          }
        }
      } else if (initialTrackData) {
        setTrack(initialTrackData);
        setRating(initialTrackData.rating);
        setComment(initialTrackData.comment || '');

        if (albumDeezerId) {
          const album = await albumRepository.getAlbumByDeezerId(albumDeezerId);
          if (album) {
            setAlbumCover(album.cover);
            setAlbumInfo({
              deezerId: album.deezer_id,
              title: album.title
            });

            if (album.artist_id) {
              const artist = await artistRepository.getArtistById(album.artist_id);
              if (artist) {
                setArtistInfo({
                  id: artist.id,
                  name: artist.name,
                  deezerId: artist.deezer_id
                });
              }
            }
          }
        } else {
          setAlbumInfo({
            deezerId: albumDeezerId,
            title: albumTitle
          });
          setArtistInfo({
            id: null,
            name: artistName,
            deezerId: artistDeezerId
          });
        }
      }
    } catch (error) {
      console.error('Error cargando track:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRating = async (newRating) => {
    if (!trackId) {
      Alert.alert('Error', 'Primero guarda el álbum en tu biblioteca');
      return;
    }

    try {
      await trackRepository.updateTrackRating(trackId, newRating, comment);
      setRating(newRating);

      navigation.navigate('Album', {
        album: { id: albumInfo.deezerId },
        artistName: artistInfo.name,
        artistId: artistInfo.deezerId,
        refresh: true
      });

      Alert.alert('Éxito', `Calificación ${newRating.toFixed(1)} guardada`);
    } catch (error) {
      console.error('Error guardando calificación:', error);
      Alert.alert('Error', 'No se pudo guardar la calificación');
    }
  };

  const saveComment = async () => {
    if (!trackId) {
      Alert.alert('Error', 'Primero guarda el álbum en tu biblioteca');
      return;
    }

    try {
      await trackRepository.updateTrackRating(trackId, rating, comment);

      navigation.navigate('Album', {
        album: { id: albumInfo.deezerId },
        artistName: artistInfo.name,
        artistId: artistInfo.deezerId,
        refresh: true
      });

      Alert.alert('Éxito', 'Comentario guardado');
    } catch (error) {
      console.error('Error guardando comentario:', error);
      Alert.alert('Error', 'No se pudo guardar el comentario');
    }
  };

  const navigateToAlbum = () => {
    if (albumInfo.deezerId) {
      navigation.navigate('Album', {
        album: {
          id: albumInfo.deezerId,
          title: albumInfo.title
        },
        artistName: artistInfo.name,
        artistId: artistInfo.deezerId,
        refresh: true
      });
    }
  };

  const navigateToArtist = () => {
    if (artistInfo.deezerId) {
      navigation.navigate('Artist', {
        artist: {
          id: artistInfo.deezerId,
          name: artistInfo.name
        }
      });
    } else {
      Alert.alert('Error', 'No se encontró información del artista');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
        <Text className="text-white/70 mt-4 text-base">Cargando canción...</Text>
      </View>
    );
  }

  const imageUrl = albumCover || track?.album_cover;

  return (
    <View className="flex-1 bg-black">
      <RatingSelectorModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSelect={saveRating}
        currentRating={rating}
      />

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          blurRadius={70}
        />
      ) : (
        <View className="absolute w-full h-full bg-black" />
      )}

      <View className="absolute w-full h-full bg-black/30" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <TouchableOpacity
          className="absolute top-14 left-4 z-20 w-10 h-10 rounded-full bg-black/30 justify-center items-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="px-5 pt-32">
          <Text className="text-white text-3xl font-bold text-center mb-2">
            {track?.title || 'Canción sin título'}
          </Text>

          <View className="flex-row justify-center space-x-4 mb-8">
            <TouchableOpacity onPress={navigateToAlbum} className="px-4 py-2 bg-white/10 rounded-full">
              <Text className="text-white/80 text-base">{albumInfo.title || 'Álbum'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={navigateToArtist} className="px-4 py-2 bg-white/10 rounded-full">
              <Text className="text-white/80 text-base">{artistInfo.name || 'Artista'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-start mb-8">
            <TouchableOpacity
              className="w-24 h-24 rounded-full items-center justify-center mr-4"
              style={{
                backgroundColor: 'transparent',
                borderWidth: 3,
                borderColor: rating ? getRatingColor(rating) : '#666666',
              }}
              onPress={() => setShowRatingModal(true)}
            >
              <Text
                className="text-4xl font-bold"
                style={{ color: rating ? getRatingColor(rating) : '#666666' }}
              >
                {rating ? rating.toFixed(1) : '-'}
              </Text>
            </TouchableOpacity>

            <View className="flex-1">
              <TextInput
                className="text-white border-2 border-white/20 rounded-xl p-4 min-h-[100px] text-base"
                placeholder="Escribe tu opinión sobre la canción..."
                placeholderTextColor="#666666"
                value={comment}
                onChangeText={setComment}
                onBlur={saveComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}