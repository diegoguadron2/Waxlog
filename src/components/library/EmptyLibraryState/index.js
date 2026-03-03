// components/EmptyLibraryState/index.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const EmptyLibraryState = ({ activeTab, onAddPress }) => {
  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.emptyIcon}
      >
        <Ionicons name="albums-outline" size={48} color="#666" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        No hay álbumes en esta categoría
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'to_listen'
          ? 'Agrega álbumes desde Búsqueda o con el botón +'
          : 'Cambia el estado de tus álbumes para verlos aquí'}
      </Text>
      {activeTab === 'to_listen' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onAddPress}
        >
          <Text style={styles.emptyButtonText}>Agregar manualmente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default EmptyLibraryState;