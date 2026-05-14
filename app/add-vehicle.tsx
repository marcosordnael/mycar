import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../src/components/TextField';
import { SelectField, SelectOption } from '../src/components/SelectField';
import { Button } from '../src/components/Button';
import { FormSectionCard } from '../src/components/FormSectionCard';
import { GradientCard } from '../src/components/GradientCard';
import { createVehicle } from '../src/database/repositories/vehicleRepository';
import { setSelectedVehicleId } from '../src/database/repositories/settingsRepository';
import { fetchCarBrands, fetchCarModelsByBrand, fetchCarYearsByBrandAndModel } from '../src/services/fipeService';
import { FipeYear } from '../src/types';

export default function AddVehicle() {
  const router = useRouter();
  const maxExpectedYear = new Date().getFullYear() + 1;
  
  // FIPE States
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [years, setYears] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Form States
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [brand, setBrand] = useState('');
  
  const [selectedYearCode, setSelectedYearCode] = useState('');
  const [year, setYear] = useState('');
  
  const [selectedModelCode, setSelectedModelCode] = useState('');
  const [model, setModel] = useState('');

  const [plate, setPlate] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');

  // Initial Load - Brands
  useEffect(() => {
    loadBrands();
  }, []);

  const getYearLabel = (name: string, code: string): string | null => {
    const yearFromName = name.match(/\b(19|20)\d{2}\b/)?.[0];
    const yearFromCode = code.match(/^\d+/)?.[0];
    const rawYear = yearFromName ?? yearFromCode;
    if (!rawYear) {
      return null;
    }

    const parsedYear = Number(rawYear);
    if (parsedYear < 1900 || parsedYear > maxExpectedYear) {
      return null;
    }

    return String(parsedYear);
  };

  const normalizeYears = (rawYears: FipeYear[]): SelectOption[] => {
    const uniqueYears = new Map<string, SelectOption>();

    for (const yearItem of rawYears) {
      const label = getYearLabel(yearItem.name, yearItem.code);
      if (!label || uniqueYears.has(label)) {
        continue;
      }
      uniqueYears.set(label, { label, value: yearItem.code });
    }

    return Array.from(uniqueYears.values()).sort((a, b) => Number(b.label) - Number(a.label));
  };

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const data = await fetchCarBrands();
      setBrands(data.map((b) => ({ label: b.name, value: b.code })));
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleBrandSelect = async (val: string, label: string) => {
    setSelectedBrandCode(val);
    setBrand(label);
    
    // Reset dependents
    setModels([]); setYears([]);
    setSelectedModelCode(''); setModel('');
    setSelectedYearCode(''); setYear('');

    setLoadingModels(true);
    try {
      const data = await fetchCarModelsByBrand(val);
      const uniqueModels = Array.from(new Map(data.map((item) => [item.code, item])).values());
      setModels(uniqueModels.map((m) => ({ label: m.name, value: m.code })));
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelSelect = async (val: string, label: string) => {
    setSelectedModelCode(val);
    setModel(label);

    // Reset years
    setYears([]);
    setSelectedYearCode(''); setYear('');

    setLoadingYears(true);
    try {
      const data = await fetchCarYearsByBrandAndModel(selectedBrandCode, val);
      setYears(normalizeYears(data));
    } finally {
      setLoadingYears(false);
    }
  };

  const handleYearSelect = (val: string, label: string) => {
    setSelectedYearCode(val);
    setYear(label);
  };

  const handleSave = () => {
    if (!brand.trim() || !model.trim() || !year.trim() || !plate.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const numYear = parseInt(year);
    if (isNaN(numYear)) {
      Alert.alert('Erro', 'Ano inválido selecionado.');
      return;
    }

    const curMileage = currentMileage.trim() ? parseInt(currentMileage) : undefined;
    if (curMileage !== undefined && (isNaN(curMileage) || curMileage < 0)) {
      Alert.alert('Erro', 'Informe uma quilometragem atual válida.');
      return;
    }

    try {
      const newId = createVehicle(
        brand.trim(), 
        model.trim(), 
        numYear, 
        plate.trim().toUpperCase(),
        curMileage
      );
      // Define como ativo o novo veículo
      setSelectedVehicleId(newId);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o veículo.');
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
             <Text style={styles.title}>Novo Veículo</Text>
             <Text style={styles.subtitle}>Cadastre seu veículo utilizando a base da Tabela Fipe.</Text>
          </View>

          <View style={styles.previewContainer}>
            <GradientCard
               brand={brand || 'Sua Marca'}
               model={model || 'Seu Modelo'}
               plate={plate || 'XXX-0000'}
               year={year || 'Ano'}
               mileage={currentMileage ? parseInt(currentMileage) : undefined}
            />
          </View>

          <View style={styles.form}>
            <FormSectionCard title="Identificação (FIPE)" icon="car">
              <SelectField 
                 label="Marca*"
                 displayValue={brand}
                 options={brands}
                 onSelect={handleBrandSelect}
                 isLoading={loadingBrands}
                 placeholder="Selecione a Marca"
              />
              <SelectField 
                 label="Modelo*"
                 displayValue={model}
                 options={models}
                 onSelect={handleModelSelect}
                 isLoading={loadingModels}
                 disabled={!selectedBrandCode}
                 placeholder="Selecione o Modelo"
              />
              <SelectField 
                 label="Ano*"
                 displayValue={year}
                 options={years}
                 onSelect={handleYearSelect}
                 isLoading={loadingYears}
                 disabled={!selectedModelCode}
                 placeholder="Selecione o Ano"
              />
            </FormSectionCard>

            <FormSectionCard title="Detalhes Técnicos" icon="document-text">
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
                label="Quilometragem Inicial (km)" 
                value={currentMileage}
                onChangeText={setCurrentMileage}
                keyboardType="number-pad"
                placeholder="Ex: 10000"
              />
            </FormSectionCard>
          </View>

          <Button title="Salvar Veículo" onPress={handleSave} style={styles.saveBtn} />
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
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  previewContainer: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  }
});
