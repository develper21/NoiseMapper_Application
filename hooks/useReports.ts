import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Report, CreateReportData } from '../lib/types';
import { useAppStore } from '../lib/store';
import { useAuth } from './useAuth';
import { useLocation } from './useLocation';
import * as Haptics from 'expo-haptics';

/**
 * Custom hook for reports management
 * Handles fetching, creating, and managing noise pollution reports
 */

export interface ReportFilters {
  noise_type?: string;
  limit?: number;
  offset?: number;
}

export const useReports = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();
  const {
    reports,
    userReports,
    nearbyReports,
    addReport,
    setReports,
    setUserReports,
    setNearbyReports,
    offlineReports,
    isOnline,
    addOfflineReport,
  } = useAppStore();

  // Fetch all reports
  const {
    data: allReports,
    isLoading: isLoadingReports,
    error: reportsError,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await apiClient.getReports();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch reports');
      }
      return response.data as Report[];
    },
    enabled: isOnline,
  });

  // Fetch user's reports
  const {
    data: userReportsData,
    isLoading: isLoadingUserReports,
    error: userReportsError,
    refetch: refetchUserReports,
  } = useQuery({
    queryKey: ['userReports', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await apiClient.getReports({ user_id: user.id });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user reports');
      }
      return response.data as Report[];
    },
    enabled: isAuthenticated && isOnline && !!user?.id,
  });

  // Fetch nearby reports
  const {
    data: nearbyReportsData,
    isLoading: isLoadingNearbyReports,
    error: nearbyReportsError,
    refetch: refetchNearbyReports,
  } = useQuery({
    queryKey: ['nearbyReports', location?.coords.latitude, location?.coords.longitude],
    queryFn: async () => {
      if (!location?.coords) throw new Error('Location not available');
      const response = await apiClient.getReports({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: 5 // 5km radius
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch nearby reports');
      }
      return response.data as Report[];
    },
    enabled: isOnline && !!location?.coords,
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      if (!isOnline) {
        // Store offline
        const offlineReport = {
          id: `offline_${Date.now()}`,
          ...reportData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addOfflineReport(offlineReport);
        return offlineReport;
      }

      const response = await apiClient.createReport(reportData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create report');
      }
      return response.data as Report;
    },
    onSuccess: (newReport) => {
      if (isOnline && newReport) {
        // Add to local state
        addReport(newReport);

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['userReports'] });
        queryClient.invalidateQueries({ queryKey: ['nearbyReports'] });

        // Haptic feedback for successful report
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    onError: (error) => {
      console.error('Error creating report:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Sync offline reports when coming back online
  useEffect(() => {
    if (isOnline && offlineReports.length > 0) {
      syncOfflineReports();
    }
  }, [isOnline, offlineReports.length]);

  const syncOfflineReports = async () => {
    for (const offlineReport of offlineReports) {
      try {
        await createReportMutation.mutateAsync({
          latitude: offlineReport.latitude,
          longitude: offlineReport.longitude,
          noise_db: offlineReport.noise_db,
          noise_type: offlineReport.noise_type,
          description: offlineReport.description,
          media_urls: offlineReport.media_urls,
          is_anonymous: offlineReport.is_anonymous,
        });

        // Remove from offline storage after successful sync
        // This would be handled by the store
      } catch (error) {
        console.error('Error syncing offline report:', error);
      }
    }
  };

  // Update local state when data changes
  useEffect(() => {
    if (allReports) {
      setReports(allReports);
    }
  }, [allReports, setReports]);

  useEffect(() => {
    if (userReportsData) {
      setUserReports(userReportsData);
    }
  }, [userReportsData, setUserReports]);

  useEffect(() => {
    if (nearbyReportsData) {
      setNearbyReports(nearbyReportsData);
    }
  }, [nearbyReportsData, setNearbyReports]);

  return {
    // State
    reports,
    userReports,
    nearbyReports,
    isLoading: isLoadingReports || isLoadingUserReports || isLoadingNearbyReports,
    error: reportsError || userReportsError || nearbyReportsError,

    // Actions
    createReport: createReportMutation.mutate,
    isCreatingReport: createReportMutation.isPending,
    createReportError: createReportMutation.error,

    refetchReports,
    refetchUserReports,
    refetchNearbyReports,

    // Utilities
    getReportById: (id: string) => reports.find(report => report.id === id),
    getReportsByType: (type: Report['noise_type']) => reports.filter(report => report.noise_type === type),
    getHighNoiseReports: () => reports.filter(report => report.noise_db >= 75),
  };
};
