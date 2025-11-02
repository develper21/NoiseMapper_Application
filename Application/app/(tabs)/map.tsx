import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { useReports } from '../../hooks/useReports';
import { Report } from '../../lib/supabase';
import { noiseUtils } from '../../lib/utils';
import { MAP_CONFIG, NOISE_THRESHOLDS } from '../../constants/Config';
import MapFilters from '../../components/MapFilters';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { colors } = useTheme();
  const { location, getCurrentLocation } = useLocation();

  // <-- FIX: use isLoading (returned by the hook) instead of non-existent `loading`
  const { reports = [], isLoading, error } = useReports();

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: MAP_CONFIG.defaultLatitude,
    longitude: MAP_CONFIG.defaultLongitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
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
    // show small confirmation on web/desktop, still open bottom card on all platforms
    if (Platform.OS === 'web') {
      Alert.alert('Report selected', `Noise: ${report.noise_db} dB\nType: ${report.noise_type}`, [
        { text: 'Close', style: 'cancel' },
        { text: 'View', onPress: () => setSelectedReport(report) },
      ]);
    } else {
      setSelectedReport(report);
    }
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
    } else {
      // Use Alert (previously unused import) to notify user if location is unavailable
      Alert.alert('Location error', 'Unable to determine your current location. Please enable location services.');
    }
  };

  const getMarkerColor = (noiseDb: number) => {
    if (noiseDb < NOISE_THRESHOLDS.low) return '#10B981'; // Green
    if (noiseDb < NOISE_THRESHOLDS.moderate) return '#F59E0B'; // Yellow
    if (noiseDb < NOISE_THRESHOLDS.high) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getMarkerIcon = (noiseType: string) => {
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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation={true}
        // Use Platform (previously unused) to control native location button visibility
        showsMyLocationButton={Platform.OS === 'android'}
        showsCompass={true}
        onRegionChangeComplete={setMapRegion}
      >
        {reports?.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            onPress={() => handleMarkerPress(report)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(report.noise_db) }]}>
              <MaterialIcons
                name={getMarkerIcon(report.noise_type)}
                size={20}
                color="white"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading indicator using isLoading (fixed and now used) */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface + 'CC' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.text }}>Loading reports...</Text>
        </View>
      )}

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
              <Text style={[styles.noiseLevel, { color: getMarkerColor(selectedReport.noise_db) }]}>
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
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 12,
    borderRadius: 24,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  cardContent: {
    marginTop: 8,
  },
  noiseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noiseLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  noiseType: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  healthRisk: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    left: (width / 2) - 80,
    width: 160,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
