import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { useReports } from '../hooks/useReports';
import { Report } from '../lib/supabase';
import { noiseUtils, locationUtils, NOISE_TYPES } from '../lib/utils';

import NoiseMeter from '../components/NoiseMeter';

/**
 * Report screen - Allows users to submit noise pollution reports
 * Includes location, noise measurement, type selection, and description
 */

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { location, getCurrentLocation } = useLocation();
  const { createReport, isCreatingReport } = useReports();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    latitude: 0,
    longitude: 0,
    noise_db: 0,
    noise_type: '' as Report['noise_type'],
    description: '',
    media_urls: [] as string[],
    is_anonymous: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [measuredDb, setMeasuredDb] = useState(0);

  const steps = [
    { id: 1, title: 'Location', icon: 'location-on' },
    { id: 2, title: 'Measure', icon: 'mic' },
    { id: 3, title: 'Details', icon: 'description' },
    { id: 4, title: 'Submit', icon: 'send' },
  ];

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Update form data when location changes
  useEffect(() => {
    if (location?.coords) {
      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    }
  }, [location]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLocationUpdate = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation?.coords) {
      setFormData(prev => ({
        ...prev,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }));
    }
  };

  const handleNoiseTypeSelect = (type: Report['noise_type']) => {
    setFormData(prev => ({ ...prev, noise_type: type }));
  };

  const handleDescriptionChange = (text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
  };

  const handleAnonymousToggle = () => {
    setFormData(prev => ({ ...prev, is_anonymous: !prev.is_anonymous }));
  };

  const handleMediaAdd = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera and media library permissions are required to add photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // In a real app, you'd upload the image to Supabase Storage here
        // For now, we'll just store the local URI
        setFormData(prev => ({
          ...prev,
          media_urls: [...prev.media_urls, result.assets[0].uri],
        }));
      }
    } catch (error) {
      console.error('Error adding media:', error);
      Alert.alert('Error', 'Failed to add media. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.noise_type) {
      Alert.alert('Missing Information', 'Please select a noise type.');
      return;
    }

    if (formData.noise_db < 30) {
      Alert.alert(
        'Low Noise Level',
        'The measured noise level seems very low. Please ensure you are measuring actual noise pollution.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => submitReport() },
        ]
      );
      return;
    }

    await submitReport();
  };

  const submitReport = async () => {
    try {
      await createReport(formData);

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Report Submitted',
        'Thank you for helping make your city quieter! Your report has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your report. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step) => (
        <View key={step.id} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  step.id === currentStep
                    ? colors.primary
                    : step.id < currentStep
                    ? colors.success
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialIcons
              name={step.icon as keyof typeof MaterialIcons.glyphMap}
              size={16}
              color={step.id <= currentStep ? 'white' : colors.textSecondary}
            />
          </View>
          <Text
            style={[
              styles.stepTitle,
              {
                color:
                  step.id <= currentStep ? colors.text : colors.textSecondary,
              },
            ]}
          >
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: colors.text }]}>
              Confirm Your Location
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              We'll use this location to map the noise pollution hotspot
            </Text>

            <View style={[styles.locationCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationText, { color: colors.text }]}>
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Text>
                <Text style={[styles.locationSubtext, { color: colors.textSecondary }]}>
                  Current GPS coordinates
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.updateLocationButton, { backgroundColor: colors.primary }]}
              onPress={handleLocationUpdate}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={styles.updateLocationText}>Update Location</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: colors.text }]}>
              Measure Noise Level
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Use the noise meter to measure the current noise level in dB
            </Text>

            <NoiseMeter
              onMeasurement={setMeasuredDb}
              onRecordingStateChange={setIsRecording}
              style={styles.noiseMeter}
            />

            <View style={styles.measurementInfo}>
              <Text style={[styles.measurementText, { color: colors.text }]}>
                Measured: {measuredDb.toFixed(1)} dB
              </Text>
              <Text style={[styles.measurementSubtext, { color: colors.textSecondary }]}>
                {noiseUtils.getHealthRisk(measuredDb)}
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: colors.text }]}>
              Report Details
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Provide additional information about the noise
            </Text>

            {/* Noise Type Selection */}
            <Text style={[styles.label, { color: colors.text }]}>Noise Type</Text>
            <View style={styles.noiseTypeGrid}>
              {(Object.entries(NOISE_TYPES) as [string, any][]).map(([key, type]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.noiseTypeButton,
                    {
                      backgroundColor:
                        formData.noise_type === key ? type.color + '20' : colors.surface,
                      borderColor:
                        formData.noise_type === key ? type.color : colors.border,
                    },
                  ]}
                  onPress={() => handleNoiseTypeSelect(key as Report['noise_type'])}
                >
                  <MaterialIcons
                    name={type.icon as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color={formData.noise_type === key ? type.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.noiseTypeButtonText,
                      {
                        color: formData.noise_type === key ? type.color : colors.textSecondary,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[
                styles.descriptionInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Describe the noise situation..."
              placeholderTextColor={colors.textDisabled}
              value={formData.description}
              onChangeText={handleDescriptionChange}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            {/* Media */}
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleMediaAdd}
            >
              <MaterialIcons name="add-photo-alternate" size={20} color={colors.primary} />
              <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                Add Photo
              </Text>
            </TouchableOpacity>

            {/* Anonymous Toggle */}
            <TouchableOpacity
              style={[styles.anonymousToggle, { backgroundColor: colors.surface }]}
              onPress={handleAnonymousToggle}
            >
              <MaterialIcons
                name={formData.is_anonymous ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={formData.is_anonymous ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.anonymousText, { color: colors.text }]}>
                Submit anonymously
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: colors.text }]}>
              Review & Submit
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Please review your report before submitting
            </Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Location:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Noise Level:</Text>
                <Text style={[styles.reviewValue, { color: noiseUtils.getNoiseColor(formData.noise_db) }]}>
                  {noiseUtils.formatDb(formData.noise_db)}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Type:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {NOISE_TYPES[formData.noise_type]?.label || formData.noise_type}
                </Text>
              </View>

              {formData.description && (
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Description:</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>
                    {formData.description}
                  </Text>
                </View>
              )}

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Anonymous:</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.is_anonymous ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <Text style={[styles.submitNote, { color: colors.textSecondary }]}>
              Your report will help identify noise pollution hotspots and contribute to making your city quieter.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Report Noise
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.prevButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handlePrev}
          disabled={currentStep === 1}
        >
          <Text style={[styles.footerButtonText, { color: colors.text }]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentStep < steps.length ? (
          <TouchableOpacity
            style={[styles.footerButton, styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.footerButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.submitButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleSubmit}
            disabled={isCreatingReport}
          >
            {isCreatingReport ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.footerButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  updateLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateLocationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  noiseMeter: {
    marginBottom: 16,
  },
  measurementInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  measurementText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  measurementSubtext: {
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noiseTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  noiseTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '48%',
  },
  noiseTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 100,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  anonymousText: {
    fontSize: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 14,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitNote: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  prevButton: {
    borderWidth: 1,
  },
  nextButton: {
    // Styles applied via props
  },
  submitButton: {
    // Styles applied via props
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
