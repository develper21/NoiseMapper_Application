import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/Config';

// Initialize Supabase client with React Native AsyncStorage adapter
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Log a clear warning for developers — this will help during development
  // and avoid leaving the app in an indefinite loading state.
  // The UI will show a ConfigError screen (app/_layout.tsx) when these
  // values are not present.
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Supabase functionality will be limited.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types for database entities
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location?: any; // PostGIS point (generated)
  noise_db: number;
  noise_type: 'traffic' | 'construction' | 'events' | 'industrial' | 'other';
  description?: string;
  media_urls?: string[];
  timestamp: string;
  is_anonymous: boolean;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface Hotspot {
  id: string;
  location: any; // PostGIS point
  avg_noise_db: number;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  report_id: string;
  user_id: string;
  message: string;
  timestamp: string;
}

// Authentication hooks and utilities
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (data.user && !error) {
      // Create user profile in users table
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name,
      });
    }

    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'noisemapper://auth/callback',
      },
    });

    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get user profile from users table
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Update user profile
  updateUserProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },
};

// Reports data operations
export const reports = {
  // Get all reports with optional filters
  getAll: async (filters?: {
    noise_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    let query = supabase.from('reports').select(`
      *,
      users:user_id(id, name, email)
    `);

    if (filters?.noise_type) {
      query = query.eq('noise_type', filters.noise_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    return { data, error };
  },

  // Get reports within a radius of a point
  getNearby: async (latitude: number, longitude: number, radiusKm: number = 5) => {
    const { data, error } = await supabase
      .rpc('get_nearby_reports', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
      });

    return { data, error };
  },

  // Get user's own reports
  getUserReports: async (userId: string) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    return { data, error };
  },

  // Create a new report
  create: async (report: Omit<Report, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    return { data, error };
  },

  // Update report status
  updateStatus: async (reportId: string, status: Report['status']) => {
    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();

    return { data, error };
  },
};

// Hotspots data operations
export const hotspots = {
  // Get all hotspots
  getAll: async (limit?: number) => {
    let query = supabase.from('hotspots').select('*');

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('avg_noise_db', { ascending: false });

    return { data, error };
  },

  // Get hotspots within a radius
  getNearby: async (latitude: number, longitude: number, radiusKm: number = 10) => {
    const { data, error } = await supabase
      .rpc('get_nearby_hotspots', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
      });

    return { data, error };
  },
};

// Discussions data operations
export const discussions = {
  // Get discussions for a specific report
  getForReport: async (reportId: string) => {
    const { data, error } = await supabase
      .from('discussions')
      .select(`
        *,
        users:user_id(id, name, email)
      `)
      .eq('report_id', reportId)
      .order('timestamp', { ascending: true });

    return { data, error };
  },

  // Create a new discussion message
  create: async (discussion: Omit<Discussion, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('discussions')
      .insert(discussion)
      .select()
      .single();

    return { data, error };
  },
};

// Storage operations for media files
export const storage = {
  // Upload a file to the media bucket
  uploadFile: async (fileName: string, file: any, mimeType: string) => {
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: false,
      });

    return { data, error };
  },

  // Get public URL for a file
  getPublicUrl: (fileName: string) => {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // Delete a file
  deleteFile: async (fileName: string) => {
    const { error } = await supabase.storage
      .from('media')
      .remove([fileName]);

    return { error };
  },
};

// Realtime subscriptions
export const subscriptions = {
  // Subscribe to new reports
  onNewReport: (callback: (report: Report) => void) => {
    return supabase
      .channel('reports')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to hotspot updates
  onHotspotUpdate: (callback: (hotspot: Hotspot) => void) => {
    return supabase
      .channel('hotspots')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'hotspots',
        },
        callback
      )
      .subscribe();
  },
};
