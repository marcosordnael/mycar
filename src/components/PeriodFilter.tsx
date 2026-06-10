import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ALL_TIME, CURRENT_MONTH, CURRENT_YEAR, FinancePeriod } from '../utils/financeFilters';

interface PeriodFilterProps {
  value: FinancePeriod;
  onChange: (period: FinancePeriod) => void;
  style?: StyleProp<ViewStyle>;
}

const OPTIONS: Array<{ label: string; value: FinancePeriod }> = [
  { label: 'Mês', value: CURRENT_MONTH },
  { label: 'Ano', value: CURRENT_YEAR },
  { label: 'Todo', value: ALL_TIME },
];

export const PeriodFilter = ({ value, onChange, style }: PeriodFilterProps) => {
  return (
    <View style={[styles.container, style]}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.86}
            onPress={() => onChange(option.value)}
            style={[styles.option, isActive && styles.optionActive]}
          >
            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  option: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  optionText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
});
