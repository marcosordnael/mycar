import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../src/components/TextField';
import { Button } from '../src/components/Button';
import { FormSectionCard } from '../src/components/FormSectionCard';
import { GradientCard } from '../src/components/GradientCard';
import { getVehicleById, updateVehicle, deleteVehicle } from '../src/database/repositories/vehicleRepository';
import { getSelectedVehicleId } from '../src/database/repositories/settingsRepository';
import { Vehicle } from '../src/types';

export default function VehicleSettings() {
  const router = useRouter();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');

  useEffect(() => {
    const selectedId = getSelectedVehicleId();
    if (!selectedId) return;
    const v = getVehicleById(selectedId);
    if (v) {
      setVehicle(v);
      setBrand(v.brand);
      setModel(v.model);
      setYear(v.year.toString());
      setPlate(v.plate);
      setCurrentMileage(v.currentMileage ? v.currentMileage.toString() : '');
    }
  }, []);

  const handleSave = () => {
    if (!vehicle) return;
    
    if (!brand.trim() || !model.trim() || !year.trim() || !plate.trim()) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios (Marca, Modelo, Ano e Placa).');
      return;
    }

    const numYear = parseInt(year);
    if (isNaN(numYear) || numYear < 1900 || numYear > new Date().getFullYear() + 2) {
      Alert.alert('Erro', 'Informe um ano válido para o veículo.');
      return;
    }

    const curMileage = currentMileage.trim() ? parseInt(currentMileage) : undefined;
    if (curMileage !== undefined && (isNaN(curMileage) || curMileage < 0)) {
      Alert.alert('Erro', 'Informe uma quilometragem atual válida.');
      return;
    }

    try {
      updateVehicle(
        vehicle.id,
        brand.trim(), 
        model.trim(), 
        numYear, 
        plate.trim(),
        curMileage
      );
      Alert.alert('Sucesso', 'Dados do veículo atualizados!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o veículo.');
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Perfil do Veículo</Text>
          <Text style={styles.subtitle}>Gerencie as informações do seu carro</Text>

          <View style={styles.previewContainer}>
            <GradientCard
               brand={brand || 'Marca'}
               model={model || 'Modelo'}
               plate={plate || 'XXX-0000'}
               year={year || 'Ano'}
               mileage={currentMileage ? parseInt(currentMileage) : undefined}
            />
          </View>

          <View style={styles.form}>
            <FormSectionCard title="Identificação" icon="car">
              <TextField 
                label="Marca*" 
                value={brand}
                onChangeText={setBrand}
                placeholder="Ex: Honda, Toyota..."
              />
              <TextField 
                label="Modelo*" 
                value={model}
                onChangeText={setModel}
                placeholder="Ex: Civic, Corolla..."
              />
            </FormSectionCard>

            <FormSectionCard title="Detalhes Técnicos" icon="document-text">
              <TextField 
                label="Ano*" 
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="Ex: 2020"
              />
              <TextField 
                label="Placa*" 
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
                placeholder="ABC1D23"
              />
            </FormSectionCard>

            <FormSectionCard title="Uso Atual" icon="speedometer">
              <TextField 
                label="Quilometragem Atual (km)" 
                value={currentMileage}
                onChangeText={setCurrentMileage}
                keyboardType="number-pad"
                placeholder="Ex: 55000"
              />
            </FormSectionCard>
          </View>

          <Button title="Salvar Alterações" onPress={handleSave} style={{ marginBottom: 12 }} />
          <Button title="Voltar" variant="secondary" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  previewContainer: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 16,
  }
});
