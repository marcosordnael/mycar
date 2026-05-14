import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CarouselMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

export const CarouselMetricCard = ({ 
  title, value, subtitle, icon, color = '#3B82F6', style 
}: CarouselMetricCardProps) => {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: CARD_WIDTH,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  }
});