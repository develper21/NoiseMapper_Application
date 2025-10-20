import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
} from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { useReports } from '../../hooks/useReports';
import { Report } from '../../lib/supabase';
import { noiseUtils } from '../../lib/utils';
import { MAP_CONFIG } from '../../constants/Config';
import MapFilters from '../../components/MapFilters';

export default function MapScreen() {
  const { colors } = useTheme();
  const { location, getCurrentLocation } = useLocation();

    const [mapRegion, setMapRegion] = useState({
      latitude: MAP_CONFIG.defaultLatitude,
      longitude: MAP_CONFIG.defaultLongitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Update map region when user location is available
  useEffect(() => {
    if (location?.coords) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [location]);

  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCenterOnLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation?.coords) {
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const getMarkerColor = (noiseDb: number) => {
    return noiseUtils.getNoiseColor(noiseDb);
  };

  const getMarkerIcon = (noiseType: Report['noise_type']) => {
    switch (noiseType) {
      case 'traffic': return 'directions-car';
      case 'construction': return 'construction';
      case 'events': return 'event';
      case 'industrial': return 'factory';
      default: return 'help-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map View - Temporarily disabled for web compatibility */}
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface }]}>
        <MaterialIcons name="map" size={48} color={colors.textSecondary} />
        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
          Interactive Map Coming Soon
        </Text>
        <Text style={[styles.mapPlaceholderSubtext, { color: colors.textDisabled }]}>
          Map functionality will be available in the mobile app
        </Text>
      </View>

      {/* Top Controls */}
      <View style={[styles.topControls, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.primary }]}
          onPress={handleCenterOnLocation}
        >
          <MaterialIcons name="my-location" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Card */}
      {selectedReport && (
        <View style={[styles.bottomCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedReport(null)}
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.cardContent}>
            <View style={styles.noiseInfo}>
              <Text style={[styles.noiseLevel, { color: noiseUtils.getNoiseColor(selectedReport.noise_db) }]}>
                {noiseUtils.formatDb(selectedReport.noise_db)}
              </Text>
              <Text style={[styles.noiseType, { color: colors.textSecondary }]}>
                {selectedReport.noise_type}
              </Text>
            </View>

            {selectedReport.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {selectedReport.description}
              </Text>
            )}

            <Text style={[styles.healthRisk, { color: colors.textSecondary }]}>
              {noiseUtils.getHealthRisk(selectedReport.noise_db)}
            </Text>
          </View>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <MapFilters
          onClose={() => setShowFilters(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardContent: {
    marginTop: 8,
  },
  noiseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noiseLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  noiseType: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  healthRisk: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
