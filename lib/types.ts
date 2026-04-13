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
  user_id?: string;
  latitude: number;
  longitude: number;
  noise_db: number;
  noise_type: 'traffic' | 'construction' | 'events' | 'industrial' | 'other';
  description?: string;
  media_urls?: string[];
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  latitude: number;
  longitude: number;
  noise_db: number;
  noise_type: Report['noise_type'];
  description?: string;
  media_urls?: string[];
  is_anonymous: boolean;
}

export interface UpdateReportData {
  noise_type?: Report['noise_type'];
  description?: string;
  media_urls?: string[];
  is_anonymous?: boolean;
}
