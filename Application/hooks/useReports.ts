import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, reports as reportsApi, hotspots as hotspotsApi } from '../lib/supabase';
import type { Report, Hotspot } from '../lib/supabase';
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
  status?: string;
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
      const { data, error } = await reportsApi.getAll();
      if (error) throw error;
      return data as Report[];
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
      const { data, error } = await reportsApi.getUserReports(user.id);
      if (error) throw error;
      return data as Report[];
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
      const { data, error } = await reportsApi.getNearby(
        location.coords.latitude,
        location.coords.longitude,
        5 // 5km radius
      );
      if (error) throw error;
      return data as Report[];
    },
    enabled: isOnline && !!location?.coords,
  });

  // Fetch hotspots
  const {
    data: hotspotsData,
    isLoading: isLoadingHotspots,
    error: hotspotsError,
    refetch: refetchHotspots,
  } = useQuery({
    queryKey: ['hotspots'],
    queryFn: async () => {
      const { data, error } = await hotspotsApi.getAll(50); // Limit to 50 hotspots
      if (error) throw error;
      return data as Hotspot[];
    },
    enabled: isOnline,
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (reportData: {
      latitude: number;
      longitude: number;
      noise_db: number;
      noise_type: Report['noise_type'];
      description?: string;
      media_urls?: string[];
      is_anonymous?: boolean;
    }) => {
      if (!isOnline) {
        // Store offline
        const offlineReport = {
          id: `offline_${Date.now()}`,
          ...reportData,
          timestamp: new Date().toISOString(),
          status: 'pending' as const,
        };
        addOfflineReport(offlineReport);
        return offlineReport;
      }

      if (!user?.id && !reportData.is_anonymous) {
        throw new Error('User must be authenticated or report must be anonymous');
      }

      const { data, error } = await reportsApi.create({
        user_id: reportData.is_anonymous ? '' : user!.id,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        noise_db: reportData.noise_db,
        noise_type: reportData.noise_type,
        description: reportData.description,
        media_urls: reportData.media_urls,
        is_anonymous: reportData.is_anonymous || false,
        status: 'pending',
      });

      if (error) throw error;
      return data as Report;
    },
    onSuccess: (newReport) => {
      if (isOnline) {
        // Add to local state
        if (newReport && typeof newReport === 'object' && 'id' in newReport) {
          addReport(newReport as Report);
        }

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['hotspots'] });

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

  // Realtime subscription for new reports
  useEffect(() => {
    if (!isOnline) return;

    const subscription = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          console.log('New report received:', payload);
          // Refetch reports to get updated data
          refetchReports();
          refetchNearbyReports();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOnline, refetchReports, refetchNearbyReports]);

  // Realtime subscription for hotspot updates
  useEffect(() => {
    if (!isOnline) return;

    const subscription = supabase
      .channel('hotspots_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotspots',
        },
        (payload) => {
          console.log('Hotspot updated:', payload);
          // Refetch hotspots to get updated data
          refetchHotspots();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOnline, refetchHotspots]);

  return {
    // State
    reports,
    userReports,
    nearbyReports,
    hotspots: hotspotsData || [],
    isLoading: isLoadingReports || isLoadingUserReports || isLoadingNearbyReports || isLoadingHotspots,
    error: reportsError || userReportsError || nearbyReportsError || hotspotsError,

    // Actions
    createReport: createReportMutation.mutate,
    isCreatingReport: createReportMutation.isPending,
    createReportError: createReportMutation.error,

    refetchReports,
    refetchUserReports,
    refetchNearbyReports,
    refetchHotspots,

    // Utilities
    getReportById: (id: string) => reports.find(report => report.id === id),
    getReportsByType: (type: Report['noise_type']) => reports.filter(report => report.noise_type === type),
    getHighNoiseReports: () => reports.filter(report => report.noise_db >= 75),
  };
};
