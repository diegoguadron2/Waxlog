import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Layout,
  FadeIn,
} from 'react-native-reanimated';
import AlbumCard from '../AlbumCard';
import { Dimensions, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const GAP = 16;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - GAP) / 2;

const AnimatedAlbumCard = ({ album, viewMode, activeTab, onPress, cardWidth }) => {
  if (viewMode === 'grid') {
    return (
      <TouchableOpacity onPress={() => onPress(album)} style={styles.gridContainer} activeOpacity={0.7}>
        <View style={[styles.imageContainer, { width: CARD_WIDTH, height: CARD_WIDTH }]}>
          <Image 
            source={{ uri: album.cover }} 
            style={styles.gridImage}
            resizeMode="cover"
          />
          <View style={styles.gridBadge}>
            {activeTab === 'listened' && (
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            )}
            {activeTab === 'listening' && (
              <Ionicons name="headset" size={16} color="#F59E0B" />
            )}
            {activeTab === 'to_listen' && (
              <Ionicons name="time" size={16} color="#3B82F6" />
            )}
          </View>
        </View>
        <View style={styles.gridTextContainer}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={styles.gridArtist} numberOfLines={1}>
            {album.artist_name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Modo lista
  return (
    <TouchableOpacity onPress={() => onPress(album)} style={styles.listContainer} activeOpacity={0.7}>
      <View style={[styles.listImageContainer, { width: 70, height: 70 }]}>
        <Image 
          source={{ uri: album.cover }} 
          style={styles.listImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.listTextContainer}>
        <View style={styles.listTitleRow}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {album.title}
          </Text>
          {activeTab === 'listened' && (
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          )}
          {activeTab === 'listening' && (
            <Ionicons name="headset" size={18} color="#F59E0B" />
          )}
          {activeTab === 'to_listen' && (
            <Ionicons name="time" size={18} color="#3B82F6" />
          )}
        </View>
        <Text style={styles.listArtist} numberOfLines={1}>
          {album.artist_name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  gridContainer: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  gridTextContainer: {
    marginTop: 8,
    width: '100%',
  },
  gridTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  gridArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    width: '100%',
  },
  listImageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  listArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
};

export default AnimatedAlbumCard;