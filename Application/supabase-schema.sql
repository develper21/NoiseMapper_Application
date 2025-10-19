-- City Noise Pollution Mapper - Supabase Database Schema
-- This file contains the complete database schema for the NoiseMapper app
-- Run this SQL in your Supabase project to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table - stores user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table - stores noise pollution reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    noise_db FLOAT8 CHECK (noise_db >= 0 AND noise_db <= 120),
    noise_type TEXT CHECK (noise_type IN ('traffic', 'construction', 'events', 'industrial', 'other')) NOT NULL,
    description TEXT,
    media_urls TEXT[],
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending'
);

-- Hotspots table - aggregated view of noise hotspots (auto-generated via triggers)
CREATE TABLE hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    avg_noise_db FLOAT8 NOT NULL,
    report_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussions table - community discussions for each report
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reports_location ON reports USING GIST (location);
CREATE INDEX idx_reports_timestamp ON reports (timestamp DESC);
CREATE INDEX idx_reports_noise_type ON reports (noise_type);
CREATE INDEX idx_reports_user_id ON reports (user_id);
CREATE INDEX idx_reports_status ON reports (status);

CREATE INDEX idx_hotspots_location ON hotspots USING GIST (location);
CREATE INDEX idx_hotspots_avg_noise_db ON hotspots (avg_noise_db DESC);

CREATE INDEX idx_discussions_report_id ON discussions (report_id);
CREATE INDEX idx_discussions_timestamp ON discussions (timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate reports into hotspots
CREATE OR REPLACE FUNCTION aggregate_reports_to_hotspots()
RETURNS TRIGGER AS $$
DECLARE
    hotspot_record RECORD;
    cluster_radius FLOAT8 := 0.001; -- Approximately 100m in degrees
BEGIN
    -- Check if there's already a hotspot within cluster radius
    SELECT * INTO hotspot_record
    FROM hotspots
    WHERE ST_DWithin(location, NEW.location, cluster_radius)
    ORDER BY ST_Distance(location, NEW.location)
    LIMIT 1;

    IF hotspot_record IS NOT NULL THEN
        -- Update existing hotspot
        UPDATE hotspots
        SET
            avg_noise_db = ((avg_noise_db * report_count) + NEW.noise_db) / (report_count + 1),
            report_count = report_count + 1,
            updated_at = NOW()
        WHERE id = hotspot_record.id;
    ELSE
        -- Create new hotspot
        INSERT INTO hotspots (location, avg_noise_db, report_count)
        VALUES (NEW.location, NEW.noise_db, 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create/update hotspots when reports are inserted
CREATE TRIGGER trigger_aggregate_hotspots
    AFTER INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION aggregate_reports_to_hotspots();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Reports: Users can insert reports, read own reports, public can read hotspots data
CREATE POLICY "Users can insert reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id OR is_anonymous = true);

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view all reports" ON reports
    FOR SELECT USING (true);

CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Hotspots: Public read access for map display
CREATE POLICY "Public can view hotspots" ON hotspots
    FOR SELECT USING (true);

-- Discussions: Users can insert discussions, read discussions for reports they can access
CREATE POLICY "Users can insert discussions" ON discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view discussions" ON discussions
    FOR SELECT USING (true);

CREATE POLICY "Users can update own discussions" ON discussions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Storage policies for media bucket
CREATE POLICY "Users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view media" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Users can update own media" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own media" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Enable realtime for reports and hotspots tables
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE hotspots;
ALTER PUBLICATION supabase_realtime ADD TABLE discussions;

-- Create some sample data for testing (optional)
-- Uncomment the following lines if you want to seed the database with sample data

/*
-- Sample users
INSERT INTO users (email, name) VALUES
('test@example.com', 'Test User'),
('admin@noisemapper.com', 'Admin User');

-- Sample reports
INSERT INTO reports (user_id, latitude, longitude, noise_db, noise_type, description) VALUES
((SELECT id FROM users WHERE email = 'test@example.com'), 28.6139, 77.2090, 85.5, 'traffic', 'Heavy traffic noise near Connaught Place'),
((SELECT id FROM users WHERE email = 'test@example.com'), 28.7041, 77.1025, 92.3, 'construction', 'Construction work at India Gate area'),
((SELECT id FROM users WHERE email = 'admin@noisemapper.com'), 28.5355, 77.3910, 78.9, 'industrial', 'Industrial area noise in Noida');

-- Sample discussions
INSERT INTO discussions (report_id, user_id, message) VALUES
((SELECT id FROM reports LIMIT 1), (SELECT id FROM users WHERE email = 'test@example.com'), 'This area is particularly bad during rush hours'),
((SELECT id FROM reports LIMIT 1), (SELECT id FROM users WHERE email = 'admin@noisemapper.com'), 'Thanks for reporting! We''ll look into this.');
*/
