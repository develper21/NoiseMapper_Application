import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Text } from 'react-native';

const BrandLogo = ({ size = 32 }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { borderColor: colors.primary }]}>
        <MaterialIcons name="volume-up" size={size * 0.6} color={colors.primary} />
      </View>
      <Text style={[styles.text, { color: colors.text }]}>NoiseMapper</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  soundWave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});

export default BrandLogo;