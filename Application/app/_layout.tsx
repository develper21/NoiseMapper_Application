import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../components/AuthProvider';
import LoadingScreen from '../components/LoadingScreen';

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

export default function RootLayout() {
  const { isReady, isLoading } = useAuth();

  // Show loading screen while auth is initializing
  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* Let file-system based routing handle available screens.
                Avoid declaring Stack.Screen entries here because they
                can conflict with routes created from the `app/` folder
                and cause warnings like "No route named 'auth' exists"
                or "Too many screens defined". If you need a modal
                presentation for a specific file, create a parallel
                file with the appropriate naming (for example
                `report.tsx` already exists and will be picked up).
            */}
            <Stack />
            <StatusBar style="auto" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
