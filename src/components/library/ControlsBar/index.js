import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewModeToggle from '../ViewModeToggle';

const PADDING_HORIZONTAL = 16;

const ControlsBar = ({ 
  sortLabel, 
  onSortPress,
  viewMode,
  onViewModeChange,
  accentColor = 'rgba(255,255,255,0.8)',
}) => {
  return (
    <View style={styles.controlsBar}>
      <TouchableOpacity
        style={[styles.controlButton, { borderColor: accentColor + '30' }]}
        onPress={onSortPress}
      >
        <Ionicons name="funnel-outline" size={18} color={accentColor} />
        <Text style={[styles.controlText, { color: accentColor }]}>
          {sortLabel || 'Ordenar'}
        </Text>
      </TouchableOpacity>

      <ViewModeToggle viewMode={viewMode} onToggle={onViewModeChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginLeft: 6,
  },
});

export default ControlsBar;