import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report, Hotspot, User } from './supabase';
import { APP_CONFIG } from '../constants/Config';

/**
 * Zustand store for global state management in NoiseMapper
 */

// Types for the store
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Reports state
  reports: Report[];
  userReports: Report[];
  nearbyReports: Report[];

  // Hotspots state
  hotspots: Hotspot[];
  nearbyHotspots: Hotspot[];

  // UI state
  selectedReport: Report | null;
  isReportFormVisible: boolean;
  mapFilters: {
    noiseTypes: string[];
    dbRange: [number, number];
    radiusKm: number;
  };

  // Offline state
  offlineReports: any[];
  isOnline: boolean;

  // Settings
  settings: {
    enableNotifications: boolean;
    enableAnonymousReporting: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;

  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;

  setUserReports: (reports: Report[]) => void;
  setNearbyReports: (reports: Report[]) => void;

  setHotspots: (hotspots: Hotspot[]) => void;
  setNearbyHotspots: (hotspots: Hotspot[]) => void;

  setSelectedReport: (report: Report | null) => void;
  setReportFormVisible: (isVisible: boolean) => void;

  setMapFilters: (filters: Partial<AppState['mapFilters']>) => void;
  resetMapFilters: () => void;

  addOfflineReport: (report: any) => void;
  removeOfflineReport: (reportId: string) => void;
  clearOfflineReports: () => void;

  setOnline: (isOnline: boolean) => void;

  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetSettings: () => void;

  // Computed getters
  getTotalReports: () => number;
  getUserReportCount: () => number;
  getNearbyReportCount: () => number;
  getHighNoiseHotspots: () => Hotspot[];
}

// Default settings
const defaultSettings = {
  enableNotifications: true,
  enableAnonymousReporting: false,
  theme: 'auto' as const,
  language: 'en',
};

// Default map filters
const defaultMapFilters = {
  noiseTypes: [],
  dbRange: [0, 120] as [number, number],
  radiusKm: 5,
};

// Create the store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      reports: [],
      userReports: [],
      nearbyReports: [],

      hotspots: [],
      nearbyHotspots: [],

      selectedReport: null,
      isReportFormVisible: false,

      mapFilters: defaultMapFilters,

      offlineReports: [],
      isOnline: true,

      settings: defaultSettings,

      // Actions
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),

      setReports: (reports) => set({ reports }),
      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports],
        })),
      updateReport: (reportId, updates) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId ? { ...report, ...updates } : report
          ),
        })),

      setUserReports: (userReports) => set({ userReports }),
      setNearbyReports: (nearbyReports) => set({ nearbyReports }),

      setHotspots: (hotspots) => set({ hotspots }),
      setNearbyHotspots: (nearbyHotspots) => set({ nearbyHotspots }),

      setSelectedReport: (selectedReport) => set({ selectedReport }),
      setReportFormVisible: (isReportFormVisible) => set({ isReportFormVisible }),

      setMapFilters: (filters) =>
        set((state) => ({
          mapFilters: { ...state.mapFilters, ...filters },
        })),
      resetMapFilters: () => set({ mapFilters: defaultMapFilters }),

      addOfflineReport: (report) =>
        set((state) => ({
          offlineReports: [...state.offlineReports, report],
        })),
      removeOfflineReport: (reportId) =>
        set((state) => ({
          offlineReports: state.offlineReports.filter(
            (report) => report.id !== reportId
          ),
        })),
      clearOfflineReports: () => set({ offlineReports: [] }),

      setOnline: (isOnline) => set({ isOnline }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),

      // Computed getters
      getTotalReports: () => get().reports.length,
      getUserReportCount: () => get().userReports.length,
      getNearbyReportCount: () => get().nearbyReports.length,

      getHighNoiseHotspots: () => {
        const { hotspots } = get();
        return hotspots.filter((hotspot) => hotspot.avg_noise_db >= 75);
      },
    }),
    {
      name: 'noisemapper-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these parts of the state
        user: state.user,
        settings: state.settings,
        mapFilters: state.mapFilters,
        offlineReports: state.offlineReports,
      }),
    }
  )
);

// Selectors for specific parts of the state
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading } = useAppStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setAuthenticated,
    setLoading,
  };
};

export const useReports = () => {
  const {
    reports,
    userReports,
    nearbyReports,
    selectedReport,
    setReports,
    addReport,
    updateReport,
    setUserReports,
    setNearbyReports,
    setSelectedReport,
  } = useAppStore();

  return {
    reports,
    userReports,
    nearbyReports,
    selectedReport,
    setReports,
    addReport,
    updateReport,
    setUserReports,
    setNearbyReports,
    setSelectedReport,
  };
};

export const useHotspots = () => {
  const {
    hotspots,
    nearbyHotspots,
    setHotspots,
    setNearbyHotspots,
    getHighNoiseHotspots,
  } = useAppStore();

  return {
    hotspots,
    nearbyHotspots,
    setHotspots,
    setNearbyHotspots,
    getHighNoiseHotspots,
  };
};

export const useUI = () => {
  const {
    isReportFormVisible,
    mapFilters,
    setReportFormVisible,
    setMapFilters,
    resetMapFilters,
  } = useAppStore();

  return {
    isReportFormVisible,
    mapFilters,
    setReportFormVisible,
    setMapFilters,
    resetMapFilters,
  };
};

export const useOffline = () => {
  const {
    offlineReports,
    isOnline,
    addOfflineReport,
    removeOfflineReport,
    clearOfflineReports,
    setOnline,
  } = useAppStore();

  return {
    offlineReports,
    isOnline,
    addOfflineReport,
    removeOfflineReport,
    clearOfflineReports,
    setOnline,
  };
};

export const useSettings = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useAppStore();

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
