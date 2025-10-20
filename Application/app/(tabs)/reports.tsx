import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import { Report } from '../../lib/supabase';
import HotspotCard from '../../components/HotspotCard';
import { NOISE_TYPES } from '../../constants/Config';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { reports, userReports, isLoading, refetchReports } = useReports();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<Report['noise_type'] | 'all'>('all');

  const isRefreshing = isLoading;

  const handleRefresh = () => {
    refetchReports();
  };

  const filteredReports = React.useMemo(() => {
    let filtered = activeTab === 'mine' ? userReports : reports;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (report) =>
          report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.noise_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by noise type
    if (filterType !== 'all') {
      filtered = filtered.filter((report) => report.noise_type === filterType);
    }

    return filtered;
  }, [reports, userReports, activeTab, searchQuery, filterType]);


  const getNoiseTypeIcon = (type: Report['noise_type']) => {
    return NOISE_TYPES[type]?.icon || 'help-outline';
  };

  const getNoiseTypeColor = (type: Report['noise_type']) => {
    return NOISE_TYPES[type]?.color || colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Reports
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/report')}
          >
            <MaterialIcons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'all' ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'all' ? 'white' : colors.text },
              ]}
            >
              All Reports ({reports.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'mine' ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setActiveTab('mine')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'mine' ? 'white' : colors.text },
              ]}
            >
              My Reports ({userReports.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search reports..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Noise Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === 'all' ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterType === 'all' ? 'white' : colors.text },
              ]}
            >
              All Types
            </Text>
          </TouchableOpacity>

          {Object.entries(NOISE_TYPES).map(([key, type]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterType === key ? type.color + '20' : colors.surface,
                  borderColor: filterType === key ? type.color : colors.border,
                },
              ]}
              onPress={() => setFilterType(key as Report['noise_type'])}
            >
              <MaterialIcons
                name={type.icon as keyof typeof MaterialIcons.glyphMap}
                size={16}
                color={filterType === key ? type.color : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === key ? type.color : colors.text },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.reportsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={48} color={colors.textDisabled} />
            <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>
              No Reports Found
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textDisabled }]}>
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to report noise pollution in your area'}
            </Text>
            {(!searchQuery && filterType === 'all') && (
              <TouchableOpacity
                style={[styles.reportButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/report')}
              >
                <Text style={styles.reportButtonText}>Report Noise</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.reportsContainer}>
            {filteredReports.map((report) => (
              <HotspotCard
                key={report.id}
                report={report}
                style={styles.reportCard}
              />
            ))}
          </View>
        )}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  reportButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportsContainer: {
    padding: 20,
    gap: 12,
  },
  reportCard: {
    marginBottom: 8,
  },
});
