import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PADDING_HORIZONTAL = 16;

const LibraryHeader = ({
  totalAlbums,
  title = 'Mi Biblioteca',
  accentColor = 'rgba(255,255,255,0.5)',
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const navigation = useNavigation();

  const menuItems = [
    { name: 'Inicio', screen: 'Home', icon: 'home-outline' },
    { name: 'Listas', screen: 'Lists', icon: 'list-outline' },
    { name: 'Géneros', screen: 'ArtistsAlbums', icon: 'mic-outline' },
    { name: 'Agregar álbum', screen: 'SaveAlbum', icon: 'add-circle-outline' },
    { name: 'Configuración', screen: 'Settings', icon: 'settings-outline' },
  ];

  const openMenu = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height + 5,
          right: PADDING_HORIZONTAL,
        });
        setMenuVisible(true);
      });
    }
  };

  const handleMenuItemPress = (screen) => {
    setMenuVisible(false);
    navigation.navigate(screen);
  };

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.headerSubtitle, { color: accentColor }]}>
              {totalAlbums} {totalAlbums === 1 ? 'álbum' : 'álbumes'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={styles.iconButton}
          >
            <Ionicons name="search" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            ref={menuButtonRef}
            onPress={openMenu}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.menuContainer, menuPosition]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color="rgba(255,255,255,0.7)"
                  style={styles.menuItemIcon}
                />
                <Text style={styles.menuItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  iconButton: {
    padding: 6,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '400',
  },
});

export default LibraryHeader;