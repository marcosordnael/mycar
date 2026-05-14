import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getFirstVehicle } from '../src/database/repositories/vehicleRepository';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkVehicle = () => {
      const vehicle = getFirstVehicle();
      if (vehicle) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/welcome');
      }
    };
    
    // Pequeno delay para garantir fluidez
    setTimeout(checkVehicle, 100);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1E3A8A" />
    </View>
  );
}
