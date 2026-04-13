import { useEffect, useState } from 'react';
import { apiClient, User } from '../lib/api';
import { useAppStore } from '../lib/store';
import * as Haptics from 'expo-haptics';
import { showNotification } from '../utils/notifications';
import * as SecureStore from 'expo-secure-store';

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check for stored token
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        setUser(null);
        setAuthenticated(false);
        return;
      }

      // Set token in API client
      apiClient.setToken(token);

      // Get current user
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        setAuthenticated(true);
        showNotification('success', 'Welcome back!', 'You have been automatically signed in');
      } else {
        // Invalid token, remove it
        await SecureStore.deleteItemAsync('auth_token');
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await SecureStore.deleteItemAsync('auth_token');
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<AuthResult> => {
    setLoading(true);

    try {
      const response = await apiClient.signUp(email, password, name);

      if (response.success && response.data) {
        // Store token
        await SecureStore.setItemAsync('auth_token', response.data.token);
        
        // Update state
        setUser(response.data.user);
        setAuthenticated(true);
        
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        return { user: response.data.user, error: null };
      } else {
        return { user: null, error: { message: response.error || 'Sign up failed' } };
      }
    } catch (error: any) {
      return {
        user: null,
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);

    try {
      const response = await apiClient.signIn(email, password);

      if (response.success && response.data) {
        // Store token
        await SecureStore.setItemAsync('auth_token', response.data.token);
        
        // Update state
        setUser(response.data.user);
        setAuthenticated(true);
        
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        return { user: response.data.user, error: null };
      } else {
        return { user: null, error: { message: response.error || 'Sign in failed' } };
      }
    } catch (error: any) {
      return {
        user: null,
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    // TODO: Implement Google OAuth with custom backend
    return {
      user: null,
      error: { message: 'Google sign in not yet implemented', code: 'not_implemented' }
    };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true);

    try {
      await apiClient.signOut();
      await SecureStore.deleteItemAsync('auth_token');
      
      setUser(null);
      setAuthenticated(false);
      
      showNotification('info', 'Signed out', 'You have been signed out');
      
      return { error: null };
    } catch (error: any) {
      return {
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    // TODO: Implement password reset with custom backend
    return {
      error: { message: 'Password reset not yet implemented', code: 'not_implemented' }
    };
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string }): Promise<{ error: AuthError | null }> => {
    if (!user) {
      return { error: { message: 'No user logged in', code: 'not_authenticated' } };
    }

    try {
      const response = await apiClient.updateProfile(updates);

      if (response.success && response.data) {
        setUser(response.data);
        return { error: null };
      } else {
        return { error: { message: response.error || 'Failed to update profile' } };
      }
    } catch (error: any) {
      return {
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    }
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitializing,

    // Actions
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,

    // Utilities
    isReady: !isInitializing,
  };
};
