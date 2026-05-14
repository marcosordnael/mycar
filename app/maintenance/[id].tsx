import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMaintenanceRecordById, deleteMaintenanceRecord } from '../../src/database/repositories/maintenanceRepository';
import { MaintenanceRecord } from '../../src/types';
import { formatCurrencyBRL, formatDateBR } from '../../src/utils/formatters';
import { Button } from '../../src/components/Button';
import { FormSectionCard } from '../../src/components/FormSectionCard';

export default function MaintenanceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        const data = getMaintenanceRecordById(Number(id));
        if (data) {
          setRecord(data);
        } else {
          Alert.alert('Erro', 'Registro não encontrado.');
          router.back();
        }
      }
    }, [id])
  );

  const handleDelete = () => {
    Alert.alert(
      'Atenção',
      'Tem certeza que deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            if (record) {
              deleteMaintenanceRecord(record.id);
              router.back();
            }
          }
        }
      ]
    );
  };

  if (!record) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.highlightCard}>
           <View style={styles.highlightIcon}>
              <Ionicons name="build" size={32} color="#3B82F6" />
           </View>
           <Text style={styles.serviceTitle}>{record.serviceType}</Text>
           <Text style={styles.costBadge}>{formatCurrencyBRL(record.cost)}</Text>
        </View>

        <View style={styles.detailsContent}>
          <FormSectionCard title="Dados de Execução" icon="checkmark-circle">
            <View style={styles.row}>
              <Text style={styles.label}>Data do Serviço</Text>
              <Text style={styles.value}>{formatDateBR(record.date)}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.label}>Quilometragem</Text>
              <Text style={styles.value}>{record.mileage.toLocaleString('pt-BR')} km</Text>
            </View>
          </FormSectionCard>

          {(record.nextRevisionDate || record.nextRevisionMileage) && (
            <FormSectionCard title="Previsão de Revisão" icon="calendar">
              {record.nextRevisionDate && (
                <View style={styles.row}>
                  <Text style={styles.label}>Data Agendada</Text>
                  <Text style={styles.value}>{formatDateBR(record.nextRevisionDate)}</Text>
                </View>
              )}
              {record.nextRevisionMileage && (
                <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.label}>Km Alvo</Text>
                  <Text style={styles.value}>{record.nextRevisionMileage.toLocaleString('pt-BR')} km</Text>
                </View>
              )}
            </FormSectionCard>
          )}

          {record.notes ? (
            <FormSectionCard title="Observações" icon="document-text">
              <Text style={styles.notesText}>{record.notes}</Text>
            </FormSectionCard>
          ) : null}
        </View>

      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  highlightCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 24,
  },
  highlightIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
    textAlign: 'center',
  },
  costBadge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
  },
  detailsContent: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  notesText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
  }
});
