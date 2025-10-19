import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../lib/store';
import { NOISE_TYPES } from '../constants/Config';

/**
 * MapFilters component - Modal with filters for the map view
 * Allows users to filter reports by noise type and dB range
 */

interface MapFiltersProps {
  onClose: () => void;
}

const MapFilters: React.FC<MapFiltersProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { mapFilters, setMapFilters, resetMapFilters } = useAppStore();

  const noiseTypes = Object.entries(NOISE_TYPES);

  const toggleNoiseType = (type: string) => {
    const currentTypes = mapFilters.noiseTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    setMapFilters({ noiseTypes: newTypes });
  };

  const updateDbRange = (min: number, max: number) => {
    setMapFilters({ dbRange: [min, max] });
  };

  const handleReset = () => {
    resetMapFilters();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Map Filters</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Noise Types Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Noise Types
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Select the types of noise you want to see
          </Text>

          <View style={styles.noiseTypesGrid}>
            {noiseTypes.map(([key, type]) => {
              const isSelected = mapFilters.noiseTypes.includes(key);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.noiseTypeButton,
                    {
                      backgroundColor: isSelected ? type.color + '20' : colors.surface,
                      borderColor: isSelected ? type.color : colors.border,
                    },
                  ]}
                  onPress={() => toggleNoiseType(key)}
                >
                  <MaterialIcons
                    name={type.icon as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={isSelected ? type.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.noiseTypeText,
                      {
                        color: isSelected ? type.color : colors.textSecondary,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Noise Level Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Noise Level (dB)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Filter by noise intensity level
          </Text>

          <View style={styles.dbRangeContainer}>
            {/* Quick preset buttons */}
            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor:
                      mapFilters.dbRange[0] === 0 && mapFilters.dbRange[1] === 60
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
                onPress={() => updateDbRange(0, 60)}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        mapFilters.dbRange[0] === 0 && mapFilters.dbRange[1] === 60
                          ? 'white'
                          : colors.text,
                    },
                  ]}
                >
                  Low (0-60)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor:
                      mapFilters.dbRange[0] === 60 && mapFilters.dbRange[1] === 90
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
                onPress={() => updateDbRange(60, 90)}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        mapFilters.dbRange[0] === 60 && mapFilters.dbRange[1] === 90
                          ? 'white'
                          : colors.text,
                    },
                  ]}
                >
                  Moderate (60-90)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor:
                      mapFilters.dbRange[0] === 90 && mapFilters.dbRange[1] === 120
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
                onPress={() => updateDbRange(90, 120)}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        mapFilters.dbRange[0] === 90 && mapFilters.dbRange[1] === 120
                          ? 'white'
                          : colors.text,
                    },
                  ]}
                >
                  High (90-120)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current range display */}
            <View style={styles.rangeDisplay}>
              <Text style={[styles.rangeText, { color: colors.text }]}>
                Current Range: {mapFilters.dbRange[0]} - {mapFilters.dbRange[1]} dB
              </Text>
            </View>
          </View>
        </View>

        {/* Radius Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Search Radius
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Distance from your location to show reports
          </Text>

          <View style={styles.radiusButtons}>
            {[1, 5, 10, 25].map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  {
                    backgroundColor:
                      mapFilters.radiusKm === radius ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setMapFilters({ radiusKm: radius })}
              >
                <Text
                  style={[
                    styles.radiusText,
                    {
                      color: mapFilters.radiusKm === radius ? 'white' : colors.text,
                    },
                  ]}
                >
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  noiseTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noiseTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  noiseTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dbRangeContainer: {
    gap: 16,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rangeDisplay: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapFilters;
