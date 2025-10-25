import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../components/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';
import ConfigError from '../components/ConfigError';
import { HAS_SUPABASE } from '../constants/Config';

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

  // Developer debug: surface whether Supabase config is available (masked)
  try {
    const mask = (s?: string) => (s ? `${s.slice(0, 8)}...${s.slice(-8)}` : 'undefined');
    // eslint-disable-next-line no-console
    console.log('[startup] HAS_SUPABASE=', HAS_SUPABASE);
    // eslint-disable-next-line no-console
    console.log('[startup] SUPABASE_URL=', mask(process.env.EXPO_PUBLIC_SUPABASE_URL));
  } catch (e) {
    // ignore in production
  }

  // If supabase config missing, show helpful error instead of infinite loader
  if (!HAS_SUPABASE) {
    return <ConfigError message="Missing Supabase configuration (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)" />;
  }

  // Only show loading screen during initial auth setup
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Don't block rendering for general loading states
  // This prevents the infinite loading screen issue

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack screenOptions={{
              headerShown: false,
            }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="report" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
