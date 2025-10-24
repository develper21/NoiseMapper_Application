-- City Noise Pollution Mapper - Supabase Database Schema
-- This file contains the complete database schema for the NoiseMapper app
-- Run this SQL in your Supabase project to set up the database

-- NOTE: This schema is written for PostgreSQL (Supabase) with PostGIS.
-- Some IDEs or generic SQL parsers may report syntax errors because they
-- assume a different SQL dialect (for example, T-SQL). Run this file in
-- the Supabase SQL editor or psql connected to your Supabase database.

-- Enable necessary extensions (run in a Postgres / Supabase SQL context)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table - stores user information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table - stores noise pollution reports
CREATE TABLE IF NOT EXISTS reports (
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
CREATE TABLE IF NOT EXISTS hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    avg_noise_db FLOAT8 NOT NULL,
    report_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussions table - community discussions for each report
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
-- Create indexes if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reports_location') THEN
        CREATE INDEX idx_reports_location ON reports USING GIST (location);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reports_timestamp') THEN
        CREATE INDEX idx_reports_timestamp ON reports (timestamp DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reports_noise_type') THEN
        CREATE INDEX idx_reports_noise_type ON reports (noise_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reports_user_id') THEN
        CREATE INDEX idx_reports_user_id ON reports (user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_reports_status') THEN
        CREATE INDEX idx_reports_status ON reports (status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hotspots_location') THEN
        CREATE INDEX idx_hotspots_location ON hotspots USING GIST (location);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hotspots_avg_noise_db') THEN
        CREATE INDEX idx_hotspots_avg_noise_db ON hotspots (avg_noise_db DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_discussions_report_id') THEN
        CREATE INDEX idx_discussions_report_id ON discussions (report_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_discussions_timestamp') THEN
        CREATE INDEX idx_discussions_timestamp ON discussions (timestamp DESC);
    END IF;
END$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
-- Create triggers only if they do not already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hotspots_updated_at') THEN
        CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

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
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_aggregate_hotspots') THEN
        CREATE TRIGGER trigger_aggregate_hotspots
            AFTER INSERT ON reports
            FOR EACH ROW
            EXECUTE FUNCTION aggregate_reports_to_hotspots();
    END IF;
END$$;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- The Supabase linter can flag PostGIS internal tables like spatial_ref_sys
-- as exposed without RLS. We don't modify PostGIS internal tables, but
-- to silence the linter and make PostgREST-safe, create a read-only
-- policy for spatial_ref_sys if the table exists in the public schema.
-- NOTE: Some Supabase SQL runners give errors when executing DDL inside DO
-- blocks. To avoid that issue, run the following two statements manually
-- in the Supabase SQL editor (execute them as separate statements):

-- 1) Enable RLS on the PostGIS table (if present):
-- ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- 2) Create a read-only policy to satisfy the linter (run only if policy
-- doesn't already exist):
-- CREATE POLICY allow_read_spatial_ref_sys ON public.spatial_ref_sys FOR SELECT USING (true);

-- Optional: you can check whether the table exists before running the
-- statements using this query in the SQL editor:
-- SELECT EXISTS (
--   SELECT 1 FROM pg_catalog.pg_class c
--   JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
--   WHERE c.relname = 'spatial_ref_sys' AND n.nspname = 'public'
-- );

-- Running the two statements above in the Supabase SQL editor should
-- resolve the "RLS Disabled in Public" linter error you saw.

-- RLS Policies

-- Users: Users can read/update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can view own profile' AND p.polrelid = 'users'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can update own profile' AND p.polrelid = 'users'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
        $pol$;
    END IF;
END$$;

-- Reports: Users can insert reports, read own reports, public can read hotspots data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can insert reports' AND p.polrelid = 'reports'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can insert reports" ON reports
            FOR INSERT WITH CHECK (auth.uid() = user_id OR is_anonymous = true);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can view own reports' AND p.polrelid = 'reports'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can view own reports" ON reports
            FOR SELECT USING (auth.uid() = user_id);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Public can view all reports' AND p.polrelid = 'reports'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Public can view all reports" ON reports
            FOR SELECT USING (true);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can update own reports' AND p.polrelid = 'reports'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can update own reports" ON reports
            FOR UPDATE USING (auth.uid() = user_id);
        $pol$;
    END IF;
END$$;

-- Hotspots: Public read access for map display
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Public can view hotspots' AND p.polrelid = 'hotspots'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Public can view hotspots" ON hotspots
            FOR SELECT USING (true);
        $pol$;
    END IF;
END$$;

-- Discussions: Users can insert discussions, read discussions for reports they can access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can insert discussions' AND p.polrelid = 'discussions'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can insert discussions" ON discussions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can view discussions' AND p.polrelid = 'discussions'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can view discussions" ON discussions
            FOR SELECT USING (true);
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can update own discussions' AND p.polrelid = 'discussions'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can update own discussions" ON discussions
            FOR UPDATE USING (auth.uid() = user_id);
        $pol$;
    END IF;
END$$;

-- Create storage bucket for media files
-- Create storage bucket record if not exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can upload media' AND p.polrelid = 'storage.objects'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can upload media" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can view media' AND p.polrelid = 'storage.objects'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can view media" ON storage.objects
            FOR SELECT USING (bucket_id = 'media');
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can update own media' AND p.polrelid = 'storage.objects'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can update own media" ON storage.objects
            FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
        $pol$;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        WHERE p.polname = 'Users can delete own media' AND p.polrelid = 'storage.objects'::regclass
    ) THEN
        EXECUTE $pol$
        CREATE POLICY "Users can delete own media" ON storage.objects
            FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
        $pol$;
    END IF;
END$$;

-- Enable realtime for reports and hotspots tables (idempotent)
DO $$
BEGIN
    -- reports
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_publication p ON pr.prpubid = p.oid
        WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'reports'::regclass
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reports;
    END IF;
    -- hotspots
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_publication p ON pr.prpubid = p.oid
        WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'hotspots'::regclass
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hotspots;
    END IF;
    -- discussions
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_publication p ON pr.prpubid = p.oid
        WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'discussions'::regclass
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE discussions;
    END IF;
END$$;

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
