import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ViewModeToggle = ({ viewMode, onToggle }) => {
  return (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
        onPress={() => onToggle('grid')}
      >
        <Ionicons
          name="grid-outline"
          size={18}
          color={viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.4)'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
        onPress={() => onToggle('list')}
      >
        <Ionicons
          name="list-outline"
          size={18}
          color={viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.4)'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeViewButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default ViewModeToggle;