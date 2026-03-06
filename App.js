// App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'; // 👈 IMPORTAR
import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from './src/database/Index';
import { SharedElementProvider } from './src/context/SharedElementContext';

// Configurar Reanimated (menos estricto)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // 👈 Desactiva warnings de renderizado
});

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

  return (
    <SharedElementProvider>
      <AppNavigator />
    </SharedElementProvider>
  );
}