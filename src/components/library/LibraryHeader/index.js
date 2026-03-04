// components/LibraryHeader/index.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const PADDING_HORIZONTAL = 16;

const LibraryHeader = ({ totalAlbums, onAddPress }) => {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Mi Biblioteca</Text>
        <Text style={styles.headerSubtitle}>
          {totalAlbums} álbumes en total
        </Text>
      </View>
      <TouchableOpacity onPress={onAddPress}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
});

export default LibraryHeader;