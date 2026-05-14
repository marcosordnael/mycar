import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { closeDbConnection, initDb } from '../src/database/db';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      initDb();
      setDbReady(true);
    } catch (e) {
      console.error('Error initializing DB:', e);
      try {
        closeDbConnection();
        initDb();
        setDbReady(true);
      } catch (retryError) {
        console.error('Error initializing DB after retry:', retryError);
      }
    }
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#F9FAFB' }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaProvider>
  );
}
