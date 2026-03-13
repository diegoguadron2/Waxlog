import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRatingColor, formatRating } from '../../shared/RatingBadge';

const TrackItem = ({
  track,
  index,
  isSaved,
  isExpanded,
  onPress,
  onToggleComment,
  showDiskNumber,
  currentDisk,
  dominantColor,
}) => {
  if (!track) return null;

  const trackNumber = track.displayNumber || track.track_number || index + 1;
  const displayText = trackNumber;

  const hasRating = track.rating && track.rating > 0;
  const ratingColor = hasRating ? getRatingColor(track.rating) : null;
  const formattedRating = hasRating ? formatRating(track.rating) : null;

  const borderColor = hasRating
    ? ratingColor
    : (dominantColor ? dominantColor + '50' : 'rgba(255,255,255,0.1)');

  const bgColor = hasRating
    ? ratingColor + '08'
    : (dominantColor ? dominantColor + '08' : 'transparent');

  const handlePress = () => {
    if (isSaved) {
      onPress(track.id);
    }
  };

  const handleCommentPress = (e) => {
    e.stopPropagation();
    onToggleComment(track.id);
  };

  const barWidth = hasRating ? `${(track.rating / 10) * 100}%` : '0%';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isSaved}
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor: bgColor,
        }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.trackNumber, hasRating && { color: ratingColor }]}>
          {displayText}
        </Text>

        <Text style={styles.title} numberOfLines={10}>
          {track.title}
        </Text>

        {hasRating ? (
          <Text style={[styles.ratingText, { color: ratingColor }]}>
            {formattedRating}
          </Text>
        ) : (
          <Ionicons
            name="star-outline"
            size={18}
            color="rgba(255,255,255,0.3)"
          />
        )}
      </View>

      {hasRating && (
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: barWidth, backgroundColor: ratingColor }]} />
        </View>
      )}

      {track.comment && (
        <TouchableOpacity
          onPress={handleCommentPress}
          activeOpacity={0.7}
          style={styles.commentContainer}
        >
          <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.5)" />
          <Text
            style={styles.comment}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {track.comment}
          </Text>
          {!isExpanded && track.comment.length > 70 && (
            <Text style={styles.moreText}>Ver más...</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackNumber: {
    width: 35,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  title: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8, 
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    lineHeight: 22, 
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  barContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  comment: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  moreText: {
    color: '#9333EA',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default TrackItem;