import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Region as RNRegion } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLocation } from '../hooks/useLocation';
import { useReports } from '../hooks/useReports';
import { Report as SupabaseReport } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type ExtendedReport = Partial<SupabaseReport> & {
  id: string;
  latitude: number;
  longitude: number;
  db_level?: number;
  dbLevel?: number;
  description?: string;
  created_at?: string;
  createdAt?: string;
};

const DEFAULT_REGION: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const NoiceMap: React.FC = () => {
  const { colors } = useTheme();
  const { location } = useLocation();
  const { reports = [], isLoading, error } = useReports();
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    if (location?.coords?.latitude && location?.coords?.longitude) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [location]);

  const getMarkerColor = (r: ExtendedReport) => {
    const dbLevel = r.db_level ?? (r as any).dbLevel ?? 0;
    if (dbLevel > 80) return '#FF3B30';
    if (dbLevel > 65) return '#FF9500';
    if (dbLevel > 50) return '#FFCC00';
    return '#34C759';
  };

  const safeReports = (reports ?? []) as ExtendedReport[];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={(region: RNRegion) =>
          setMapRegion({
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          })
        }
        customMapStyle={[
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ]}
      >
        {safeReports.map((report, idx) => {
          const id = report.id ?? `r-${idx}`;
          const latitude = report.latitude ?? (report as any).lat ?? 0;
          const longitude = report.longitude ?? (report as any).lng ?? 0;
          const description = report.description ?? (report as any).desc ?? '';
          const createdRaw = report.created_at ?? (report as any).createdAt ?? (report as any).timestamp ?? null;
          const createdAt = createdRaw ? new Date(createdRaw).toLocaleString() : '';

          return (
            <Marker
              key={id}
              coordinate={{
                latitude,
                longitude,
              }}
            >
              <View style={[styles.marker, { backgroundColor: getMarkerColor(report) }]}>
                <MaterialIcons name="volume-up" size={20} color="#fff" />
              </View>

              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    Noise Level:{' '}
                    {((report.db_level ?? (report as any).dbLevel) ?? 'N/A') + (typeof (report.db_level ?? (report as any).dbLevel) === 'number' ? ' dB' : '')}
                  </Text>
                  {description ? <Text style={styles.calloutText}>{description}</Text> : null}
                  {createdAt ? <Text style={styles.calloutSubtext}>{createdAt}</Text> : null}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callout: {
    width: 220,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  calloutText: {
    marginBottom: 6,
  },
  calloutSubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default NoiceMap;
