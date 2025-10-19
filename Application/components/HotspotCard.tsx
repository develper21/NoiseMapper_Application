import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Report } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { noiseUtils, dateUtils } from '../lib/utils';

/**
 * HotspotCard component - Displays a noise report in card format
 * Shows noise level, type, location, and timestamp
 */

interface HotspotCardProps {
  report: Report;
  style?: any;
  onPress?: () => void;
}

const HotspotCard: React.FC<HotspotCardProps> = ({ report, style, onPress }) => {
  const { colors } = useTheme();

  const noiseLevel = noiseUtils.getNoiseLevel(report.noise_db);
  const noiseColor = noiseUtils.getNoiseColor(report.noise_db);
  const healthRisk = noiseUtils.getHealthRisk(report.noise_db);

  const getNoiseTypeIcon = (type: Report['noise_type']) => {
    switch (type) {
      case 'traffic': return 'directions-car';
      case 'construction': return 'construction';
      case 'events': return 'event';
      case 'industrial': return 'factory';
      default: return 'help-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with noise level and type */}
      <View style={styles.header}>
        <View style={styles.noiseLevelContainer}>
          <View style={[styles.noiseIndicator, { backgroundColor: noiseColor }]} />
          <Text style={[styles.noiseLevel, { color: noiseColor }]}>
            {noiseUtils.formatDb(report.noise_db)}
          </Text>
        </View>
        <View style={[styles.noiseTypeBadge, { backgroundColor: noiseColor + '20' }]}>
          <MaterialIcons
            name={getNoiseTypeIcon(report.noise_type)}
            size={16}
            color={noiseColor}
          />
          <Text style={[styles.noiseTypeText, { color: noiseColor }]}>
            {report.noise_type}
          </Text>
        </View>
      </View>

      {/* Description */}
      {report.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {report.description.length > 100
            ? `${report.description.substring(0, 100)}...`
            : report.description}
        </Text>
      )}

      {/* Health risk */}
      <Text style={[styles.healthRisk, { color: colors.textSecondary }]}>
        {healthRisk}
      </Text>

      {/* Footer with timestamp and anonymous indicator */}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, { color: colors.textDisabled }]}>
          {dateUtils.getTimeAgo(new Date(report.timestamp))}
        </Text>
        {report.is_anonymous && (
          <View style={styles.anonymousBadge}>
            <Text style={[styles.anonymousText, { color: colors.textSecondary }]}>
              Anonymous
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noiseLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noiseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noiseLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noiseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  noiseTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  healthRisk: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  anonymousBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  anonymousText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default HotspotCard;
