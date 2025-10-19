import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';
import { useAppStore } from '../../lib/store';
import { validationUtils } from '../../lib/utils';

/**
 * Profile screen - User settings, account management, and data export
 * Allows users to manage their profile and app preferences
 */

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const { userReports } = useReports();
  const { settings, updateSettings } = useAppStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await updateProfile({ name: editName.trim() });
      setIsEditingProfile(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      // In a real app, you'd generate a proper CSV/PDF here
      const data = {
        user: {
          name: user?.name,
          email: user?.email,
          reports_count: userReports.length,
          join_date: user?.created_at,
        },
        reports: userReports.map(report => ({
          id: report.id,
          noise_db: report.noise_db,
          noise_type: report.noise_type,
          description: report.description,
          location: `${report.latitude}, ${report.longitude}`,
          timestamp: report.timestamp,
          status: report.status,
        })),
        export_date: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(data, null, 2);

      await Share.share({
        message: `My NoiseMapper Data Export\n\n${jsonString}`,
        title: 'NoiseMapper Data Export',
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          {isEditingProfile ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textDisabled}
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
              >
                <MaterialIcons name="check" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameContainer}
              onPress={() => {
                setEditName(user?.name || '');
                setIsEditingProfile(true);
              }}
            >
              <Text style={[styles.name, { color: colors.text }]}>
                {user?.name || 'Anonymous User'}
              </Text>
              <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {userReports.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Reports
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {Math.round(userReports.reduce((sum, r) => sum + r.noise_db, 0) / Math.max(userReports.length, 1))}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg dB
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.settingsContainer}>
        {/* Account Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Settings
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleExportData}
          >
            <MaterialIcons name="download" size={20} color={colors.primary} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Export My Data
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Download your reports and account data
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This action cannot be undone. All your data will be permanently deleted.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]
              );
            }}
          >
            <MaterialIcons name="delete-forever" size={20} color={colors.error} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>
                Delete Account
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Permanently delete your account and data
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Settings
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => toggleSetting('enableNotifications')}
          >
            <MaterialIcons
              name={settings.enableNotifications ? 'notifications-active' : 'notifications-none'}
              size={20}
              color={settings.enableNotifications ? colors.primary : colors.textSecondary}
            />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Push Notifications
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Get notified about nearby noise hotspots
              </Text>
            </View>
            <MaterialIcons
              name={settings.enableNotifications ? 'toggle-on' : 'toggle-off'}
              size={24}
              color={settings.enableNotifications ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => toggleSetting('enableAnonymousReporting')}
          >
            <MaterialIcons
              name={settings.enableAnonymousReporting ? 'visibility-off' : 'visibility'}
              size={20}
              color={settings.enableAnonymousReporting ? colors.primary : colors.textSecondary}
            />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Anonymous Reporting
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Submit reports without showing your identity
              </Text>
            </View>
            <MaterialIcons
              name={settings.enableAnonymousReporting ? 'toggle-on' : 'toggle-off'}
              size={24}
              color={settings.enableAnonymousReporting ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              Alert.alert(
                'About NoiseMapper',
                'City Noise Pollution Mapper v1.0.0\n\nA crowdsourced app to report and map urban noise pollution hotspots, empowering communities to fight noise pollution through easy reporting and awareness tools.',
                [{ text: 'OK' }]
              );
            }}
          >
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                About NoiseMapper
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Learn more about the app and its mission
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Share.share({
                message: 'Check out NoiseMapper - the app that helps map and fight urban noise pollution! https://noisemapper.app',
                title: 'NoiseMapper - City Noise Pollution Mapper',
              });
            }}
          >
            <MaterialIcons name="share" size={20} color={colors.primary} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Share App
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Tell others about NoiseMapper
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
        >
          <MaterialIcons name="logout" size={20} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  settingsContainer: {
    padding: 20,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
