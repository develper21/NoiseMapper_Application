// Configuration constants for the NoiseMapper app
// Import environment variables using Expo's Constants
import Constants from 'expo-constants';

// Expo provides environment variables in different shapes depending on
// whether you're running in managed, dev client, or EAS build. Check
// both `process.env` (for metro/EAS) and `Constants.expoConfig.extra` /
// `Constants.manifest.extra` for backwards compatibility.
const expoExtra = (Constants.expoConfig && Constants.expoConfig.extra) || Constants.manifest?.extra || {};

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Google Maps API Key (get from Google Cloud Console)
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Whether Supabase configuration is present
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// App configuration
export const APP_CONFIG = {
  name: 'City Noise Pollution Mapper',
  version: '1.0.0',
  description: 'Crowdsourced noise pollution mapping for healthier cities',
};

// Noise level thresholds (in dB)
export const NOISE_THRESHOLDS = {
  low: 60,      // Green - Acceptable
  moderate: 75, // Yellow - Caution
  high: 90,     // Red - High risk
};

// Default map settings
export const MAP_CONFIG = {
  defaultLatitude: 28.6139,  // New Delhi coordinates
  defaultLongitude: 77.2090,
  defaultZoom: 12,
  searchRadiusKm: 5,
};

// Noise types with display information
export const NOISE_TYPES = {
  traffic: {
    label: 'Traffic',
    icon: 'directions-car',
    color: '#3B82F6',
    description: 'Vehicle noise from roads, highways, intersections',
  },
  construction: {
    label: 'Construction',
    icon: 'construction',
    color: '#F59E0B',
    description: 'Building work, drilling, heavy machinery',
  },
  events: {
    label: 'Events',
    icon: 'event',
    color: '#8B5CF6',
    description: 'Concerts, festivals, public gatherings',
  },
  industrial: {
    label: 'Industrial',
    icon: 'factory',
    color: '#EF4444',
    description: 'Manufacturing plants, factories, machinery',
  },
  other: {
    label: 'Other',
    icon: 'help-outline',
    color: '#6B7280',
    description: 'Miscellaneous noise sources',
  },
};

// Notification settings
export const NOTIFICATION_CONFIG = {
  nearbyHotspotRadiusKm: 1,
  dailyReportLimit: 10,
};

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  userProfile: '@noisemapper_user_profile',
  offlineReports: '@noisemapper_offline_reports',
  appSettings: '@noisemapper_app_settings',
};

// API endpoints (if needed for external services)
export const API_ENDPOINTS = {
  // Add any external API endpoints here
  weather: 'https://api.openweathermap.org/data/2.5',
  locationIQ: 'https://us1.locationiq.com/v1',
};

// Feature flags
export const FEATURE_FLAGS = {
  enableOfflineMode: true,
  enableSocialSharing: true,
  enableAdvancedFilters: true,
  enableAnalytics: false,
};
