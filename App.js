// App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from './src/database/Index';
import { SharedElementProvider } from './src/context/SharedElementContext';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function App() {
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        if (__DEV__) console.log('📦 Inicializando base de datos...');
        await initDatabase();
        if (__DEV__) console.log('✅ Base de datos lista');
        setIsDBReady(true);
      } catch (error) {
        if (__DEV__) console.error('❌ Error inicializando BD:', error);
        setIsDBReady(true);
      }
    };
    setupDatabase();
  }, []);

  if (!isDBReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SharedElementProvider>
        <AppNavigator />
      </SharedElementProvider>
    </GestureHandlerRootView>
  );
}