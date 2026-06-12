import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SelectOption } from './SelectField';

interface AutocompleteFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  options: SelectOption[];
  onChangeText: (value: string) => void;
  onSelect: (value: string, label: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
}

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function AutocompleteField({
  label,
  value,
  options,
  onChangeText,
  onSelect,
  isLoading = false,
  disabled = false,
  emptyMessage = 'Nenhuma opção encontrada',
  placeholder,
  ...props
}: AutocompleteFieldProps) {
  const [focused, setFocused] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = normalizeSearch(value);

    if (!query) {
      return [];
    }

    return options
      .filter((option) => normalizeSearch(option.label).includes(query))
      .sort((a, b) => {
        const aLabel = normalizeSearch(a.label);
        const bLabel = normalizeSearch(b.label);
        const aStarts = aLabel.startsWith(query);
        const bStarts = bLabel.startsWith(query);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.label.localeCompare(b.label);
      })
      .slice(0, 8);
  }, [options, value]);

  const showSuggestions = focused && !disabled && value.trim().length > 0;

  const handleSelect = (option: SelectOption) => {
    onSelect(option.value, option.label);
    setFocused(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputContainer, focused && styles.inputFocused, disabled && styles.inputDisabled]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled && !isLoading}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          onFocus={() => setFocused(true)}
          autoCorrect={false}
          {...props}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <Ionicons name="search" size={18} color="#6B7280" />
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestions}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.option}
                activeOpacity={0.75}
                onPress={() => handleSelect(option)}
              >
                <Text style={styles.optionText} numberOfLines={1}>{option.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: '#3B82F6',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 10,
  },
  suggestions: {
    marginTop: 6,
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.55)',
  },
  optionText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
