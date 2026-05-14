import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export const Button = ({ title, variant = 'primary', style, ...props }: ButtonProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'primary' ? styles.primary : styles.secondary,
        style
      ]} 
      {...props}
    >
      <Text style={[
        styles.text,
        variant === 'primary' ? styles.textPrimary : styles.textSecondary
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primary: {
    backgroundColor: '#1E3A8A', // Blue dark
  },
  secondary: {
    backgroundColor: '#374151', // Gray
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#E5E7EB',
  }
});
