import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import SearchScreen from '../screens/SearchScreen';
import ArtistScreen from '../screens/ArtistScreen';
import AlbumScreen from '../screens/AlbumScreen';
import TrackScreen from '../screens/TrackScreen';
import LibraryScreen from '../screens/LibraryScreen';
import HomeScreen from '../screens/HomeScreen';
import ListsScreen from '../screens/ListsScreen';
import ArtistsAlbumsScreen from '../screens/ArtistsAlbumsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SaveAlbumScreen from '../screens/SaveAlbumScreen';
import GenreScreen from '../screens/GenreScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Configuración de animación suave para todos los stacks
const stackAnimationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 350,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  contentStyle: {
    backgroundColor: 'transparent',
  },
};

// Stack para la sección de Búsqueda
const SearchStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Stack para la sección de Biblioteca (CON SAVEALBUM)
const LibraryStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="LibraryMain" component={LibraryScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="SaveAlbum" component={SaveAlbumScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Stack para la sección de Inicio
const HomeStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Stack para la sección de Listas
const ListsStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="ListsMain" component={ListsScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Stack para la sección de Colección
const ArtistsAlbumsStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="ArtistsAlbumsMain" component={ArtistsAlbumsScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Stack para la sección de Ajustes
const SettingsStack = () => (
  <Stack.Navigator screenOptions={stackAnimationOptions}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);
// Al final del archivo, antes del export default
export const tabBarStyle = {
  position: 'absolute',
  bottom: 16,
  left: 24,
  right: 24,
  height: 55,
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  borderRadius: 40,
  paddingHorizontal: 12,
  paddingBottom: 10,
  display: 'flex',
};
// 🔴 NO EXPORTAMOS EL ESTILO

export default function AppNavigator() {
  const navigationRef = useRef(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Buscar') iconName = 'search';
            else if (route.name === 'Inicio') iconName = 'home';
            else if (route.name === 'Biblioteca') iconName = 'library';
            else if (route.name === 'Listas') iconName = 'list';
            else if (route.name === 'Colección') iconName = 'albums';
            else if (route.name === 'Ajustes') iconName = 'settings';
            
            // Versión outline cuando no está enfocado
            if (!focused) {
              iconName = iconName + '-outline';
            }
            
            return <Ionicons name={iconName} size={26} color={color} />;
          },
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            height: 70,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            borderRadius: 40,
            paddingHorizontal: 12,
            paddingBottom: 8,
            display: 'flex',
          },
          tabBarBackground: () => (
            <BlurView
              tint="dark"
              intensity={50}
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 40,
                overflow: 'hidden',
              }}
            />
          ),
          headerShown: false,
          tabBarItemStyle: {
            paddingVertical: 10,
            marginHorizontal: 6,
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeStack} />
        <Tab.Screen name="Listas" component={ListsStack} />
        <Tab.Screen name="Colección" component={ArtistsAlbumsStack} />
        <Tab.Screen name="Biblioteca" component={LibraryStack} />
        <Tab.Screen name="Buscar" component={SearchStack} />
        <Tab.Screen name="Ajustes" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}