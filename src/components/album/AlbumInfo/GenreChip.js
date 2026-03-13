import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Componente GenreChip
 * 
 * @param {Object} props
 * @param {string} props.genre 
 * @param {string} props.backgroundColor 
 * @param {string} props.borderColor 
 */
const GenreChip = ({ genre, backgroundColor, borderColor }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Genre', { genre });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.chip, { backgroundColor, borderColor }]}>
        <Text style={styles.text}>{genre}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    color: 'white',
    fontSize: 13,
  },
});

export default GenreChip;