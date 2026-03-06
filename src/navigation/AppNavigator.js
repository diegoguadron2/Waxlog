// navigation/AppNavigator.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens principales (solo los 3 estados)
import ListenedScreen from '../screens/ListenedScreen';
import ListeningScreen from '../screens/ListeningScreen';
import ToListenScreen from '../screens/ToListenScreen';

// Otras screens
import SearchScreen from '../screens/SearchScreen';
import ArtistScreen from '../screens/ArtistScreen';
import AlbumScreen from '../screens/AlbumScreen';
import TrackScreen from '../screens/TrackScreen';
import HomeScreen from '../screens/HomeScreen';
import ListsScreen from '../screens/ListsScreen';
import ArtistsAlbumsScreen from '../screens/ArtistsAlbumsScreen';
import SaveAlbumScreen from '../screens/SaveAlbumScreen';
import GenreScreen from '../screens/GenreScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Configuración de animaciones para las pantallas de estado
const stateStackAnimationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
  animation: 'slide_from_right', // Animación básica de deslizamiento
  animationDuration: 300, // Duración de la animación en ms
  gestureEnabled: true, // Habilitar gestos para navegar hacia atrás
  gestureDirection: 'horizontal', // Dirección del gesto
};

// Stack para las pantallas de los 3 estados con animaciones
const StateStack = ({ state }) => {
  const getComponent = () => {
    switch(state) {
      case 'listened': return ListenedScreen;
      case 'listening': return ListeningScreen;
      case 'to_listen': return ToListenScreen;
      default: return ListenedScreen;
    }
  };

  return (
    <Stack.Navigator screenOptions={stateStackAnimationOptions}>
      <Stack.Screen name={`${state}Main`} component={getComponent()} />
      <Stack.Screen 
        name="Album" 
        component={AlbumScreen} 
        options={{
          animation: 'fade', // Animación de fade para entrar a Album
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="Artist" 
        component={ArtistScreen}
        options={{
          animation: 'slide_from_bottom', // Animación desde abajo para Artist
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="Track" 
        component={TrackScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="SaveAlbum" 
        component={SaveAlbumScreen}
        options={{
          animation: 'fade',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="Genre" 
        component={GenreScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
};

// Stack principal (sin cambios en animaciones)
const MainStackNavigator = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: 'transparent' }
    }}
  >
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Lists" component={ListsScreen} />
    <Stack.Screen name="ArtistsAlbums" component={ArtistsAlbumsScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Artist" component={ArtistScreen} />
    <Stack.Screen name="Album" component={AlbumScreen} />
    <Stack.Screen name="Track" component={TrackScreen} />
    <Stack.Screen name="SaveAlbum" component={SaveAlbumScreen} />
    <Stack.Screen name="Genre" component={GenreScreen} />
  </Stack.Navigator>
);

// Componente personalizado para el TabBar (sin cambios)
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        if (route.name === 'Escuchados') iconName = 'checkmark-circle';
        else if (route.name === 'Escuchando') iconName = 'headset';
        else if (route.name === 'Por escuchar') iconName = 'time';
        
        if (!isFocused) {
          iconName = iconName + '-outline';
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons 
              name={iconName} 
              size={26} 
              color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Tab Navigator (sin cambios)
const TabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Escuchados" children={() => <StateStack state="listened" />} />
    <Tab.Screen name="Escuchando" children={() => <StateStack state="listening" />} />
    <Tab.Screen name="Por escuchar" children={() => <StateStack state="to_listen" />} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 15,
    left: 80,
    right: 80,
    height: 50,
    backgroundColor: 'rgba(18, 18, 18, 0.75)',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default function AppNavigator() {
  const navigationRef = useRef(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <MainStackNavigator />
    </NavigationContainer>
  );
}