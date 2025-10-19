import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { NOISE_THRESHOLDS, NOISE_TYPES } from '../constants/Config';

/**
 * Utility functions for the NoiseMapper app
 */

// Noise level utilities
export const noiseUtils = {
  /**
   * Calculate noise level category based on dB value
   */
  getNoiseLevel: (db: number): 'low' | 'moderate' | 'high' => {
    if (db < NOISE_THRESHOLDS.low) return 'low';
    if (db < NOISE_THRESHOLDS.moderate) return 'moderate';
    return 'high';
  },

  /**
   * Get color for noise level
   */
  getNoiseColor: (db: number): string => {
    const level = noiseUtils.getNoiseLevel(db);
    switch (level) {
      case 'low': return '#10B981'; // Green
      case 'moderate': return '#F59E0B'; // Yellow
      case 'high': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  },

  /**
   * Get health risk description for noise level
   */
  getHealthRisk: (db: number): string => {
    if (db < 60) return 'Safe - No immediate health concerns';
    if (db < 75) return 'Caution - May cause annoyance and sleep disturbance';
    if (db < 90) return 'Warning - Can lead to stress and hearing damage';
    return 'Danger - Immediate risk of hearing loss and health issues';
  },

  /**
   * Format dB value for display
   */
  formatDb: (db: number): string => {
    return `${db.toFixed(1)} dB`;
  },
};

// Export NOISE_TYPES for use in components
export { NOISE_TYPES };

// Location utilities
export const locationUtils = {
  /**
   * Request location permissions
   */
  requestLocationPermission: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  },

  /**
   * Get current location
   */
  getCurrentLocation: async (): Promise<Location.LocationObject | null> => {
    try {
      const hasPermission = await locationUtils.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use this feature.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  },

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Format distance for display
   */
  formatDistance: (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  },
};

// Audio/Noise measurement utilities
export const audioUtils = {
  /**
   * Simple noise level calculation from audio data
   * This is a basic implementation - for production, consider using a proper SPL meter library
   */
  calculateDbFromAudio: (audioData: number[]): number => {
    if (!audioData || audioData.length === 0) return 0;

    // Calculate RMS (Root Mean Square) of the audio data
    const sum = audioData.reduce((acc, sample) => acc + sample * sample, 0);
    const rms = Math.sqrt(sum / audioData.length);

    // Convert to approximate dB (this is a simplified calculation)
    // In a real implementation, you'd need proper audio analysis
    const db = 20 * Math.log10(rms / 32767); // Assuming 16-bit audio

    // Clamp to reasonable range (0-120 dB)
    return Math.max(0, Math.min(120, Math.abs(db)));
  },

  /**
   * Get audio level description
   */
  getAudioLevelDescription: (db: number): string => {
    if (db < 40) return 'Very quiet';
    if (db < 60) return 'Quiet';
    if (db < 75) return 'Moderate';
    if (db < 90) return 'Loud';
    return 'Very loud';
  },
};

// File utilities
export const fileUtils = {
  /**
   * Generate unique file name for uploads
   */
  generateFileName: (extension: string = 'jpg'): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `noisemapper_${timestamp}_${random}.${extension}`;
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
};

// Date and time utilities
export const dateUtils = {
  /**
   * Format timestamp for display
   */
  formatTimestamp: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  },

  /**
   * Format time for display
   */
  formatTime: (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Get time ago string
   */
  getTimeAgo: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  },
};

// Validation utilities
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate noise level
   */
  isValidNoiseLevel: (db: number): boolean => {
    return db >= 0 && db <= 120 && !isNaN(db);
  },

  /**
   * Validate coordinates
   */
  isValidCoordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
};

// Storage utilities using AsyncStorage
export const storageUtils = {
  /**
   * Store data locally
   */
  storeData: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  /**
   * Retrieve data locally
   */
  getData: async (key: string): Promise<any> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  /**
   * Remove data locally
   */
  removeData: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },
};

// Permission utilities
export const permissionUtils = {
  /**
   * Request multiple permissions at once
   */
  requestPermissions: async (permissions: string[]): Promise<boolean[]> => {
    const results: boolean[] = [];

    for (const permission of permissions) {
      try {
        let granted = false;

        switch (permission) {
          case 'location':
            const { status } = await Location.requestForegroundPermissionsAsync();
            granted = status === 'granted';
            break;
          case 'camera':
            // Camera permissions would be handled by expo-image-picker
            granted = true; // Assume granted for now
            break;
          case 'microphone':
            // Microphone permissions would be handled by expo-av
            granted = true; // Assume granted for now
            break;
          default:
            granted = false;
        }

        results.push(granted);
      } catch (error) {
        console.error(`Error requesting ${permission} permission:`, error);
        results.push(false);
      }
    }

    return results;
  },

  /**
   * Check if all permissions are granted
   */
  allPermissionsGranted: (permissions: boolean[]): boolean => {
    return permissions.every(permission => permission === true);
  },
};

// Network utilities
export const networkUtils = {
  /**
   * Check if device is online
   */
  isOnline: async (): Promise<boolean> => {
    try {
      // Simple connectivity check - in production you might want to use NetInfo
      return true; // Assume online for now
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  },
};
