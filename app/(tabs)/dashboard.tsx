import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const VEHICLE_CARD_WIDTH = width - 48;
const VEHICLE_CARD_SPACING = 16;
const VEHICLE_CARD_STEP = VEHICLE_CARD_WIDTH + VEHICLE_CARD_SPACING;
import { useFocusEffect, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicles } from '../../src/database/repositories/vehicleRepository';
import { getMaintenanceRecords } from '../../src/database/repositories/maintenanceRepository';
import { Vehicle, MaintenanceRecord } from '../../src/types';
import { formatCurrencyBRL, formatDateBR } from '../../src/utils/formatters';
import { getHealthScore, getStatusSummary, getTotalSpent, getVehicleStatus } from '../../src/utils/maintenanceMetrics';
import { CarouselMetricCard } from '../../src/components/CarouselMetricCard';
import { VehicleCarouselCard } from '../../src/components/VehicleCarouselCard';
import { useSelectedVehicle } from '../../src/context/SelectedVehicleContext';

export default function Dashboard() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const extraBottomPadding = Platform.OS === 'ios' ? 8 : 0;
  const { selectedVehicle, setSelectedVehicle, refreshSelectedVehicle } = useSelectedVehicle();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [recordsByVehicleId, setRecordsByVehicleId] = useState<Record<number, MaintenanceRecord[]>>({});
  const [vehicleCardHeight, setVehicleCardHeight] = useState(0);
  const vehicleListRef = useRef<FlatList<Vehicle>>(null);
  const activeVehicle = selectedVehicle;

  useFocusEffect(
    useCallback(() => {
      const allVehicles = getVehicles();
      const nextRecordsByVehicleId = allVehicles.reduce<Record<number, MaintenanceRecord[]>>((acc, vehicle) => {
        acc[vehicle.id] = getMaintenanceRecords(vehicle.id);
        return acc;
      }, {});

      setVehicles(allVehicles);
      setRecordsByVehicleId(nextRecordsByVehicleId);
      refreshSelectedVehicle();

      if (activeVehicle) {
        setRecords(nextRecordsByVehicleId[activeVehicle.id] ?? []);
      } else {
        setRecords([]);
      }
    }, [activeVehicle?.id, refreshSelectedVehicle])
  );

  const handleSelectVehicle = (vehicle: Vehicle) => {
    if (vehicle.id === activeVehicle?.id) {
      router.push('/vehicle-settings');
    } else {
      setSelectedVehicle(vehicle);
      setRecords(recordsByVehicleId[vehicle.id] ?? getMaintenanceRecords(vehicle.id));
    }
  };

  const totalSpent = getTotalSpent(records);
  const statusSummary = getStatusSummary(records, activeVehicle?.currentMileage);
  const statusOverdue = statusSummary.overdue;
  const statusSoon = statusSummary.soon;
  const healthScore = getHealthScore(records, activeVehicle?.currentMileage);

  const selectVehicleFromCarouselIndex = (index: number) => {
    const vehicle = vehicles[index];

    if (!vehicle || vehicle.id === activeVehicle?.id) {
      return;
    }

    setSelectedVehicle(vehicle);
    setRecords(recordsByVehicleId[vehicle.id] ?? getMaintenanceRecords(vehicle.id));
  };

  useEffect(() => {
    const activeIndex = vehicles.findIndex((vehicle) => vehicle.id === activeVehicle?.id);

    if (activeIndex < 0) {
      return;
    }

    requestAnimationFrame(() => {
      vehicleListRef.current?.scrollToIndex({
        index: activeIndex,
        animated: true,
      });
    });
  }, [activeVehicle?.id, vehicles]);

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
                ref={vehicleListRef}
                data={vehicles}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                snapToInterval={VEHICLE_CARD_STEP}
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                  length: VEHICLE_CARD_STEP,
                  offset: VEHICLE_CARD_STEP * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / VEHICLE_CARD_STEP);
                  selectVehicleFromCarouselIndex(nextIndex);
                }}
                renderItem={({ item }) => {
                  const itemRecords = recordsByVehicleId[item.id] ?? [];
                  const itemStatusSummary = getStatusSummary(itemRecords, item.currentMileage);

                  return (
                    <View
                      style={styles.vehicleCardWrapper}
                      onLayout={
                        vehicleCardHeight > 0
                          ? undefined
                          : (event) => setVehicleCardHeight(event.nativeEvent.layout.height)
                      }
                    >
                      <VehicleCarouselCard
                        brand={item.brand}
                        model={item.model}
                        year={item.year.toString()}
                        mileage={item.currentMileage}
                        status={getVehicleStatus(itemRecords, item.currentMileage)}
                        overdueCount={itemStatusSummary.overdue}
                        soonCount={itemStatusSummary.soon}
                        healthScore={getHealthScore(itemRecords, item.currentMileage)}
                        isSelected={item.id === activeVehicle?.id}
                        onPress={() => handleSelectVehicle(item)}
                      />
                    </View>
                  );
                }}
                ListFooterComponent={
                  <View style={styles.vehicleCardWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.addVehicleCard,
                        vehicleCardHeight > 0 ? { height: vehicleCardHeight } : null,
                      ]}
                      onPress={() => router.push('/add-vehicle')}
                    >
                      <View style={styles.addVehicleIcon}>
                        <Ionicons name="add" size={36} color="#93C5FD" />
                      </View>
                      <Text style={styles.addVehicleText}>Adicionar Veículo</Text>
                      <Text style={styles.addVehicleSubText}>Carro, moto ou trabalho</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>

            <View style={styles.smartSection}>
              <View style={styles.healthCard}>
                <View style={styles.healthHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Saúde do veículo</Text>
                    <Text style={styles.healthValue}>{healthScore}/100</Text>
                  </View>
                  <View style={styles.healthIconBox}>
                    <Ionicons name="pulse" size={24} color={healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444'} />
                  </View>
                </View>
                <View style={styles.healthTrack}>
                  <View
                    style={[
                      styles.healthFill,
                      {
                        width: `${healthScore}%`,
                        backgroundColor: healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Ionicons name="warning-outline" size={22} color="#EF4444" />
                  <Text style={styles.summaryValue}>{statusOverdue}</Text>
                  <Text style={styles.summaryLabel}>Atrasadas</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Ionicons name="calendar-outline" size={22} color="#F59E0B" />
                  <Text style={styles.summaryValue}>{statusSoon}</Text>
                  <Text style={styles.summaryLabel}>Próximas</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Ionicons name="build-outline" size={22} color="#60A5FA" />
                  <Text style={styles.summaryValue}>{records.length}</Text>
                  <Text style={styles.summaryLabel}>Manutenções</Text>
                </View>
              </View>

              <View style={styles.spendingCard}>
                <View>
                  <Text style={styles.cardEyebrow}>Gastos</Text>
                  <Text style={styles.spendingPeriod}>Todo período</Text>
                </View>
                <Text style={styles.spendingValue}>{formatCurrencyBRL(totalSpent)}</Text>
              </View>
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
  smartSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: '#1F2937',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 14,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardEyebrow: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  healthValue: {
    color: '#F9FAFB',
    fontSize: 30,
    fontWeight: '900',
  },
  healthIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  healthTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 999,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 12,
    marginHorizontal: 5,
    justifyContent: 'space-between',
  },
  summaryValue: {
    color: '#F9FAFB',
    fontSize: 26,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  spendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#374151',
  },
  spendingPeriod: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '700',
  },
  spendingValue: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
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
    width: VEHICLE_CARD_WIDTH,
    marginRight: VEHICLE_CARD_SPACING,
  },
  addVehicleCard: {
    width: '100%',
    minHeight: 230,
    borderRadius: 22,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  addVehicleIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.38)',
    marginBottom: 18,
  },
  addVehicleText: {
    color: '#F9FAFB',
    fontWeight: '900',
    fontSize: 19,
  },
  addVehicleSubText: {
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 13,
  },

  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  }
});
