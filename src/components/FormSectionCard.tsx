import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormSectionCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const FormSectionCard = ({ title, icon, children, style }: FormSectionCardProps) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {icon && <Ionicons name={icon} size={20} color="#3B82F6" style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  content: {
    padding: 20,
  }
});