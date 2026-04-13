import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

/**
 * StatsCard component - Displays statistics with icon and press functionality
 * Used in dashboard to show report counts and other metrics
 */

interface StatsCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default StatsCard;
