import React, { useEffect } from 'react';
import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from './src/database/Index';
export default function App() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return <AppNavigator />;
}