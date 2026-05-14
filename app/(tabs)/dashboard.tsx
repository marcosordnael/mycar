import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
import { useFocusEffect, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicles } from '../../src/database/repositories/vehicleRepository';
import { getSelectedVehicleId, setSelectedVehicleId } from '../../src/database/repositories/settingsRepository';
import { getMaintenanceRecords } from '../../src/database/repositories/maintenanceRepository';
import { Vehicle, MaintenanceRecord } from '../../src/types';
import { formatCurrencyBRL, formatDateBR } from '../../src/utils/formatters';
import { getRevisionStatus } from '../../src/utils/statusHelper';
import { GradientCard } from '../../src/components/GradientCard';
import { CarouselMetricCard } from '../../src/components/CarouselMetricCard';

export default function Dashboard() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const extraBottomPadding = Platform.OS === 'ios' ? 8 : 0;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicleCardHeight, setVehicleCardHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const allVehicles = getVehicles();
      setVehicles(allVehicles);

      if (allVehicles.length > 0) {
        let selectedId = getSelectedVehicleId();
        if (!selectedId || !allVehicles.find(v => v.id === selectedId)) {
          selectedId = allVehicles[0].id;
          setSelectedVehicleId(selectedId);
        }
        setActiveVehicleId(selectedId);
        const maintRecords = getMaintenanceRecords(selectedId);
        setRecords(maintRecords);
      } else {
        setActiveVehicleId(null);
        setRecords([]);
      }
    }, [])
  );

  const handleSelectVehicle = (id: number) => {
    if (id === activeVehicleId) {
      router.push('/vehicle-settings');
    } else {
      setSelectedVehicleId(id);
      
      const parsedVehicles = getVehicles();
      setVehicles(parsedVehicles);
      setActiveVehicleId(id);
      setRecords(getMaintenanceRecords(id));
    }
  };

  const totalSpent = records.reduce((acc, curr) => acc + curr.cost, 0);
  const lastMaintenance = records.length > 0 ? records[0] : null;
  
  // Status check for alerts
  const upcomingRecords = records.filter(r => r.nextRevisionDate || r.nextRevisionMileage);
  let statusOverdue = 0;
  let statusSoon = 0;
  let statusOk = 0;
  let nextMaintenance: MaintenanceRecord | null = null;
  
  upcomingRecords.forEach(r => {
    const status = getRevisionStatus(r.nextRevisionDate, r.nextRevisionMileage, activeVehicle?.currentMileage);
    if (status === 'ATRASADA') statusOverdue++;
    else if (status === 'PROXIMA') statusSoon++;
    else if (status === 'EM_DIA') statusOk++;
  });

  // Sort upcoming for displaying the "next" properly
  const sortedUpcoming = [...upcomingRecords].sort((a, b) => {
     const statusA = getRevisionStatus(a.nextRevisionDate, a.nextRevisionMileage, activeVehicle?.currentMileage);
     const statusB = getRevisionStatus(b.nextRevisionDate, b.nextRevisionMileage, activeVehicle?.currentMileage);
     if (statusA === 'ATRASADA' && statusB !== 'ATRASADA') return -1;
     if (statusB === 'ATRASADA' && statusA !== 'ATRASADA') return 1;
     if (a.nextRevisionDate && b.nextRevisionDate) {
       return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
     }
     return 0;
  });
  if (sortedUpcoming.length > 0) nextMaintenance = sortedUpcoming[0];

  const renderCarousel = () => {
    const data = [
      { id: '1', title: 'Total Gasto', value: formatCurrencyBRL(totalSpent), subtitle: 'Histórico', icon: 'cash-outline', color: '#10B981' },
      { id: '2', title: 'Serviços', value: records.length.toString(), subtitle: 'Registrados', icon: 'build-outline', color: '#8B5CF6' },
      { id: '3', title: 'Atrasadas', value: statusOverdue.toString(), subtitle: 'Revisões', icon: 'warning-outline', color: '#EF4444' },
      { id: '4', title: 'Próximas', value: statusSoon.toString(), subtitle: 'Revisões', icon: 'calendar-outline', color: '#F59E0B' },
    ];
    return (
      <View style={styles.carouselContainer}>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CarouselMetricCard
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon as any}
              color={item.color}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + extraBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Motorista</Text>
            <Text style={styles.title}>Meu Carro em Dia</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/vehicle-settings')} style={styles.settingsBtn}>
            <Ionicons name="options-outline" size={24} color="#F9FAFB" />
          </TouchableOpacity>
        </View>

        {activeVehicle ? (
          <View style={styles.contentSection}>
            
            <View style={{ marginBottom: 32 }}>
              <FlatList
                data={vehicles}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                snapToInterval={width - 48 + 16}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <View
                    style={styles.vehicleCardWrapper}
                    onLayout={
                      vehicleCardHeight > 0
                        ? undefined
                        : (event) => setVehicleCardHeight(event.nativeEvent.layout.height)
                    }
                  >
                    <GradientCard
                      brand={item.brand}
                      model={item.model}
                      plate={item.plate}
                      year={item.year.toString()}
                      mileage={item.currentMileage}
                      showSelectedBadge={item.id === activeVehicleId}
                      onPress={() => handleSelectVehicle(item.id)}
                    />
                  </View>
                )}
                ListFooterComponent={
                  <View style={styles.vehicleCardWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.addVehicleCard,
                        vehicleCardHeight > 0 ? { height: vehicleCardHeight } : null,
                      ]}
                      onPress={() => router.push('/add-vehicle')}
                    >
                      <Ionicons name="add-circle-outline" size={48} color="#3B82F6" />
                      <Text style={styles.addVehicleText}>Adicionar Veículo</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>

            {/* ALERT BLOCK (Resumo Inteligente) */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              {statusOverdue > 0 ? (
                <View style={[styles.alertCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                  <View style={[styles.alertIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Ionicons name="warning" size={24} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: '#EF4444' }]}>Atenção Imediata!</Text>
                    <Text style={styles.alertText}>Você possui {statusOverdue} revisão(ões) atrasada(s).</Text>
                  </View>
                </View>
              ) : statusSoon > 0 ? (
                <View style={[styles.alertCard, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <View style={[styles.alertIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: '#F59E0B' }]}>Fique de Olho</Text>
                    <Text style={styles.alertText}>Você tem {statusSoon} revisão(ões) para os próximos dias.</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.alertCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={[styles.alertIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: '#10B981' }]}>Tudo em ordem!</Text>
                    <Text style={styles.alertText}>Seu veículo está com as manutenções regulares.</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Visão Geral</Text>
              {renderCarousel()}
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Últimos Serviços</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/maintenances')}>
                  <Text style={styles.seeAll}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              {records.slice(0, 3).map((record) => (
                <TouchableOpacity 
                  key={record.id} 
                  style={styles.recentCard}
                  onPress={() => router.push(`/maintenance/${record.id}`)}
                >
                  <View style={styles.recentIconBox}>
                    <Ionicons name="build" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentType} numberOfLines={1}>{record.serviceType}</Text>
                    <Text style={styles.recentDate}>{formatDateBR(record.date)}</Text>
                  </View>
                  <View style={styles.recentCostBox}>
                    <Text style={styles.recentCost}>{formatCurrencyBRL(record.cost)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {records.length === 0 && (
                <View style={styles.emptyRecent}>
                  <Ionicons name="receipt-outline" size={48} color="#374151" />
                  <Text style={styles.emptyText}>Nenhuma manutenção registrada.</Text>
                </View>
              )}
            </View>
            
          </View>
        ) : (
          <View style={styles.emptyRecent}>
            <Ionicons name="car-sport-outline" size={48} color="#374151" />
            <Text style={styles.emptyText}>Nenhum veículo encontrado.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19', // Fundo mais profundo
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  contentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  carouselContainer: {
    marginBottom: 8,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  recentCostBox: {
    alignItems: 'flex-end',
  },
  recentCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyRecent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },

  vehicleCardWrapper: {
    width: width - 48,
    marginRight: 16,
  },
  addVehicleCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 12,
    fontSize: 16,
  },

  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  }
});
