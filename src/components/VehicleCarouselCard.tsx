import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RevisionStatus, getStatusColor } from '../utils/statusHelper';

interface VehicleCarouselCardProps {
  brand: string;
  model: string;
  year: string | number;
  mileage?: number;
  status: RevisionStatus;
  overdueCount: number;
  soonCount: number;
  healthScore: number;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const getStatusText = (status: RevisionStatus, overdueCount: number, soonCount: number): string => {
  if (status === 'ATRASADA') {
    return `${overdueCount} revisão${overdueCount === 1 ? '' : 'ões'} atrasada${overdueCount === 1 ? '' : 's'}`;
  }

  if (status === 'PROXIMA') {
    return `${soonCount} revisão${soonCount === 1 ? '' : 'ões'} próxima${soonCount === 1 ? '' : 's'}`;
  }

  if (status === 'EM_DIA') {
    return 'Em dia';
  }

  return 'Sem previsões';
};

const getStatusIcon = (status: RevisionStatus): keyof typeof Ionicons.glyphMap => {
  if (status === 'ATRASADA') return 'warning';
  if (status === 'PROXIMA') return 'alert-circle';
  if (status === 'EM_DIA') return 'checkmark-circle';

  return 'ellipse';
};

export const VehicleCarouselCard = ({
  brand,
  model,
  year,
  mileage,
  status,
  overdueCount,
  soonCount,
  healthScore,
  isSelected = false,
  onPress,
  style,
}: VehicleCarouselCardProps) => {
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status, overdueCount, soonCount);
  const mileageText = mileage !== undefined ? `${mileage.toLocaleString('pt-BR')} km` : '--';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[isSelected && styles.selectedShadow, style]}>
      <LinearGradient
        colors={isSelected ? ['#1E3A8A', '#172554'] : ['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isSelected ? styles.selectedCard : styles.idleCard]}
      >
        <View style={styles.topRow}>
          <View style={styles.vehicleIcon}>
            <Ionicons name="car-sport" size={26} color={isSelected ? '#BFDBFE' : '#60A5FA'} />
          </View>

          <View style={[styles.healthBadge, { borderColor: `${statusColor}66` }]}>
            <Ionicons name="pulse" size={13} color={statusColor} />
            <Text style={[styles.healthText, { color: statusColor }]}>{healthScore}</Text>
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.brand} numberOfLines={1}>{brand}</Text>
          <Text style={styles.model} numberOfLines={2}>{model}</Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Ano</Text>
            <Text style={styles.detailValue}>{year}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Km atual</Text>
            <Text style={styles.detailValue}>{mileageText}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}55` }]}>
          <Ionicons name={getStatusIcon(status)} size={15} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
            {statusText}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Ativo</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectedShadow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    minHeight: 230,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#60A5FA',
  },
  idleCard: {
    borderColor: '#374151',
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  healthText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 5,
  },
  identity: {
    minHeight: 58,
    marginBottom: 18,
  },
  brand: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  model: {
    color: '#F9FAFB',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  detailBlock: {
    flex: 1,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  selectedBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  selectedBadgeText: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
