import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../lib/store';
import { locationUtils } from '../lib/utils';

/**
 * Custom hook for location management
 * Handles location permissions, current location, and location updates
 */

export interface LocationState {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean;
}

export const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: false,
    hasPermission: false,
  });

  const [watchId, setWatchId] = useState<string | null>(null);

  // Request location permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    setLocationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const hasPermission = await locationUtils.requestLocationPermission();

      setLocationState(prev => ({
        ...prev,
        hasPermission,
        isLoading: false
      }));

      if (!hasPermission) {
        setLocationState(prev => ({
          ...prev,
          error: 'Location permission denied. Please enable location services in settings.'
        }));
      }
    } catch (error: any) {
      console.error('Error requesting location permissions:', error);
      setLocationState(prev => ({
        ...prev,
        error: error.message || 'Failed to request location permissions',
        isLoading: false,
        hasPermission: false
      }));
    }
  };

  const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
    setLocationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const location = await locationUtils.getCurrentLocation();

      if (location) {
        setLocationState(prev => ({
          ...prev,
          location,
          isLoading: false,
          error: null
        }));
        return location;
      } else {
        setLocationState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to get current location'
        }));
        return null;
      }
    } catch (error: any) {
      console.error('Error getting current location:', error);
      setLocationState(prev => ({
        ...prev,
        error: error.message || 'Failed to get current location',
        isLoading: false
      }));
      return null;
    }
  };

  const watchLocation = async (callback: (location: Location.LocationObject) => void) => {
    if (!locationState.hasPermission) {
      await requestPermissions();
    }

    if (!locationState.hasPermission) {
      return;
    }

    try {
      const id = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setLocationState(prev => ({ ...prev, location }));
          callback(location);
        }
      );

      setWatchId(String(id));
    } catch (error: any) {
      console.error('Error watching location:', error);
      setLocationState(prev => ({
        ...prev,
        error: error.message || 'Failed to watch location'
      }));
    }
  };

  const stopWatchingLocation = () => {
    if (watchId) {
      Location.stopLocationUpdatesAsync(watchId);
      setWatchId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatchingLocation();
    };
  }, []);

  return {
    // State
    location: locationState.location,
    error: locationState.error,
    isLoading: locationState.isLoading,
    hasPermission: locationState.hasPermission,

    // Actions
    requestPermissions,
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation,

    // Computed values
    coordinates: locationState.location ? {
      latitude: locationState.location.coords.latitude,
      longitude: locationState.location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    } : null,

    isReady: !locationState.isLoading && locationState.hasPermission,
  };
};
