// components/album/AlbumInfo/RatingSummary.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRatingColor } from '../../shared/RatingBadge';

const RatingSummary = ({ tracks }) => {
  // Inicializar contadores para cada rango
  const ranges = [
    { min: 9, max: 10, label: '9-10', count: 0 },
    { min: 7, max: 8.9, label: '7-8', count: 0 },
    { min: 5, max: 6.9, label: '5-6', count: 0 },
    { min: 3, max: 4.9, label: '3-4', count: 0 },
    { min: 1, max: 2.9, label: '1-2', count: 0 },
    { min: 0, max: 0, label: 'Sin calificar', count: 0 },
  ];

  // Contar canciones en cada rango
  tracks.forEach(track => {
    if (!track.rating || track.rating === 0) {
      ranges[5].count++;
    } else if (track.rating >= 9) {
      ranges[0].count++;
    } else if (track.rating >= 7) {
      ranges[1].count++;
    } else if (track.rating >= 5) {
      ranges[2].count++;
    } else if (track.rating >= 3) {
      ranges[3].count++;
    } else {
      ranges[4].count++;
    }
  });

  // Encontrar el máximo para las barras
  const maxCount = Math.max(...ranges.map(r => r.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribución de calificaciones</Text>
      
      {ranges.map((range, index) => {
        const barWidth = (range.count / maxCount) * 100;
        const barColor = index < 5 ? getRatingColor(range.min) : '#4B5563';
        
        return (
          <View key={range.label} style={styles.row}>
            <Text style={styles.rangeLabel}>{range.label}</Text>
            
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.countLabel}>{range.count}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    width: 45,
    marginRight: 8,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  countLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
});

export default RatingSummary;