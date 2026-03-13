import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const PADDING_HORIZONTAL = 16;
const GAP = 16;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - GAP) / COLUMN_COUNT;

const AlbumSkeleton = memo(({ viewMode }) => {
  if (viewMode === 'grid') {
    const skeletons = Array(6).fill(null);

    return (
      <View style={styles.skeletonGridContainer}>
        {skeletons.map((_, index) => (
          <View key={index} style={[styles.skeletonGridCard, { width: CARD_WIDTH }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonArtist} />
          </View>
        ))}
      </View>
    );
  } else {
    const skeletons = Array(4).fill(null);

    return (
      <View style={styles.skeletonListContainer}>
        {skeletons.map((_, index) => (
          <View key={index} style={styles.skeletonListCard}>
            <View style={styles.skeletonListImage} />
            <View style={styles.skeletonListInfo}>
              <View style={styles.skeletonListTitle} />
              <View style={styles.skeletonListArtist} />
              <View style={styles.skeletonListTrack} />
            </View>
          </View>
        ))}
      </View>
    );
  }
});

const styles = StyleSheet.create({
  skeletonGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  skeletonGridCard: {
    marginBottom: GAP,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
    alignSelf: 'center',
  },
  skeletonArtist: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 4,
    alignSelf: 'center',
  },
  skeletonListContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  skeletonListCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  skeletonListImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonListTitle: {
    width: '70%',
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  skeletonListArtist: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
  skeletonListTrack: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});

export default AlbumSkeleton;