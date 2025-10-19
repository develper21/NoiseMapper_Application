import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { User } from '../lib/supabase';
import * as Haptics from 'expo-haptics';

/**
 * Custom hook for authentication management
 * Handles login, signup, logout, and user session management
 */

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

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          await handleSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }

        setIsInitializing(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session?.user) {
        await handleSignIn(session.user);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const handleSignIn = async (authUser: any) => {
    try {
      // Get user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching user profile:', error);
      }

      const user: User = {
        id: authUser.id,
        email: authUser.email!,
        name: profile?.name || authUser.user_metadata?.name || undefined,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || undefined,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || new Date().toISOString(),
      };

      setUser(user);
      setAuthenticated(true);

      // Haptic feedback for successful sign in
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error handling sign in:', error);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setAuthenticated(false);
  };

  const signUp = async (email: string, password: string, name?: string): Promise<AuthResult> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.message } };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        return {
          user: null,
          error: {
            message: 'Please check your email to confirm your account.',
            code: 'email_confirmation_required'
          }
        };
      }

      return { user: data.user as User, error: null };
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.message } };
      }

      return { user: data.user as User, error: null };
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
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'noisemapper://auth/callback',
        },
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.message } };
      }

      // OAuth will redirect, so we return success here
      return { user: null, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: { message: error.message, code: error.message } };
      }

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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'noisemapper://auth/reset-password',
      });

      if (error) {
        return { error: { message: error.message, code: error.message } };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: { message: error.message || 'An unexpected error occurred', code: 'unknown_error' }
      };
    }
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string }): Promise<{ error: AuthError | null }> => {
    if (!user) {
      return { error: { message: 'No user logged in', code: 'not_authenticated' } };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: { message: error.message, code: error.message } };
      }

      // Update local state
      setUser({ ...user, ...data });

      return { error: null };
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
