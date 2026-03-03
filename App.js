// App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from './src/database/Index';

export default function App() {
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('📦 Inicializando base de datos...');
        await initDatabase();
        console.log('✅ Base de datos lista');
        setIsDBReady(true);
      } catch (error) {
        console.error('❌ Error inicializando BD:', error);
        // Aún así, intentamos continuar
        setIsDBReady(true);
      }
    };

    setupDatabase();
  }, []);

  if (!isDBReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  return <AppNavigator />;
}