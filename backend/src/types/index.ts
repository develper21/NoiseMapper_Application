export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface CreateReportRequest {
  latitude: number;
  longitude: number;
  noise_db: number;
  noise_type: 'traffic' | 'construction' | 'events' | 'industrial' | 'other';
  description?: string;
  media_urls?: string[];
  is_anonymous: boolean;
}

export interface GetReportsQuery {
  user_id?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  offset?: number;
  noise_type?: string;
}
