import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const ConfigError: React.FC<{ message?: string }> = ({ message }) => {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialIcons name="error-outline" size={64} color={colors.error} />
      <Text style={[styles.title, { color: colors.text }]}>Configuration Problem</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>The app could not find the required environment configuration for Supabase.</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message || 'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'}</Text>

      <View style={styles.instructions}>
        <Text style={[styles.instructionTitle, { color: colors.text }]}>Quick fixes</Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>• Add a .env.local file in the project root with the following keys:</Text>
        <Text style={[styles.code, { color: colors.text }]}>{'EXPO_PUBLIC_SUPABASE_URL=YOUR_URL\nEXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY'}</Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>• Restart the bundler with cache cleared:</Text>
        <Text style={[styles.code, { color: colors.text }]}>{'npx expo start -c'}</Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>• If you are using EAS, configure the variables in app.json / eas.json as extras.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  instructions: {
    marginTop: 18,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 6,
  },
  code: {
    fontFamily: 'monospace',
    marginVertical: 6,
    backgroundColor: '#111',
    padding: 8,
    borderRadius: 6,
  },
});

export default ConfigError;
