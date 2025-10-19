import { useColorScheme } from 'react-native';
import { useAppStore } from '../lib/store';

/**
 * Custom hook for theme management
 * Provides consistent color scheme across the app with dark/light mode support
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI elements
  border: string;
  divider: string;
  shadow: string;

  // Noise level specific colors
  noiseLow: string;
  noiseModerate: string;
  noiseHigh: string;
}

// Light theme colors
const lightColors: ThemeColors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceVariant: '#F3F4F6',

  text: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E5E7EB',
  divider: '#E5E7EB',
  shadow: 'rgba(0, 0, 0, 0.1)',

  noiseLow: '#10B981',
  noiseModerate: '#F59E0B',
  noiseHigh: '#EF4444',
};

// Dark theme colors
const darkColors: ThemeColors = {
  primary: '#34D399',
  primaryDark: '#10B981',
  primaryLight: '#6EE7B7',

  background: '#111827',
  surface: '#1F2937',
  surfaceVariant: '#374151',

  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textDisabled: '#9CA3AF',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  border: '#374151',
  divider: '#374151',
  shadow: 'rgba(0, 0, 0, 0.3)',

  noiseLow: '#34D399',
  noiseModerate: '#FBBF24',
  noiseHigh: '#F87171',
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const { settings } = useAppStore();

  // Determine theme based on system preference and user setting
  const theme = settings.theme === 'auto' ? colorScheme || 'light' : settings.theme;

  const colors = theme === 'dark' ? darkColors : lightColors;

  return {
    theme,
    colors,
    isDark: theme === 'dark',
  };
};
