import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PADDING_HORIZONTAL = 16;

const SortMenu = ({ 
  visible, 
  options, 
  selectedOption, 
  onSelect,
  onClose 
}) => {
  if (!visible) return null;

  return (
    <>
      <TouchableOpacity 
        style={StyleSheet.absoluteFillObject} 
        onPress={onClose}
        activeOpacity={0}
      />
      <View style={styles.sortMenu}>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortOption, 
              selectedOption === option.id && styles.activeSortOption
            ]}
            onPress={() => onSelect(option.id)}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={selectedOption === option.id ? '#9333EA' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[
              styles.sortOptionText, 
              selectedOption === option.id && styles.activeSortOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sortMenu: {
    position: 'absolute',
    top: 220,
    left: PADDING_HORIZONTAL,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeSortOption: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  sortOptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
  activeSortOptionText: {
    color: '#9333EA',
  },
});

export default SortMenu;