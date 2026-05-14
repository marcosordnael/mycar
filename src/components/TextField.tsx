import React from 'react';
import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export const TextField = ({ label, ...props }: TextFieldProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input}
        placeholderTextColor="#9CA3AF"
        {...props} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    color: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  }
});
