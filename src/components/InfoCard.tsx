import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoCardProps {
  title: string;
  value: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badge?: React.ReactNode;
}

export const InfoCard = ({ title, value, description, style, icon, iconColor = '#3B82F6', badge }: InfoCardProps) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {icon && <Ionicons name={icon} size={24} color={iconColor} style={styles.icon} />}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        {badge && <View style={styles.badgeContainer}>{badge}</View>}
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  badgeContainer: {
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  description: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  }
});
