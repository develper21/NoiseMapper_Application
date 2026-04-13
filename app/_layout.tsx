import { Stack, useRouter, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../components/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';
import { API_BASE_URL } from '../constants/Config';
import { toastConfig } from '../utils/notifications';

/**
 * Root layout for the NoiseMapper app
 * Sets up navigation, authentication, and global providers
 */

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
    },
  },
});

export const unstable_settings = {
  // Ensure that reloading on `/auth` keeps a back button present
  initialRouteName: 'index',
};

export default function RootLayout() {
  const { isReady, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // This effect handles the navigation once everything is ready
    if (!isReady || !isNavigationReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login page if not authenticated
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from the login page if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady, isNavigationReady]);

  // Developer debug: surface API configuration
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[startup] API_BASE_URL=', API_BASE_URL);
    } catch (e) {
      // ignore in production
    }
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <View 
              style={{ flex: 1 }} 
              onLayout={() => setIsNavigationReady(true)}
            >
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/index" options={{ headerShown: false }} />
                <Stack.Screen name="report" options={{ presentation: 'modal' }} />
              </Stack>
            </View>
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Redirect is handled by AuthProvider within its own useEffect
