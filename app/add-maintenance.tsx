import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../src/components/TextField';
import { Button } from '../src/components/Button';
import { FormSectionCard } from '../src/components/FormSectionCard';
import { createMaintenanceRecord } from '../src/database/repositories/maintenanceRepository';
import { updateVehicle } from '../src/database/repositories/vehicleRepository';
import { useSelectedVehicle } from '../src/context/SelectedVehicleContext';

export default function AddMaintenance() {
  const router = useRouter();
  const { selectedVehicle, refreshSelectedVehicle } = useSelectedVehicle();
  
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // yyyy-mm-dd fallback simples
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [nextMileageInterval, setNextMileageInterval] = useState('');

  const handleSave = () => {
    if (!serviceType.trim() || !date.trim() || !mileage.trim() || !cost.trim()) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios (Tipo, Data, Km e Valor).');
      return;
    }

    const numMileage = parseInt(mileage);
    if (isNaN(numMileage) || numMileage < 0) {
      Alert.alert('Erro', 'Informe uma quilometragem válida.');
      return;
    }

    const numCost = parseFloat(cost.replace(',', '.'));
    if (isNaN(numCost) || numCost < 0) {
      Alert.alert('Erro', 'Informe um valor válido.');
      return;
    }

    const vehicle = selectedVehicle;
    if (!vehicle) {
      Alert.alert('Erro', 'Nenhum veículo encontrado. Cadastre um veículo primeiro.');
      return;
    }

    const nextMileageLimit = nextMileageInterval.trim()
      ? parseInt(nextMileageInterval, 10)
      : undefined;

    if (nextMileageLimit !== undefined && (isNaN(nextMileageLimit) || nextMileageLimit <= 0)) {
      Alert.alert('Erro', 'Informe um intervalo de quilometragem válido para a próxima revisão.');
      return;
    }

    const nextRevisionMileage = nextMileageLimit !== undefined
      ? numMileage + nextMileageLimit
      : undefined;

    try {
      createMaintenanceRecord(
        vehicle.id,
        serviceType.trim(),
        date.trim(),
        numMileage,
        numCost,
        notes.trim(),
        nextDate.trim() || undefined,
        nextRevisionMileage
      );

      if (vehicle.currentMileage === undefined || numMileage > vehicle.currentMileage) {
        updateVehicle(
          vehicle.id,
          vehicle.brand,
          vehicle.model,
          vehicle.year,
          vehicle.plate,
          numMileage
        );
        refreshSelectedVehicle();
      }

      Alert.alert('Sucesso', 'Manutenção registrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a manutenção.');
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Nova Manutenção</Text>
          <Text style={styles.subtitle}>Detalhe os serviços realizados no veículo</Text>

          <View style={styles.form}>
            <FormSectionCard title="Dados do Serviço" icon="build">
              <TextField 
                label="Tipo de Serviço*" 
                value={serviceType}
                onChangeText={setServiceType}
                placeholder="Ex: Troca de óleo, Pastilhas..."
              />
              <TextField 
                label="Data*" 
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
              />
              <TextField 
                label="Valor Total (R$)*" 
                value={cost}
                onChangeText={setCost}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </FormSectionCard>

            <FormSectionCard title="Condição do Veículo" icon="speedometer">
              <TextField 
                label="Quilometragem Atual*" 
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
                placeholder="Km atual do veículo"
              />
            </FormSectionCard>

            <FormSectionCard title="Agendar Próxima (Opcional)" icon="calendar">
              <TextField 
                label="Data Prevista" 
                value={nextDate}
                onChangeText={setNextDate}
                placeholder="AAAA-MM-DD"
              />
              <TextField 
                label="Intervalo até próxima revisão (km)" 
                value={nextMileageInterval}
                onChangeText={setNextMileageInterval}
                keyboardType="number-pad"
                placeholder="Ex: 10000"
              />
            </FormSectionCard>

            <FormSectionCard title="Observações extras" icon="document-text">
              <TextField 
                label="Detalhes adicionais" 
                value={notes}
                onChangeText={setNotes}
                placeholder="Descreva peças trocadas, marcas..."
                multiline
              />
            </FormSectionCard>
          </View>

          <Button title="Salvar Manutenção" onPress={handleSave} style={{ marginBottom: 12 }} />
          <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
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
  form: {
    marginBottom: 24,
  }
});
