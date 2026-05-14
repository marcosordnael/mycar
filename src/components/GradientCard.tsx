import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
  brand: string;
  model: string;
  plate: string;
  year: string | number;
  mileage?: number;
  showSelectedBadge?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const GradientCard = ({ 
  brand, model, plate, year, mileage, showSelectedBadge = false, onPress, style 
}: GradientCardProps) => {
  const content = (
    <LinearGradient
      colors={['#1E3A8A', '#312E81']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeftColumn}>
          <Text style={styles.brand} numberOfLines={1}>{brand}</Text>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport" size={32} color="#60A5FA" />
          </View>
        </View>
        {showSelectedBadge && (
          <View style={styles.headerRightColumn}>
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.selectedBadgeText}>Selecionado</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.model} numberOfLines={2}>{model}</Text>
      
      <View style={styles.footer}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Placa</Text>
          <Text style={styles.value}>{plate}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Ano</Text>
          <Text style={styles.value}>{year}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Km Atual</Text>
          <Text style={styles.value}>{mileage ? `${mileage.toLocaleString('pt-BR')} km` : '--'}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    fontSize: 16,
    color: '#93C5FD',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  headerRightColumn: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  model: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 30,
  },
  iconContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexShrink: 0,
  },
  selectedBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  selectedBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoBlock: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: '#93C5FD',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  }
});
