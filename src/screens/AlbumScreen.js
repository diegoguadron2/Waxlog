// screens/AlbumScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { useAlbumData } from '../hooks/useAlbumData';

const { width, height } = Dimensions.get('window');

// Colores pastel del 1 al 10
const getRatingColor = (rating) => {
  if (!rating) return '#9CA3AF';
  const colors = [
    '#fc3a3a', '#f56c45', '#ffa457', '#ffcb52', '#faed52',
    '#e1ff47', '#b1fa6b', '#6ad46a', '#3ecf3e', '#28bf28',
  ];
  const index = Math.min(9, Math.max(0, Math.floor(rating) - 1));
  return colors[index];
};

const getDecimalColor = (rating) => {
  if (!rating) return '#9CA3AF';
  return getRatingColor(Math.floor(rating));
};

const RatingModal = ({ visible, onClose, onSave, currentRating, trackTitle }) => {
  const [selectedRating, setSelectedRating] = useState(5);
  const [decimal, setDecimal] = useState('0');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      if (currentRating) {
        setSelectedRating(Math.floor(currentRating));
        setDecimal(Math.round((currentRating - Math.floor(currentRating)) * 10).toString());
      } else {
        setSelectedRating(5);
        setDecimal('0');
      }
      setComment('');
    }
  }, [visible, currentRating]);

  const finalRating = selectedRating + (parseInt(decimal) / 10);
  const ratingColor = getDecimalColor(finalRating);

  const handleSave = () => {
    onSave(finalRating, comment);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={30} style={styles.modalContainer}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {trackTitle}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Calificar canción
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Número</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ratingScroll}
              contentContainerStyle={styles.ratingContentContainer}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setSelectedRating(num)}
                  style={[
                    styles.ratingNumberButton,
                    { backgroundColor: getRatingColor(num) + '20' },
                    selectedRating === num && {
                      backgroundColor: getRatingColor(num),
                      borderColor: 'white',
                      borderWidth: 2
                    }
                  ]}
                >
                  <Text style={[
                    styles.ratingNumberText,
                    { color: getRatingColor(num) },
                    selectedRating === num && styles.ratingNumberTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Decimal</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ratingScroll}
              contentContainerStyle={styles.ratingContentContainer}
            >
              {selectedRating === 10 ? (
                <TouchableOpacity
                  onPress={() => setDecimal('0')}
                  style={[
                    styles.ratingNumberButton,
                    { backgroundColor: ratingColor + '20' },
                    decimal === '0' && {
                      backgroundColor: ratingColor,
                      borderColor: 'white',
                      borderWidth: 2
                    }
                  ]}
                >
                  <Text style={[
                    styles.ratingNumberText,
                    { color: ratingColor },
                    decimal === '0' && styles.ratingNumberTextSelected
                  ]}>
                    .0
                  </Text>
                </TouchableOpacity>
              ) : (
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setDecimal(num.toString())}
                    style={[
                      styles.ratingNumberButton,
                      { backgroundColor: ratingColor + '20' },
                      decimal === num.toString() && {
                        backgroundColor: ratingColor,
                        borderColor: 'white',
                        borderWidth: 2
                      }
                    ]}
                  >
                    <Text style={[
                      styles.ratingNumberText,
                      { color: ratingColor },
                      decimal === num.toString() && styles.ratingNumberTextSelected
                    ]}>
                      .{num}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Text style={styles.modalLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario sobre la canción..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={[styles.previewContainer, { borderColor: ratingColor + '40' }]}>
              <Text style={styles.previewLabel}>Nota final</Text>
              <Text style={[styles.previewValue, { color: ratingColor }]}>
                {finalRating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const StateSelector = ({ visible, onClose, onSelect, onToggleFavorite, onDelete, onRefresh, currentState, isFavorite }) => {
  const states = [
    { id: 'listened', label: 'Escuchado', icon: 'checkmark-circle', color: '#4ADE80' },
    { id: 'listening', label: 'Escuchando', icon: 'headset', color: '#60A5FA' },
    { id: 'to_listen', label: 'Por escuchar', icon: 'time', color: '#FBBF24' },
  ];

  const handleDelete = () => {
    onClose();
    Alert.alert('Eliminar álbum', '¿Estás seguro? Esta acción eliminará el álbum y todas sus canciones.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: onDelete, style: 'destructive' }
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={30} style={styles.stateModalContainer}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.stateModalContent}>
          <View style={styles.stateModalHeader}>
            <Text style={styles.stateModalTitle}>Opciones del álbum</Text>
            <TouchableOpacity onPress={onClose} style={styles.stateCloseButton}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <View style={styles.stateSection}>
            <Text style={styles.stateSectionTitle}>Estado</Text>
            {states.map(state => (
              <TouchableOpacity
                key={state.id}
                style={[
                  styles.stateItem,
                  currentState === state.id && styles.stateItemActive
                ]}
                onPress={() => { onSelect(state.id); onClose(); }}
              >
                <View style={[styles.stateIconContainer, { backgroundColor: state.color + '20' }]}>
                  <Ionicons name={state.icon} size={22} color={state.color} />
                </View>
                <Text style={[
                  styles.stateItemText,
                  currentState === state.id && styles.stateItemTextActive
                ]}>
                  {state.label}
                </Text>
                {currentState === state.id && (
                  <Ionicons name="checkmark-circle" size={22} color={state.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.stateDivider} />

          <TouchableOpacity
            style={styles.stateItem}
            onPress={() => { onToggleFavorite(); onClose(); }}
          >
            <View style={[styles.stateIconContainer, { backgroundColor: isFavorite ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)' }]}>
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={isFavorite ? '#FFD700' : 'rgba(255,255,255,0.6)'}
              />
            </View>
            <Text style={styles.stateItemText}>
              {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stateItem}
            onPress={() => { onRefresh(); onClose(); }}
          >
            <View style={[styles.stateIconContainer, { backgroundColor: 'rgba(147,51,234,0.1)' }]}>
              <Ionicons name="refresh" size={22} color="#9333EA" />
            </View>
            <Text style={styles.stateItemText}>Actualizar información</Text>
          </TouchableOpacity>

          <View style={styles.stateDivider} />

          <TouchableOpacity
            style={[styles.stateItem, styles.stateDeleteItem]}
            onPress={handleDelete}
          >
            <View style={[styles.stateIconContainer, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.stateItemText, styles.stateDeleteText]}>Eliminar álbum</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

// Funciones de utilidad
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

const AlbumSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#000' }}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a' }]} />
    <View style={{ width: width, height: height * 0.5, backgroundColor: 'rgba(255,255,255,0.05)' }} />
    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
      <View style={{ width: '70%', height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8 }} />
      <View style={{ width: '40%', height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View style={{ width: 60, height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 12 }} />
        <View style={{ width: 40, height: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <View style={{ flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, marginRight: 8 }} />
        <View style={{ flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }} />
      </View>
      {[1, 2, 3, 4, 5].map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
          <View style={{ width: 30, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 8 }} />
          <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginRight: 8 }} />
          <View style={{ width: 30, height: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

export default function AlbumScreen({ route, navigation }) {
  const { album: initialAlbum, artistName, artistId, refresh } = route.params || {};

  // Usar el hook personalizado
  const {
    album,
    albumDetails,
    tracks,
    loading,
    refreshing,
    isSaved,
    albumState,
    albumRating,
    albumComment,
    isFavorite,
    dominantColor,
    setDominantColor,
    loadAlbumData,
    saveAlbum,
    updateAlbumState,
    toggleFavorite,
    deleteAlbum,
    saveAlbumComment,
    saveTrackRating,
    refreshAlbumInfo,
    updateAlbum,
    setTracks,
  } = useAlbumData(initialAlbum, artistName, artistId);

  // Estados locales de UI
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [tempComment, setTempComment] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [activeInfoTab, setActiveInfoTab] = useState('tracks');

  // Carga inicial
  useEffect(() => {
    console.log('AlbumScreen montado con params:', { initialAlbum, artistName, artistId });
    updateAlbum(initialAlbum || {});
    loadAlbumData();
  }, []);

  // Efecto para recargar cuando viene de refresh
  useEffect(() => {
    if (refresh) {
      console.log('Recargando por refresh...');
      loadAlbumData();
    }
  }, [refresh]);

  // Efecto para actualizar colores cuando cambia la portada
  useEffect(() => {
    if (album?.cover) {
      const largeUrl = album.cover.includes('/250x250-')
        ? album.cover.replace('/250x250-', '/1000x1000-')
        : album.cover;
      setImageUrl(largeUrl);
      getImageColors(largeUrl);
    }
  }, [album]);

  // Ocultar el tab navigator
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

  const getImageColors = async (imageUrl) => {
    try {
      const colors = await ImageColors.getColors(imageUrl, {
        fallback: '#000000',
        cache: true,
        key: album.id?.toString() || 'default',
      });

      switch (colors.platform) {
        case 'android':
          setDominantColor(colors.dominant || colors.vibrant || '#000000');
          break;
        case 'ios':
          setDominantColor(colors.background || colors.primary || '#000000');
          break;
        default:
          setDominantColor('#000000');
      }
    } catch (error) {
      console.error('Error obteniendo colores:', error);
      setDominantColor('#000000');
    }
  };

  const handleSaveComment = async () => {
    if (tempComment !== albumComment) {
      const success = await saveAlbumComment(tempComment);
      if (success) {
        setIsEditingComment(false);
      }
    } else {
      setIsEditingComment(false);
    }
  };

  const handleDeleteAlbum = async () => {
    const deleted = await deleteAlbum();
    if (deleted) {
      // Pequeña pausa antes de navegar para asegurar que la BD se libere
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    }
  };

  const toggleCommentExpansion = (trackId) => {
    setExpandedComments(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  const albumRatingColor = getDecimalColor(albumRating);
  const borderColor = getRatingColor(Math.floor(albumRating) + 1) || albumRatingColor;

  const formatRating = (rating) => {
    if (rating === 0) return '-';
    if (rating === 10) return '10';
    return rating.toFixed(1);
  };

  const renderInfoTab = () => {
    if (!albumDetails) return null;

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

    return (
      <View style={styles.infoContainer}>
        {genresList.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Géneros</Text>
            <View style={styles.genresContainer}>
              {genresList.map((genre, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigation.navigate('Genre', { genre })}
                >
                  <View style={[styles.genreChip, { backgroundColor: dominantColor + '40', borderColor: dominantColor }]}>
                    <Text style={styles.genreChipText}>{genre}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Detalles</Text>

          {albumDetails.record_type && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {formatAlbumType(albumDetails.record_type)}
              </Text>
            </View>
          )}

          {albumDetails.duration > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duración total:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {formatDuration(albumDetails.duration)}
              </Text>
            </View>
          )}

          {albumDetails.record_label && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sello:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {albumDetails.record_label}
              </Text>
            </View>
          )}

          {albumDetails.release_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lanzamiento:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {formatDate(albumDetails.release_date)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Estadísticas</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Canciones calificadas:</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
              {tracks.filter(t => t.rating).length} / {tracks.length}
            </Text>
          </View>

          {albumRating > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Promedio:</Text>
              <Text style={[styles.infoValue, { color: albumRatingColor }]} numberOfLines={1} ellipsizeMode="tail">
                {albumRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <AlbumSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: dominantColor }}>
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSave={(rating, comment) => saveTrackRating(selectedTrack, rating, comment)}
        currentRating={selectedTrack ? tracks.find(t => t.id === selectedTrack)?.rating : null}
        trackTitle={selectedTrack ? tracks.find(t => t.id === selectedTrack)?.title : ''}
      />

      <StateSelector
        visible={showStateModal}
        onClose={() => setShowStateModal(false)}
        onSelect={updateAlbumState}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDeleteAlbum}
        onRefresh={refreshAlbumInfo}
        currentState={albumState}
        isFavorite={isFavorite}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 60, left: 20, zIndex: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 20 }}>
          {isSaved ? (
            <TouchableOpacity onPress={() => setShowStateModal(true)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={saveAlbum} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="download-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ width: width, height: height * 0.5, position: 'relative' }}>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['transparent', dominantColor + 'FF']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.2 }}
            pointerEvents="none"
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -50 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 'bold',
                  flex: 1,
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 4
                }} numberOfLines={2}>
                  {album.title}
                </Text>
                {isFavorite && (
                  <Ionicons name="star" size={28} color="#FFD700" style={{ marginLeft: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                )}
              </View>

              <Text style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 18,
                marginTop: 4,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2
              }}>{artistName}</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2
                }}>
                  {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                </Text>
                {albumDetails?.record_type && (
                  <>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', marginHorizontal: 6 }}>•</Text>
                    <Text style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 14,
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2
                    }}>
                      {formatAlbumType(albumDetails.record_type)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={{ alignItems: 'center', marginLeft: 16 }}>
              <Text style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
                marginBottom: 4,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2
              }}>Nota</Text>
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 3,
                borderColor: borderColor,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}>
                <Text style={{
                  color: albumRatingColor,
                  fontSize: 28,
                  fontWeight: 'bold',
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 3
                }}>
                  {formatRating(albumRating)}
                </Text>
              </View>
            </View>
          </View>

          {isSaved && (
            <View style={{ marginBottom: 24 }}>
              {isEditingComment ? (
                <View>
                  <TextInput
                    style={{
                      color: 'white',
                      fontSize: 16,
                      minHeight: Math.max(80, tempComment.split('\n').length * 24),
                      textAlignVertical: 'top',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.2)',
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2
                    }}
                    placeholder="Escribe un comentario sobre el álbum..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={tempComment}
                    onChangeText={setTempComment}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <TouchableOpacity onPress={() => { setTempComment(albumComment); setIsEditingComment(false); }} style={{ marginRight: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveComment}>
                      <Text style={{ color: '#9333EA', fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : albumComment ? (
                <TouchableOpacity onPress={() => { setTempComment(albumComment); setIsEditingComment(true); }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>Comentario</Text>
                  <Text style={{ color: 'white', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>{albumComment}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => { setTempComment(''); setIsEditingComment(true); }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.5)" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>Agregar comentario</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isSaved && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeInfoTab === 'tracks' && styles.activeInfoTab]}
                onPress={() => setActiveInfoTab('tracks')}
              >
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color={activeInfoTab === 'tracks' ? 'white' : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[styles.tabLabel, activeInfoTab === 'tracks' && styles.activeTabLabel]}>
                  Canciones
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeInfoTab === 'info' && styles.activeInfoTab]}
                onPress={() => setActiveInfoTab('info')}
              >
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={activeInfoTab === 'info' ? 'white' : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[styles.tabLabel, activeInfoTab === 'info' && styles.activeTabLabel]}>
                  Información
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeInfoTab === 'tracks' ? (
            <View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 }}>Canciones</Text>

              {tracks.map((track, index) => {
                const trackColor = getDecimalColor(track.rating);
                const isExpanded = expandedComments[track.id];

                return (
                  <TouchableOpacity
                    key={track.id || index}
                    onPress={() => {
                      if (isSaved) {
                        setSelectedTrack(track.id);
                        setRatingModalVisible(true);
                      }
                    }}
                    disabled={!isSaved}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.5)', width: 35, fontSize: 16, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>
                      {track.track_number || index + 1}
                    </Text>

                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }} numberOfLines={1}>
                        {track.title}
                      </Text>
                      {track.comment && (
                        <TouchableOpacity
                          onPress={() => toggleCommentExpansion(track.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              color: 'rgba(255,255,255,0.5)',
                              fontSize: 12,
                              marginTop: 2,
                              textShadowColor: 'rgba(0,0,0,0.3)',
                              textShadowOffset: { width: 1, height: 1 },
                              textShadowRadius: 1
                            }}
                            numberOfLines={isExpanded ? undefined : 2}
                          >
                            {track.comment}
                          </Text>
                          {!isExpanded && track.comment.length > 50 && (
                            <Text style={{ color: '#9333EA', fontSize: 10, marginTop: 2 }}>
                              Ver más...
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {track.rating ? (
                      <Text style={{ color: trackColor, fontSize: 16, fontWeight: 'bold', marginRight: 8, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>
                        {track.rating === 10 ? '10' : track.rating.toFixed(1)}
                      </Text>
                    ) : (
                      <Ionicons name="star-outline" size={20} color="rgba(255,255,255,0.3)" style={{ marginRight: 8, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            renderInfoTab()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeInfoTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabLabel: {
    fontSize: 14,
    marginLeft: 6,
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabLabel: {
    color: 'white',
  },
  infoContainer: {
    paddingBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  infoSectionTitle: {
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
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  genreChipText: {
    color: 'white',
    fontSize: 13,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 24,
    width: width - 40,
    maxHeight: height * 0.8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    maxWidth: width - 120,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  ratingScroll: {
    marginBottom: 20,
  },
  ratingContentContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  ratingNumberButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingNumberText: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingNumberTextSelected: {
    color: 'white',
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  previewContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stateModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  stateModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    width: width - 48,
    maxHeight: height * 0.9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    paddingBottom: 70,
  },
  stateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stateModalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  stateCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateSection: {
    marginBottom: 8,
  },
  stateSectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  stateItemActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stateIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stateItemText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  stateItemTextActive: {
    color: 'white',
  },
  stateDeleteItem: {
    marginTop: 4,
  },
  stateDeleteText: {
    color: '#ef4444',
  },
  stateDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
});