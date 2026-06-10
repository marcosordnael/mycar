import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Animated, View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Platform, PanResponder } from 'react-native';

const { width } = Dimensions.get('window');
const VEHICLE_CARD_WIDTH = width - 48;
const VEHICLE_CARD_SPACING = 16;
const VEHICLE_CARD_STEP = VEHICLE_CARD_WIDTH + VEHICLE_CARD_SPACING;
const REORDER_CARD_WIDTH = 176;
const REORDER_CARD_SPACING = 12;
const REORDER_CARD_STEP = REORDER_CARD_WIDTH + REORDER_CARD_SPACING;
const REORDER_OVERLAP_THRESHOLD = REORDER_CARD_SPACING + 4;
import { useFocusEffect, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicles, updateVehicleOrder } from '../../src/database/repositories/vehicleRepository';
import { getMaintenanceRecords } from '../../src/database/repositories/maintenanceRepository';
import { Vehicle, MaintenanceRecord } from '../../src/types';
import { formatCurrencyBRL, formatDateBR } from '../../src/utils/formatters';
import { getHealthScore, getStatusSummary, getTotalSpent, getVehicleStatus } from '../../src/utils/maintenanceMetrics';
import { ALL_TIME, CURRENT_YEAR, calculateExpenses, filterByPeriod, FinancePeriod } from '../../src/utils/financeFilters';
import { CarouselMetricCard } from '../../src/components/CarouselMetricCard';
import { PeriodFilter } from '../../src/components/PeriodFilter';
import { VehicleCarouselCard } from '../../src/components/VehicleCarouselCard';
import { useSelectedVehicle } from '../../src/context/SelectedVehicleContext';

interface VehicleCarouselItemProps {
  vehicle: Vehicle;
  records: MaintenanceRecord[];
  isSelected: boolean;
  height: number;
  onLayoutHeight: (height: number) => void;
  onPress: () => void;
}

const VehicleCarouselItem = ({
  vehicle,
  records,
  isSelected,
  height,
  onLayoutHeight,
  onPress,
}: VehicleCarouselItemProps) => {
  const statusSummary = getStatusSummary(records, vehicle.currentMileage);

  return (
    <View
      style={styles.vehicleCardWrapper}
      onLayout={
        height > 0
          ? undefined
          : (event) => onLayoutHeight(event.nativeEvent.layout.height)
      }
    >
      <VehicleCarouselCard
        brand={vehicle.brand}
        model={vehicle.model}
        year={vehicle.year.toString()}
        mileage={vehicle.currentMileage}
        status={getVehicleStatus(records, vehicle.currentMileage)}
        overdueCount={statusSummary.overdue}
        soonCount={statusSummary.soon}
        healthScore={getHealthScore(records, vehicle.currentMileage)}
        isSelected={isSelected}
        onPress={onPress}
      />
    </View>
  );
};

interface ReorderVehicleItemProps {
  vehicle: Vehicle;
  index: number;
  dragFromIndex: number | null;
  hoverIndex: number | null;
  maxIndex: number;
  isSelected: boolean;
  isDragging: boolean;
  onLongPress: () => void;
  onDragMove: (toIndex: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
}

const ReorderVehicleItem = ({
  vehicle,
  index,
  dragFromIndex,
  hoverIndex,
  maxIndex,
  isSelected,
  isDragging,
  onLongPress,
  onDragMove,
  onDragEnd,
}: ReorderVehicleItemProps) => {
  const dragX = useRef(new Animated.Value(0)).current;
  const shiftX = useRef(new Animated.Value(0)).current;
  const lastTargetIndexRef = useRef(index);

  useEffect(() => {
    if (!isDragging) {
      dragX.setValue(0);
    }
  }, [dragX, isDragging]);

  const getShiftX = (): number => {
    if (dragFromIndex === null || hoverIndex === null || isDragging) {
      return 0;
    }

    if (dragFromIndex < hoverIndex && index > dragFromIndex && index <= hoverIndex) {
      return -REORDER_CARD_STEP;
    }

    if (dragFromIndex > hoverIndex && index < dragFromIndex && index >= hoverIndex) {
      return REORDER_CARD_STEP;
    }

    return 0;
  };

  useEffect(() => {
    Animated.spring(shiftX, {
      toValue: getShiftX(),
      speed: 22,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [dragFromIndex, hoverIndex, index, isDragging, shiftX]);

  const getTargetIndexFromDrag = useCallback((dx: number): number => {
    if (dx > REORDER_OVERLAP_THRESHOLD) {
      const crossedCards = Math.floor((dx - REORDER_OVERLAP_THRESHOLD) / REORDER_CARD_STEP) + 1;
      return Math.min(maxIndex, index + crossedCards);
    }

    if (dx < -REORDER_OVERLAP_THRESHOLD) {
      const crossedCards = Math.floor((-dx - REORDER_OVERLAP_THRESHOLD) / REORDER_CARD_STEP) + 1;
      return Math.max(0, index - crossedCards);
    }

    return index;
  }, [index, maxIndex]);

  const shouldClaimHorizontalDrag = useCallback((dx: number, dy: number): boolean => {
    return isDragging && Math.abs(dx) > 2 && Math.abs(dx) > Math.abs(dy);
  }, [isDragging]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => isDragging,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return shouldClaimHorizontalDrag(gestureState.dx, gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return shouldClaimHorizontalDrag(gestureState.dx, gestureState.dy);
      },
      onPanResponderGrant: () => {
        lastTargetIndexRef.current = hoverIndex ?? index;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextIndex = getTargetIndexFromDrag(gestureState.dx);
        lastTargetIndexRef.current = nextIndex;
        onDragMove(nextIndex);
        dragX.setValue(gestureState.dx);
      },
      onPanResponderRelease: () => {
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        onDragEnd(index, lastTargetIndexRef.current);
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        onDragEnd(index, index);
      },
      onShouldBlockNativeResponder: () => isDragging,
    }),
    [dragX, getTargetIndexFromDrag, hoverIndex, index, isDragging, onDragEnd, onDragMove, shouldClaimHorizontalDrag]
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.reorderMiniWrapper,
        isDragging && styles.reorderMiniWrapperDragging,
        !isDragging && { transform: [{ translateX: shiftX }] },
        isDragging && { transform: [{ translateX: dragX }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        delayLongPress={180}
        onLongPress={onLongPress}
        style={[styles.reorderMiniCard, isSelected && styles.reorderMiniCardSelected]}
      >
        <View style={styles.reorderMiniTopRow}>
          <View style={styles.reorderMiniIndex}>
            <Text style={styles.reorderMiniIndexText}>{index + 1}</Text>
          </View>
          <Ionicons name="reorder-three" size={20} color="#93C5FD" />
        </View>
        <Text style={styles.reorderMiniBrand} numberOfLines={1}>{vehicle.brand}</Text>
        <Text style={styles.reorderMiniModel} numberOfLines={2}>{vehicle.model}</Text>
        <Text style={styles.reorderMiniKm} numberOfLines={1}>
          {vehicle.currentMileage !== undefined ? `${vehicle.currentMileage.toLocaleString('pt-BR')} km` : '--'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const extraBottomPadding = Platform.OS === 'ios' ? 8 : 0;
  const { selectedVehicle, setSelectedVehicle, refreshSelectedVehicle } = useSelectedVehicle();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [recordsByVehicleId, setRecordsByVehicleId] = useState<Record<number, MaintenanceRecord[]>>({});
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>(ALL_TIME);
  const [vehicleCardHeight, setVehicleCardHeight] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggingReorderVehicleId, setDraggingReorderVehicleId] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const vehicleListRef = useRef<FlatList<Vehicle>>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const activeVehicle = selectedVehicle;

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    if (!isReorderMode) {
      setDraggingReorderVehicleId(null);
      setDragFromIndex(null);
      setHoverIndex(null);
    }
  }, [isReorderMode]);

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
    if (isReorderMode) {
      return;
    }

    if (vehicle.id === activeVehicle?.id) {
      router.push('/vehicle-settings');
    } else {
      setSelectedVehicle(vehicle);
      setRecords(recordsByVehicleId[vehicle.id] ?? getMaintenanceRecords(vehicle.id));
    }
  };

  const filteredFinanceRecords = filterByPeriod(records, financePeriod);
  const expenseSummary = calculateExpenses(filteredFinanceRecords);
  const totalSpent = getTotalSpent(filteredFinanceRecords);
  const statusSummary = getStatusSummary(records, activeVehicle?.currentMileage);
  const statusOverdue = statusSummary.overdue;
  const statusSoon = statusSummary.soon;
  const healthScore = getHealthScore(records, activeVehicle?.currentMileage);
  const healthColor = healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444';
  const healthLabel = healthScore >= 80 ? 'Em ótima condição' : healthScore >= 60 ? 'Atenção preventiva' : 'Precisa de cuidado';

  const getFinancePeriodLabel = (period: FinancePeriod): string => {
    if (period === ALL_TIME) return 'Todo período';
    if (period === CURRENT_YEAR) return 'Ano atual';

    return 'Mês atual';
  };

  const selectVehicleFromCarouselIndex = (index: number) => {
    if (isReorderMode) {
      return;
    }

    const vehicle = vehicles[index];

    if (!vehicle || vehicle.id === activeVehicle?.id) {
      return;
    }

    setSelectedVehicle(vehicle);
    setRecords(recordsByVehicleId[vehicle.id] ?? getMaintenanceRecords(vehicle.id));
  };

  const moveVehicle = (fromIndex: number, toIndex: number, shouldPersist = true, shouldScroll = true): boolean => {
    const currentVehicles = vehiclesRef.current;
    const nextIndex = Math.max(0, Math.min(currentVehicles.length - 1, toIndex));

    if (fromIndex === nextIndex) {
      return false;
    }

    const reorderedVehicles = [...currentVehicles];
    const [movedVehicle] = reorderedVehicles.splice(fromIndex, 1);
    reorderedVehicles.splice(nextIndex, 0, movedVehicle);
    setVehicles(reorderedVehicles);
    vehiclesRef.current = reorderedVehicles;

    if (shouldPersist) {
      updateVehicleOrder(reorderedVehicles);
    }

    if (shouldScroll) {
      requestAnimationFrame(() => {
        vehicleListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      });
    }

    return true;
  };

  const updateHoverIndex = (toIndex: number) => {
    const nextIndex = Math.max(0, Math.min(vehiclesRef.current.length - 1, toIndex));
    setHoverIndex(nextIndex);
  };

  const finishVehicleDrag = (fromIndex: number, toIndex: number) => {
    setDraggingReorderVehicleId(null);
    setDragFromIndex(null);
    setHoverIndex(null);
    moveVehicle(fromIndex, toIndex, true, true);
  };

  useEffect(() => {
    if (isReorderMode) {
      return;
    }

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
  }, [activeVehicle?.id, isReorderMode, vehicles]);

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
          contentContainerStyle={styles.metricsCarouselContent}
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
          <TouchableOpacity
            onPress={() => setIsReorderMode((currentValue) => !currentValue)}
            style={[styles.settingsBtn, isReorderMode && styles.settingsBtnActive]}
          >
            <Ionicons name={isReorderMode ? 'checkmark' : 'reorder-three-outline'} size={24} color="#F9FAFB" />
          </TouchableOpacity>
        </View>

        {activeVehicle ? (
          <View style={styles.contentSection}>
            {isReorderMode && (
              <View style={styles.reorderBanner}>
                <Ionicons name="hand-left-outline" size={18} color="#93C5FD" />
                <Text style={styles.reorderBannerText}>Role, toque e segure um card, depois arraste para a posição desejada</Text>
              </View>
            )}

            <View style={{ marginBottom: 32 }}>
              <FlatList
                ref={vehicleListRef}
                data={vehicles}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={!draggingReorderVehicleId}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                snapToInterval={isReorderMode ? REORDER_CARD_STEP : VEHICLE_CARD_STEP}
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                  length: isReorderMode ? REORDER_CARD_STEP : VEHICLE_CARD_STEP,
                  offset: (isReorderMode ? REORDER_CARD_STEP : VEHICLE_CARD_STEP) * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  if (isReorderMode) {
                    return;
                  }
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / VEHICLE_CARD_STEP);
                  selectVehicleFromCarouselIndex(nextIndex);
                }}
                renderItem={({ item, index }) => {
                  const itemRecords = recordsByVehicleId[item.id] ?? [];

                  if (isReorderMode) {
                    return (
                      <ReorderVehicleItem
                        vehicle={item}
                        index={index}
                        dragFromIndex={dragFromIndex}
                        hoverIndex={hoverIndex}
                        maxIndex={vehicles.length - 1}
                        isSelected={item.id === activeVehicle?.id}
                        isDragging={draggingReorderVehicleId === item.id}
                        onLongPress={() => {
                          setDraggingReorderVehicleId(item.id);
                          setDragFromIndex(index);
                          setHoverIndex(index);
                        }}
                        onDragMove={updateHoverIndex}
                        onDragEnd={finishVehicleDrag}
                      />
                    );
                  }

                  return (
                    <VehicleCarouselItem
                      vehicle={item}
                      records={itemRecords}
                      isSelected={item.id === activeVehicle?.id}
                      height={vehicleCardHeight}
                      onLayoutHeight={setVehicleCardHeight}
                      onPress={() => handleSelectVehicle(item)}
                    />
                  );
                }}
                ListFooterComponent={!isReorderMode ? (
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
                ) : null}
              />
            </View>

            <View style={styles.smartSection}>
              <View style={styles.healthCard}>
                <View style={[styles.healthAccent, { backgroundColor: healthColor }]} />
                <View style={styles.healthHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Saúde do veículo</Text>
                    <View style={styles.healthValueRow}>
                      <Text style={styles.healthValue}>{healthScore}</Text>
                      <Text style={styles.healthMax}>/100</Text>
                    </View>
                    <Text style={[styles.healthStatusText, { color: healthColor }]}>{healthLabel}</Text>
                  </View>
                  <View style={[styles.healthIconBox, { borderColor: `${healthColor}55`, backgroundColor: `${healthColor}18` }]}>
                    <Ionicons name="pulse" size={24} color={healthColor} />
                  </View>
                </View>
                <View style={styles.healthTrack}>
                  <View
                    style={[
                      styles.healthFill,
                      {
                        width: `${healthScore}%`,
                        backgroundColor: healthColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.healthLegendRow}>
                  <Text style={styles.healthLegendText}>{statusOverdue} atrasada(s)</Text>
                  <Text style={styles.healthLegendText}>{statusSoon} próxima(s)</Text>
                </View>
              </View>

              <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Visão Geral</Text>
                {renderCarousel()}
              </View>

              <View style={styles.financialCard}>
                <View style={styles.financialHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Resumo financeiro</Text>
                    <Text style={styles.spendingPeriod}>Período: {getFinancePeriodLabel(financePeriod)}</Text>
                  </View>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                </View>

                <PeriodFilter
                  value={financePeriod}
                  onChange={setFinancePeriod}
                  style={styles.periodFilter}
                />

                <View style={styles.financialTotalRow}>
                  <Text style={styles.financialLabel}>Total gasto</Text>
                  <Text style={styles.spendingValue}>{formatCurrencyBRL(expenseSummary.total)}</Text>
                </View>

                <View style={styles.financialStatsGrid}>
                  <View style={styles.financialStatBox}>
                    <Text style={styles.financialStatValue}>{expenseSummary.count}</Text>
                    <Text style={styles.financialStatLabel}>Manutenções</Text>
                  </View>
                  <View style={styles.financialStatBox}>
                    <Text style={styles.financialStatValue}>{formatCurrencyBRL(expenseSummary.average)}</Text>
                    <Text style={styles.financialStatLabel}>Média</Text>
                  </View>
                </View>
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
  settingsBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  contentSection: {
    flex: 1,
  },
  reorderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  reorderBannerText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
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
  metricsCarouselContent: {
    paddingRight: 2,
  },
  smartSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: '#172033',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#31415F',
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  healthAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  healthValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  healthValue: {
    color: '#F9FAFB',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  healthMax: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    marginLeft: 2,
  },
  healthStatusText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  healthIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  healthTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#111827',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  healthFill: {
    height: '100%',
    borderRadius: 999,
  },
  healthLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  healthLegendText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  overviewSection: {
    marginBottom: 22,
  },
  financialCard: {
    backgroundColor: '#1F2937',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#374151',
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodFilter: {
    marginBottom: 18,
  },
  financialTotalRow: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  financialLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  financialStatsGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  financialStatBox: {
    flex: 1,
    minHeight: 76,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
  },
  financialStatValue: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '900',
  },
  financialStatLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  spendingPeriod: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '700',
  },
  spendingValue: {
    color: '#10B981',
    fontSize: 19,
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
  reorderMiniWrapper: {
    width: REORDER_CARD_WIDTH,
    marginRight: REORDER_CARD_SPACING,
  },
  reorderMiniWrapperDragging: {
    zIndex: 5,
    elevation: 12,
  },
  reorderMiniCard: {
    minHeight: 148,
    backgroundColor: '#1F2937',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    justifyContent: 'space-between',
  },
  reorderMiniCardSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#172033',
  },
  reorderMiniTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorderMiniIndex: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  reorderMiniIndexText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '900',
  },
  reorderMiniBrand: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 14,
  },
  reorderMiniModel: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    minHeight: 40,
  },
  reorderMiniKm: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
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
