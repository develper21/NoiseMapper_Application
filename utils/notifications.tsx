import React, { JSX } from 'react';
import { Alert, Platform, View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors as themeColors } from '@/theme/colors';

type NotificationType = 'success' | 'error' | 'info';

const colors = {
  success: (themeColors as any).success ?? '#4CAF50',
  error: (themeColors as any).error ?? '#F44336',
  info: (themeColors as any).info ?? '#2196F3',
};

export const showNotification = (
  type: NotificationType,
  title: string,
  message: string
) => {
  if (Platform.OS === 'web') {
    Alert.alert(title, message);
  } else {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 30,
      bottomOffset: 40,
    });
  }
};

export const toastConfig: Record<string, (props: any) => JSX.Element | null> = {
  success: ({ text1, text2 }: any) => (
    <View style={styles.successToast}>
      <MaterialIcons name="check-circle" size={24} color="#fff" />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={styles.errorToast}>
      <MaterialIcons name="error" size={24} color="#fff" />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={styles.infoToast}>
      <MaterialIcons name="info" size={24} color="#fff" />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{text1}</Text>
        {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastContent: {
    flexDirection: 'column',
    marginLeft: 8,
    flexShrink: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
});
