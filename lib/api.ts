import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/Config';
import * as SecureStore from 'expo-secure-store';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.removeToken();
          // Redirect to login or handle auth state
        }
        return Promise.reject(error);
      }
    );
  }

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  // Authentication endpoints
  async signIn(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.client.post('/auth/signin', { email, password });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Sign in failed',
      };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.client.post('/auth/signup', { email, password, name });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Sign up failed',
      };
    }
  }

  async signOut(): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/auth/signout');
      this.removeToken();
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Sign out failed',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get user',
      };
    }
  }

  // User profile endpoints
  async updateProfile(updates: { name?: string; avatar_url?: string }): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put('/user/profile', updates);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
      };
    }
  }

  // Report endpoints
  async createReport(reportData: any): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/reports', reportData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create report',
      };
    }
  }

  async getReports(params?: any): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/reports', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get reports',
      };
    }
  }

  async getReport(id: string): Promise<ApiResponse> {
    try {
      const response = await this.client.get(`/reports/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get report',
      };
    }
  }

  async updateReport(id: string, updates: any): Promise<ApiResponse> {
    try {
      const response = await this.client.put(`/reports/${id}`, updates);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update report',
      };
    }
  }

  async deleteReport(id: string): Promise<ApiResponse> {
    try {
      const response = await this.client.delete(`/reports/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete report',
      };
    }
  }
}

export const apiClient = new ApiClient();
