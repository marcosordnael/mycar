import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirstVehicle } from '../../src/database/repositories/vehicleRepository';
import { getMaintenanceRecords } from '../../src/database/repositories/maintenanceRepository';
import { MaintenanceRecord, Vehicle } from '../../src/types';
import { formatCurrencyBRL, formatDateBR } from '../../src/utils/formatters';

export default function Maintenances() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      const v = getFirstVehicle();
      if (v) {
        setVehicle(v);
        setRecords(getMaintenanceRecords(v.id));
      }
    }, [])
  );

  const renderItem = ({ item }: { item: MaintenanceRecord }) => {
    const hasNext = item.nextRevisionDate || item.nextRevisionMileage;
    return (
      <TouchableOpacity onPress={() => router.push(`/maintenance/${item.id}`)} activeOpacity={0.8} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="construct" size={24} color="#3B82F6" />
          </View>
          <View style={styles.cardTitleBox}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.serviceType}</Text>
            <View style={styles.cardSubtitleRow}>
              <Text style={styles.cardDate}>{formatDateBR(item.date)}</Text>
              <Text style={styles.cardDot}> • </Text>
              <Text style={styles.cardKm}>{item.mileage.toLocaleString('pt-BR')} km</Text>
            </View>
          </View>
          <View style={styles.cardCostBox}>
            <Text style={styles.cardCost}>{formatCurrencyBRL(item.cost)}</Text>
          </View>
        </View>
        {hasNext && (
          <View style={styles.badgeRow}>
            <Ionicons name="calendar" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Revisão futura programada</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSubtitle}>{records.length} serviço{records.length !== 1 ? 's' : ''} registrado{records.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/add-maintenance')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <View style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>Todos</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Recentes</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Maior Custo</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.content}>
        {records.length > 0 ? (
          <FlatList
            data={records}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="document-text-outline" size={64} color="#374151" />
            </View>
            <Text style={styles.emptyText}>Nenhuma manutenção</Text>
            <Text style={styles.emptySubText}>
              Você ainda não registrou nenhum serviço para este veículo.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.push('/add-maintenance')}
            >
              <Text style={styles.emptyButtonText}>Adicionar Primeiro Serviço</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 15,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  chipsScroll: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  cardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardDot: {
    fontSize: 13,
    color: '#4B5563',
  },
  cardKm: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardCostBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  cardCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  badgeText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
