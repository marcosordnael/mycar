import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirstVehicle } from '../../src/database/repositories/vehicleRepository';
import { getMaintenanceRecords } from '../../src/database/repositories/maintenanceRepository';
import { MaintenanceRecord, Vehicle } from '../../src/types';
import { formatDateBR } from '../../src/utils/formatters';
import { getRevisionStatus, getStatusColor, getStatusLabel } from '../../src/utils/statusHelper';

export default function Upcoming() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [upcomingRecords, setUpcomingRecords] = useState<MaintenanceRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      const v = getFirstVehicle();
      if (v) {
        setVehicle(v);
        const allRecords = getMaintenanceRecords(v.id);
        
        const filtered = allRecords.filter(r => r.nextRevisionDate || r.nextRevisionMileage);

        filtered.sort((a, b) => {
          const statusA = getRevisionStatus(a.nextRevisionDate, a.nextRevisionMileage, v.currentMileage);
          const statusB = getRevisionStatus(b.nextRevisionDate, b.nextRevisionMileage, v.currentMileage);
          
          if (statusA === 'ATRASADA' && statusB !== 'ATRASADA') return -1;
          if (statusB === 'ATRASADA' && statusA !== 'ATRASADA') return 1;

          if (a.nextRevisionDate && b.nextRevisionDate) {
            return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
          }
          return 0;
        });

        setUpcomingRecords(filtered);
      }
    }, [])
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let soon = 0;
    let ok = 0;
    
    upcomingRecords.forEach(r => {
      const status = getRevisionStatus(r.nextRevisionDate, r.nextRevisionMileage, vehicle?.currentMileage);
      if (status === 'ATRASADA') overdue++;
      else if (status === 'PROXIMA') soon++;
      else ok++;
    });

    return { overdue, soon, ok };
  }, [upcomingRecords, vehicle]);

  const renderItem = ({ item }: { item: MaintenanceRecord }) => {
    const status = getRevisionStatus(item.nextRevisionDate, item.nextRevisionMileage, vehicle?.currentMileage);
    const badgeColor = getStatusColor(status);
    const badgeLabel = getStatusLabel(status);

    return (
      <TouchableOpacity onPress={() => router.push(`/maintenance/${item.id}`)} activeOpacity={0.8} style={styles.card}>
        <View style={styles.cardIndicator(badgeColor)} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.serviceType}</Text>
            <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>
          
          <View style={styles.cardDetailsRow}>
            {item.nextRevisionDate && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{formatDateBR(item.nextRevisionDate)}</Text>
              </View>
            )}
            {item.nextRevisionMileage && (
              <View style={[styles.detailItem, { marginLeft: item.nextRevisionDate ? 16 : 0 }]}>
                <Ionicons name="speedometer-outline" size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{item.nextRevisionMileage.toLocaleString('pt-BR')} km</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsRow = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statBox, { borderColor: '#EF4444' }]}>
        <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue}</Text>
        <Text style={styles.statLabel}>Atrasadas</Text>
      </View>
      <View style={[styles.statBox, { borderColor: '#F59E0B' }]}>
        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.soon}</Text>
        <Text style={styles.statLabel}>Próximas</Text>
      </View>
      <View style={[styles.statBox, { borderColor: '#10B981' }]}>
        <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.ok}</Text>
        <Text style={styles.statLabel}>Em dia</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Previsões</Text>
        <Text style={styles.headerSubtitle}>Controle de manutenções futuras</Text>
      </View>

      <View style={styles.content}>
        
        {upcomingRecords.length > 0 && renderStatsRow()}
        
        {upcomingRecords.length > 0 ? (
          <FlatList
            data={upcomingRecords}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="calendar-clear-outline" size={64} color="#374151" />
            </View>
            <Text style={styles.emptyText}>Nenhuma previsão</Text>
            <Text style={styles.emptySubText}>
              Ao cadastrar uma manutenção, informe data ou quilometragem para agendar visitas futuras.
            </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  cardIndicator: (color: string) => ({
    width: 6,
    backgroundColor: color,
  }),
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
    lineHeight: 22,
    paddingHorizontal: 20,
  }
});
