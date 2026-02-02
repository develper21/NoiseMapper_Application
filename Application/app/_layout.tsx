import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../components/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';
import { API_BASE_URL } from '../constants/Config';

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
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const { isReady, isLoading, isAuthenticated } = useAuth();

  // Developer debug: surface API configuration
  try {
    // eslint-disable-next-line no-console
    console.log('[startup] API_BASE_URL=', API_BASE_URL);
  } catch (e) {
    // ignore in production
  }

  // Only show loading screen during initial auth setup
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack screenOptions={{
              headerShown: false,
            }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/index" options={{ headerShown: false }} />
              <Stack.Screen name="report" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
