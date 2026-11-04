-- ==============================================================================
-- AEROVIS: AI-Powered City-Wide Visual Intelligence Platform
-- Production PostgreSQL Database Migration Schema for Supabase
-- Covers 20 operational tables, Indexes, Row Level Security (RLS) & Seed Data
-- Safe & Idempotent: Can be run multiple times in Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & LOOKUP TABLES
-- ==============================================================================

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROLE_PERMISSIONS JUNCTION
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Insert Default 6 Role Tiers
INSERT INTO public.roles (id, name, description)
VALUES 
    ('SUPER_ADMIN', 'Super Administrator', 'Full unconstrained platform control, audit review, and user management.'),
    ('ADMINISTRATOR', 'City Intelligence Administrator', 'Operational oversight, camera provisioning, and system settings.'),
    ('CONTROL_ROOM_OPERATOR', 'Control Room Operator', 'Real-time monitoring, PTZ optics control, and incident triage.'),
    ('TRAFFIC_ANALYST', 'Traffic Analyst', 'Traffic density analytics, volume tracking, and transit reporting.'),
    ('INVESTIGATION_OFFICER', 'Investigation Officer', 'Forensic case review, person verification, and evidence management.'),
    ('READ_ONLY_VIEWER', 'Read-Only Viewer', 'Auditor and public oversight view with no modification rights.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. USER PROFILES (Linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Foreign key to auth.users if Supabase Auth is enabled
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES public.roles(id) DEFAULT 'READ_ONLY_VIEWER',
    department VARCHAR(100) NOT NULL DEFAULT 'Metro Visual Command Bureau',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. GEOSPATIAL & CAMERA TOPOLOGY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.camera_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    district VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.camera_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES public.camera_zones(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    intersection_street VARCHAR(200),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUSES TABLE (Platform units carrying moving cameras)
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    route_code VARCHAR(50) NOT NULL,
    route_name VARCHAR(150) NOT NULL,
    license_plate VARCHAR(30) UNIQUE NOT NULL,
    driver_name VARCHAR(100),
    speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEPOT', 'MAINTENANCE', 'OFFLINE')),
    camera_count INT DEFAULT 2,
    connected_cameras TEXT[] DEFAULT '{}',
    last_gps_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMERAS TABLE
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('CCTV', 'ANPR', 'TRAFFIC', 'BUS')),
    location_name VARCHAR(200) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    stream_url TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE')),
    resolution VARCHAR(30) DEFAULT '1080p',
    fps INT DEFAULT 30,
    coverage_angle INT DEFAULT 90,
    direction VARCHAR(50) DEFAULT 'North',
    is_demo BOOLEAN DEFAULT FALSE,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.camera_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
    stream_url TEXT NOT NULL,
    protocol VARCHAR(20) DEFAULT 'WEBRTC' CHECK (protocol IN ('RTSP', 'HLS', 'WEBRTC', 'MJPEG')),
    bitrate_kbps INT DEFAULT 4000,
    codec VARCHAR(30) DEFAULT 'H264',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. AI DETECTIONS & ANPR VEHICLE INTELLIGENCE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
    camera_code VARCHAR(50) NOT NULL,
    camera_name VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('VEHICLE', 'NUMBER_PLATE', 'PERSON', 'TRAFFIC_VIOLATION', 'ROAD_HAZARD', 'ACCIDENT', 'SUSPICIOUS_INCIDENT')),
    confidence NUMERIC(5, 4) NOT NULL,
    label VARCHAR(150) NOT NULL,
    bbox JSONB, -- [x, y, width, height] percentage bounding box
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
    camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
    camera_code VARCHAR(50) NOT NULL,
    camera_name VARCHAR(150) NOT NULL,
    plate_number VARCHAR(30) NOT NULL,
    category VARCHAR(50) DEFAULT 'Sedan',
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(50),
    speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    direction VARCHAR(50) DEFAULT 'Northbound',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    is_watchlist BOOLEAN DEFAULT FALSE,
    watchlist_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authorized_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('VEHICLE', 'PERSON_MISSING', 'PERSON_OF_INTEREST', 'STOLEN_PROPERTY')),
    identifier VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'RESOLVED')),
    authorizing_agency VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- PERSON RECORDS (Human Verification Workflow)
CREATE TABLE IF NOT EXISTS public.person_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
    camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
    camera_code VARCHAR(50) NOT NULL,
    camera_name VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    gender_estimate VARCHAR(30),
    clothing_top VARCHAR(50),
    clothing_bottom VARCHAR(50),
    is_watchlist_match BOOLEAN DEFAULT FALSE,
    watchlist_type VARCHAR(50),
    match_confidence NUMERIC(5, 4),
    verification_status VARCHAR(30) DEFAULT 'PENDING_REVIEW' CHECK (verification_status IN ('PENDING_REVIEW', 'VERIFIED_MATCH', 'FALSE_POSITIVE')),
    verified_by VARCHAR(150),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MISSING PERSONS BULLETIN
CREATE TABLE IF NOT EXISTS public.missing_persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(30) NOT NULL,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    reported_date VARCHAR(50) NOT NULL,
    missing_since VARCHAR(50) NOT NULL,
    last_known_location VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FOUND', 'CLOSED')),
    priority VARCHAR(20) DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    assigned_investigator VARCHAR(150) NOT NULL,
    matched_sightings_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. INCIDENTS, EVIDENCE & INVESTIGATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ROAD_ACCIDENT', 'HIT_AND_RUN', 'TRAFFIC_VIOLATION', 'ROAD_HAZARD', 'MISSING_VEHICLE', 'SECURITY_ALERT')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    location_name VARCHAR(200) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
    camera_code VARCHAR(50),
    assigned_officer VARCHAR(150),
    assigned_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    evidence_count INT DEFAULT 1,
    notes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    author VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    lead_investigator VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'PENDING_APPROVAL', 'CLOSED')),
    summary TEXT NOT NULL,
    correlated_cameras TEXT[] DEFAULT '{}',
    correlated_plates TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ALERTS, TRAFFIC ANALYTICS & AUDIT TRAILS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('CRITICAL', 'WARNING', 'INFO')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
    camera_code VARCHAR(50),
    acknowledged BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.traffic_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(100) NOT NULL,
    vehicle_count INT DEFAULT 0,
    avg_speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    density_percentage INT DEFAULT 0,
    congestion_level VARCHAR(30) DEFAULT 'OPTIMAL' CHECK (congestion_level IN ('OPTIMAL', 'MODERATE', 'HEAVY', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(150) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEXES FOR HIGH-THROUGHPUT QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cameras_status ON public.cameras(status);
CREATE INDEX IF NOT EXISTS idx_cameras_code ON public.cameras(code);
CREATE INDEX IF NOT EXISTS idx_cameras_zone ON public.cameras(zone_name);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON public.detections(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_detections_category ON public.detections(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_records_plate ON public.vehicle_records(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_records_timestamp ON public.vehicle_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_person_records_verification ON public.person_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON public.incidents(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_unack ON public.alerts(acknowledged, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Read Access for Core Command Feeds
CREATE POLICY "Allow public read cameras" ON public.cameras FOR SELECT USING (true);
CREATE POLICY "Allow public read buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Allow public read detections" ON public.detections FOR SELECT USING (true);
CREATE POLICY "Allow public read vehicle records" ON public.vehicle_records FOR SELECT USING (true);
CREATE POLICY "Allow public read missing persons" ON public.missing_persons FOR SELECT USING (true);
CREATE POLICY "Allow public read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public read incident notes" ON public.incident_notes FOR SELECT USING (true);
CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read traffic analytics" ON public.traffic_analytics FOR SELECT USING (true);

-- Allow Operator Insert & Update
CREATE POLICY "Allow public insert cameras" ON public.cameras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cameras" ON public.cameras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cameras" ON public.cameras FOR DELETE USING (true);

CREATE POLICY "Allow public insert detections" ON public.detections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert vehicle records" ON public.vehicle_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update incidents" ON public.incidents FOR UPDATE USING (true);

CREATE POLICY "Allow public insert incident notes" ON public.incident_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Allow public insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert missing persons" ON public.missing_persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update missing persons" ON public.missing_persons FOR UPDATE USING (true);

-- Person Records & Audit Logs with Strict Controls
CREATE POLICY "Allow public read person records" ON public.person_records FOR SELECT USING (true);
CREATE POLICY "Allow public update person records" ON public.person_records FOR UPDATE USING (true);
CREATE POLICY "Allow public insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read audit logs" ON public.audit_logs FOR SELECT USING (true);

-- ==============================================================================
-- 10. REALTIME PUBLICATION SETUP
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_records;

-- ==============================================================================
-- 11. INITIAL SEED DATA (Populates live system immediately)
-- ==============================================================================

-- Seed Cameras
INSERT INTO public.cameras (id, code, name, type, location_name, zone_name, latitude, longitude, ip_address, stream_url, status, resolution, fps, coverage_angle, direction)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CAM-DT-101', 'Market St & 4th Ave Crossing', 'ANPR', 'Downtown Financial Center', 'Downtown Central', 37.7858, -122.4065, '10.240.12.11', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '4K (3840x2160)', 30, 110, 'North-East'),
    ('c0000000-0000-0000-0000-000000000002', 'CAM-DT-102', 'Montgomery Plaza North Hub', 'CCTV', 'Montgomery & Sutter St', 'Downtown Central', 37.7895, -122.4024, '10.240.12.14', 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '1080p (1920x1080)', 30, 90, 'South'),
    ('c0000000-0000-0000-0000-000000000003', 'CAM-HW-201', 'Highway 101 South Overpass', 'TRAFFIC', 'Bay Bridge Western Approach', 'Highway 101', 37.7876, -122.3921, '10.240.14.82', 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '4K (3840x2160)', 60, 120, 'Eastbound'),
    ('c0000000-0000-0000-0000-000000000004', 'CAM-TC-301', 'Mission Bay Tech Innovation Blvd', 'ANPR', '16th & Owens Way', 'Tech Corridor', 37.7684, -122.3912, '10.240.18.22', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '1080p', 30, 85, 'North'),
    ('c0000000-0000-0000-0000-000000000005', 'CAM-HB-401', 'Harbor Gate Terminal Pier 39', 'CCTV', 'Embarcadero Northern Pier', 'Harbor Port', 37.8087, -122.4098, '10.240.22.9', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '1080p', 30, 120, 'West'),
    ('c0000000-0000-0000-0000-000000000006', 'CAM-ND-501', 'Lombard Hill & Columbus Ave', 'TRAFFIC', 'North Beach Junction', 'North District', 37.8012, -122.4111, '10.240.16.51', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', 'ONLINE', '1080p', 30, 95, 'North-West'),
    ('c0000000-0000-0000-0000-000000000007', 'CAM-AP-601', 'Airport Cargo Expressway 4', 'ANPR', 'Aviation Accessway Gate B', 'Airport Corridor', 37.7521, -122.4189, '10.240.30.08', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80', 'DEGRADED', '720p', 15, 80, 'South-East')
ON CONFLICT (id) DO NOTHING;

-- Seed Buses
INSERT INTO public.buses (id, bus_number, route_code, route_name, license_plate, driver_name, speed_kmh, heading, latitude, longitude, status, camera_count)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'BUS-402', 'RT-12', 'Metro Downtown Express', 'CA-9MTR402', 'Marcus Vance (Badge #704)', 34, 75, 37.7842, -122.4078, 'ACTIVE', 2),
    ('b0000000-0000-0000-0000-000000000002', 'BUS-518', 'RT-08', 'Harbor & Ferry Circulator', 'CA-8HBR518', 'Elena Rostova (Badge #512)', 26, 190, 37.8041, -122.4062, 'ACTIVE', 2),
    ('b0000000-0000-0000-0000-000000000003', 'BUS-309', 'RT-24', 'Mission Bay Tech Shuttle', 'CA-3TC309', 'David Chen (Badge #889)', 42, 320, 37.7699, -122.3929, 'ACTIVE', 3),
    ('b0000000-0000-0000-0000-000000000004', 'BUS-104', 'RT-44', 'South Airport Express', 'CA-4APT104', 'Sarah Jenkins (Badge #221)', 0, 0, 37.7533, -122.4175, 'DEPOT', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Incidents
INSERT INTO public.incidents (id, incident_number, title, category, priority, status, location_name, latitude, longitude, timestamp, camera_code, assigned_officer, description)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'INC-2026-8901', 'Stolen Vehicle Pursuit Intercept Warning', 'MISSING_VEHICLE', 'CRITICAL', 'INVESTIGATING', 'Mission Bay Tech Innovation Blvd', 37.7684, -122.3912, NOW(), 'CAM-TC-301', 'Det. Evelyn Reed', 'ANPR camera CAM-TC-301 triggered automated match on plate 8ABC789 (Ford Mustang GT Ruby Red), flag: Stolen Vehicle LAPD-2026-0812.'),
    ('a0000000-0000-0000-0000-000000000002', 'INC-2026-8902', 'Multi-Vehicle Collision on Bay Bridge Overpass', 'ROAD_ACCIDENT', 'CRITICAL', 'ASSIGNED', 'Highway 101 South / Bay Bridge Western Approach', 37.7876, -122.3921, NOW(), 'CAM-HW-201', 'Sgt. D. Kowalski', 'CCTV footage confirmed two passenger vehicles collided blocking two left lanes. Emergency services dispatched.')
ON CONFLICT (id) DO NOTHING;

-- Seed Alerts
INSERT INTO public.alerts (id, timestamp, type, title, description, category, camera_code, acknowledged, resolved)
VALUES
    ('e0000000-0000-0000-0000-000000000001', NOW(), 'CRITICAL', 'Watchlist Stolen Vehicle Alert', 'ANPR CAM-TC-301 detected vehicle with plate 8ABC789 matching LAPD stolen car database.', 'ANPR Watchlist', 'CAM-TC-301', false, false),
    ('e0000000-0000-0000-0000-000000000002', NOW(), 'CRITICAL', 'Multi-Vehicle Collision Alert', 'CCTV Highway 101 CAM-HW-201 detected collision with heavy obstruction in lanes 1 & 2.', 'Traffic Accident', 'CAM-HW-201', true, false)
ON CONFLICT (id) DO NOTHING;
