import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRatingColor } from '../../shared/RatingBadge';

const RatingSummary = ({ tracks, dominantColor }) => {
  const ranges = [
    { min: 9, max: 10, label: '9-10', count: 0 },
    { min: 7, max: 8.9, label: '7-8',  count: 0 },
    { min: 5, max: 6.9, label: '5-6',  count: 0 },
    { min: 3, max: 4.9, label: '3-4',  count: 0 },
    { min: 1, max: 2.9, label: '1-2',  count: 0 },
    { min: 0, max: 0,   label: 'S/C',  count: 0 },
  ];

  tracks.forEach(track => {
    if (!track.rating || track.rating === 0) ranges[5].count++;
    else if (track.rating >= 9) ranges[0].count++;
    else if (track.rating >= 7) ranges[1].count++;
    else if (track.rating >= 5) ranges[2].count++;
    else if (track.rating >= 3) ranges[3].count++;
    else ranges[4].count++;
  });

  const maxCount = Math.max(...ranges.map(r => r.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribución de calificaciones</Text>

      {ranges.map((range, index) => {
        const barWidth = (range.count / maxCount) * 100;
        const barColor = index < 5
          ? getRatingColor(range.min)
          : (dominantColor ? dominantColor + '90' : '#6B7280');

        return (
          <View key={range.label} style={styles.row}>
            <Text style={styles.rangeLabel}>{range.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.countLabel, range.count > 0 && { color: barColor }]}>
              {range.count}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rangeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    marginRight: 10,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

export default RatingSummary;