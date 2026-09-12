-- =====================================================================
-- SMART ASSET INSPECTION, DEFECT TRACKING & COMPLIANCE MONITORING SYSTEM
-- PostgreSQL Database Schema (Production DDL)
-- =====================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exists in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS corrective_actions CASCADE;
DROP TABLE IF EXISTS defects CASCADE;
DROP TABLE IF EXISTS gps_logs CASCADE;
DROP TABLE IF EXISTS inspection_evidence CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS inspection_templates CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS inspectors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'INSPECTOR')),
    phone VARCHAR(30),
    avatar_url TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Inspectors Profile Table
CREATE TABLE inspectors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    last_active_at TIMESTAMP WITH TIME ZONE,
    assigned_sites_count INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_SITE', 'OFF_DUTY', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspectors_user_id ON inspectors(user_id);
CREATE INDEX idx_inspectors_employee_code ON inspectors(employee_code);

-- 3. Sites Table (With Geofence)
CREATE TABLE sites (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    site_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    geo_fence_lat DOUBLE PRECISION NOT NULL,
    geo_fence_lng DOUBLE PRECISION NOT NULL,
    geo_fence_radius_meters INT DEFAULT 500 NOT NULL,
    supervisor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sites_code ON sites(code);
CREATE INDEX idx_sites_supervisor ON sites(supervisor_id);

-- 4. Assets Table
CREATE TABLE assets (
    id VARCHAR(36) PRIMARY KEY,
    site_id VARCHAR(36) NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150),
    model_number VARCHAR(100),
    install_date DATE,
    last_maintenance_date DATE,
    criticality VARCHAR(30) DEFAULT 'MEDIUM' CHECK (criticality IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(30) DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'DEGRADED', 'OUT_OF_SERVICE', 'INSPECTION_DUE')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_criticality ON assets(criticality);

-- 5. Inspection Templates Table
CREATE TABLE inspection_templates (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    checklist_json JSONB,
    created_by_user_id VARCHAR(36) REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Checklists Table (Individual Checklist Items)
CREATE TABLE checklists (
    id VARCHAR(36) PRIMARY KEY,
    template_id VARCHAR(36) NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    section_name VARCHAR(150) NOT NULL,
    item_text TEXT NOT NULL,
    input_type VARCHAR(50) NOT NULL CHECK (input_type IN ('PASS_FAIL', 'NUMERIC', 'TEXT', 'MULTIPLE_CHOICE', 'PHOTO')),
    mandatory BOOLEAN DEFAULT TRUE,
    passing_criteria TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklists_template ON checklists(template_id);

-- 7. Inspections Table
CREATE TABLE inspections (
    id VARCHAR(36) PRIMARY KEY,
    template_id VARCHAR(36) NOT NULL REFERENCES inspection_templates(id),
    site_id VARCHAR(36) NOT NULL REFERENCES sites(id),
    inspector_id VARCHAR(36) NOT NULL REFERENCES inspectors(id),
    title VARCHAR(250) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED', 'REJECTED', 'APPROVED')),
    compliance_score DOUBLE PRECISION DEFAULT 0.0,
    total_items_checked INT DEFAULT 0,
    passed_items_count INT DEFAULT 0,
    failed_items_count INT DEFAULT 0,
    geofence_verified BOOLEAN DEFAULT FALSE,
    geofence_distance_meters DOUBLE PRECISION,
    signature_url TEXT,
    supervisor_remarks TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspections_site ON inspections(site_id);
CREATE INDEX idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_date ON inspections(scheduled_date);

-- 8. Inspection Evidence Table
CREATE TABLE inspection_evidence (
    id VARCHAR(36) PRIMARY KEY,
    inspection_id VARCHAR(36) NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    checklist_item_id VARCHAR(36),
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_kb INT,
    caption TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    ai_detected_defect BOOLEAN DEFAULT FALSE,
    ai_confidence DOUBLE PRECISION DEFAULT 0.0,
    ai_analysis_tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidence_inspection ON inspection_evidence(inspection_id);

-- 9. GPS Logs Table
CREATE TABLE gps_logs (
    id VARCHAR(36) PRIMARY KEY,
    inspector_id VARCHAR(36) NOT NULL REFERENCES inspectors(id) ON DELETE CASCADE,
    inspection_id VARCHAR(36) REFERENCES inspections(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    is_within_geofence BOOLEAN DEFAULT FALSE,
    distance_to_site_meters DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gps_inspector ON gps_logs(inspector_id);
CREATE INDEX idx_gps_inspection ON gps_logs(inspection_id);
CREATE INDEX idx_gps_timestamp ON gps_logs(timestamp);

-- 10. Defects Table
CREATE TABLE defects (
    id VARCHAR(36) PRIMARY KEY,
    inspection_id VARCHAR(36) NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    asset_id VARCHAR(36) REFERENCES assets(id) ON DELETE SET NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED')),
    photo_url TEXT,
    location_details TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    risk_score INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_defects_inspection ON defects(inspection_id);
CREATE INDEX idx_defects_asset ON defects(asset_id);
CREATE INDEX idx_defects_severity ON defects(severity);
CREATE INDEX idx_defects_status ON defects(status);

-- 11. Corrective Actions Table
CREATE TABLE corrective_actions (
    id VARCHAR(36) PRIMARY KEY,
    defect_id VARCHAR(36) NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
    assigned_to_user_id VARCHAR(36) REFERENCES users(id),
    action_taken TEXT NOT NULL,
    action_type VARCHAR(100) DEFAULT 'REPAIR',
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED')),
    proof_image_url TEXT,
    verified_by_id VARCHAR(36) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    estimated_cost DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corrective_defect ON corrective_actions(defect_id);
CREATE INDEX idx_corrective_status ON corrective_actions(status);

-- 12. Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'SYSTEM' CHECK (type IN ('ALERT', 'INSPECTION_ASSIGNED', 'DEFECT_CRITICAL', 'ACTION_REQUIRED', 'SYSTEM')),
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 13. Audit Logs Table (Immutable Audit Trail)
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36),
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
