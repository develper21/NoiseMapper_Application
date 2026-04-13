import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';

import StatsCard from '../../components/StatsCard';
import HotspotCard from '../../components/HotspotCard';
import QuickReportButton from '../../components/QuickReportButton';

/**
 * Dashboard screen - Main home screen of the app
 * Shows overview statistics, nearby hotspots, and quick actions
 */

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const {
    reports,
    nearbyReports,
    hotspots,
    isLoading,
    refetchReports,
    getHighNoiseReports,
  } = useReports();

  const highNoiseHotspots = getHighNoiseReports();
  const isRefreshing = isLoading;

  const handleRefresh = () => {
    refetchReports();
  };

  const navigateToMap = () => {
    router.push('/map');
  };

  const navigateToReports = () => {
    router.push('/reports');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              Welcome back
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Noise Mapper User'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: colors.primary }]}
            onPress={navigateToMap}
          >
            <MaterialIcons name="my-location" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="Total Reports"
            value={reports.length.toString()}
            icon="assignment"
            color={colors.primary}
            onPress={navigateToReports}
          />
          <StatsCard
            title="Nearby Reports"
            value={nearbyReports.length.toString()}
            icon="location-on"
            color={colors.info}
            onPress={navigateToMap}
          />
          <StatsCard
            title="High Noise Areas"
            value={highNoiseHotspots.length.toString()}
            icon="warning"
            color={colors.error}
            onPress={navigateToMap}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <QuickReportButton />
        </View>

        {/* Nearby Hotspots */}
        {nearbyReports.length > 0 && (
          <View style={styles.hotspotsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nearby Hotspots
              </Text>
              <TouchableOpacity onPress={navigateToMap}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hotspotsScrollView}
            >
              {nearbyReports.slice(0, 5).map((report) => (
                <HotspotCard
                  key={report.id}
                  report={report}
                  style={styles.hotspotCard}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Know Your Noise Levels
          </Text>
          <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="info" size={24} color={colors.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Health Impact
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Noise above 75 dB can cause stress and hearing damage. Above 90 dB poses immediate risk.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  hotspotsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hotspotsScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  hotspotCard: {
    width: 280,
    marginRight: 12,
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
