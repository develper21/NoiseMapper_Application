import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name?: string) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.isInitializing) {
      if (!auth.isAuthenticated) {
        router.replace('/auth');
      } else if (pathname === '/auth') {
        router.replace('/(tabs)');
      }
    }
  }, [auth.isAuthenticated, auth.isInitializing, pathname]);

  const value: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    signInWithGoogle: auth.signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
