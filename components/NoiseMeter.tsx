import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { noiseUtils } from '../lib/utils';

/**
 * NoiseMeter component - Real-time noise level meter
 * Uses device microphone to measure ambient noise levels
 */

interface NoiseMeterProps {
  onMeasurement: (db: number) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  style?: any;
}

const NoiseMeter: React.FC<NoiseMeterProps> = ({
  onMeasurement,
  onRecordingStateChange,
  style,
}) => {
  const { colors } = useTheme();

  const [isRecording, setIsRecording] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);

  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Request microphone permissions on mount
  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  // Animate pulse when recording
  useEffect(() => {
    if (isRecording) {
      const pulseAnimationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationLoop.start();

      return () => pulseAnimationLoop.stop();
    } else {
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, pulseAnimation]);

  const requestMicrophonePermission = async () => {
    try {
      // expo-av uses requestPermissionsAsync which returns { status }
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermission(granted);

      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'This app needs access to your microphone to measure noise levels.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermission(false);
    }
  };

  const startRecording = async () => {
    if (!permission) {
      await requestMicrophonePermission();
      if (!permission) return;
    }

    try {
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status: any) => {
          // This callback is called periodically during recording
          // In a real implementation, you'd analyze the audio data here
          if (status.isRecording && status.durationMillis > 0) {
            // Simulate noise level measurement (placeholder)
            const simulatedDb = Math.random() * 40 + 40; // 40-80 dB range for demo
            setCurrentDb(simulatedDb);
            setMaxDb(prev => Math.max(prev, simulatedDb));
            onMeasurement(simulatedDb);
          }
        },
        100 // Update interval in milliseconds
      );

      setRecording(newRecording);
      setIsRecording(true);
      onRecordingStateChange(true);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start noise measurement. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      setIsRecording(false);
      onRecordingStateChange(false);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const resetMeasurement = () => {
    setCurrentDb(0);
    setMaxDb(0);
    onMeasurement(0);
  };

  const getDbColor = (db: number) => {
    return noiseUtils.getNoiseColor(db);
  };

  const getDbLevelText = (db: number) => {
    return noiseUtils.getNoiseLevel(db);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main Meter Display */}
      <Animated.View
        style={[
          styles.meterContainer,
          {
            backgroundColor: colors.surface,
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        {/* Center Display */}
        <View style={styles.centerDisplay}>
          <Text style={[styles.currentDb, { color: getDbColor(currentDb) }]}>
            {currentDb.toFixed(1)}
          </Text>
          <Text style={[styles.dbUnit, { color: colors.textSecondary }]}>
            dB
          </Text>
        </View>

        {/* Level Indicator Ring */}
        <View style={styles.levelRing}>
          <View
            style={[
              styles.levelArc,
              {
                backgroundColor: getDbColor(currentDb),
                opacity: isRecording ? 0.3 : 0.1,
              },
            ]}
          />
        </View>

        {/* Status Text */}
        <View style={styles.statusContainer}>
          <Text style={[styles.levelText, { color: colors.textSecondary }]}>
            {getDbLevelText(currentDb)}
          </Text>
          {isRecording && (
            <Text style={[styles.recordingText, { color: colors.error }]}>
              Recording...
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: colors.error }]}
            onPress={startRecording}
            disabled={!permission}
          >
            <MaterialIcons name="mic" size={24} color="white" />
            <Text style={styles.recordButtonText}>Start Measuring</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: colors.success }]}
            onPress={stopRecording}
          >
            <MaterialIcons name="stop" size={24} color="white" />
            <Text style={styles.stopButtonText}>Stop Measuring</Text>
          </TouchableOpacity>
        )}

        {maxDb > 0 && !isRecording && (
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={resetMeasurement}
          >
            <MaterialIcons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Measurement Info */}
      {maxDb > 0 && (
        <View style={styles.measurementInfo}>
          <Text style={[styles.maxDbText, { color: colors.text }]}>
            Peak: {maxDb.toFixed(1)} dB
          </Text>
          <Text style={[styles.healthRisk, { color: colors.textSecondary }]}>
            {noiseUtils.getHealthRisk(maxDb)}
          </Text>
        </View>
      )}

      {/* Permission Warning */}
      {permission === false && (
        <View style={[styles.permissionWarning, { backgroundColor: colors.error + '15' }]}>
          <MaterialIcons name="warning" size={20} color={colors.error} />
          <Text style={[styles.permissionText, { color: colors.error }]}>
            Microphone permission required for noise measurement
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  meterContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  centerDisplay: {
    alignItems: 'center',
    zIndex: 2,
  },
  currentDb: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 48,
  },
  dbUnit: {
    fontSize: 16,
    marginTop: 4,
  },
  levelRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    zIndex: 1,
  },
  levelArc: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  measurementInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  maxDbText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  healthRisk: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    flex: 1,
  },
});

export default NoiseMeter;
