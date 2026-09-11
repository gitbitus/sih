-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM types
CREATE TYPE user_role AS ENUM ('head_admin', 'admin', 'sub_admin', 'merchant');
CREATE TYPE request_status AS ENUM ('submitted', 'assigned', 'inspection_scheduled', 'inspected', 'approved', 'rejected', 'certified', 'expired');
CREATE TYPE visit_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE complaint_status AS ENUM ('filed', 'under_review', 'resolved', 'dismissed');
CREATE TYPE notification_type AS ENUM ('assignment', 'inspection_scheduled', 'approved', 'rejected', 'certificate_issued', 'certificate_expiring', 'complaint_filed', 'general');
CREATE TYPE certificate_status AS ENUM ('active', 'expired', 'revoked', 'suspended');

-- Tables
CREATE TABLE head_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    region VARCHAR,
    is_active BOOL DEFAULT true,
    force_password_change BOOL DEFAULT true,
    created_by UUID REFERENCES head_admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE sub_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    region VARCHAR,
    employee_id VARCHAR,
    is_active BOOL DEFAULT true,
    force_password_change BOOL DEFAULT true,
    created_by UUID, -- either admin or head_admin
    created_by_role user_role,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    business_name VARCHAR NOT NULL,
    owner_name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    country_code VARCHAR(5) DEFAULT '+91',
    is_active BOOL DEFAULT true,
    email_verified BOOL DEFAULT false,
    email_verification_token VARCHAR,
    email_verification_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE instrument_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    is_active BOOL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    instrument_type_id UUID REFERENCES instrument_types(id),
    make VARCHAR,
    model VARCHAR,
    serial_number VARCHAR,
    year_of_manufacture INT,
    last_calibration_date DATE,
    operating_address_street VARCHAR,
    operating_address_city VARCHAR,
    operating_address_state VARCHAR,
    operating_address_pin VARCHAR,
    operating_address_lat DECIMAL(10,8),
    operating_address_lng DECIMAL(11,8),
    business_reg_number VARCHAR,
    preferred_inspection_start DATE,
    preferred_inspection_end DATE,
    fee_amount DECIMAL(10,2) DEFAULT 500.00,
    fee_paid BOOLEAN DEFAULT true,
    payment_reference VARCHAR(100),
    collected_at TIMESTAMPTZ,
    estimated_return_date DATE,
    returned_at TIMESTAMPTZ,
    status request_status DEFAULT 'submitted',
    assigned_admin_id UUID REFERENCES admins(id),
    assigned_sub_admin_id UUID REFERENCES sub_admins(id),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE request_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
    document_type VARCHAR NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT,
    file_size INT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sub_admin_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_admin_id UUID REFERENCES sub_admins(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOL DEFAULT false,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sub_admin_id, date)
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES verification_requests(id),
    sub_admin_id UUID REFERENCES sub_admins(id),
    admin_id UUID REFERENCES admins(id),
    scheduled_date DATE NOT NULL,
    return_date DATE,
    collected_at TIMESTAMPTZ,
    status visit_status DEFAULT 'scheduled',
    otp_code VARCHAR(6),
    otp_verified BOOL DEFAULT false,
    delivery_otp_code VARCHAR(6),
    delivery_otp_verified BOOL DEFAULT false,
    returned_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID UNIQUE REFERENCES visits(id),
    observations TEXT NOT NULL,
    structured_data JSONB,
    decision VARCHAR CHECK (decision IN ('approve', 'reject')),
    decision_reason TEXT,
    signature_path TEXT,
    inspected_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR UNIQUE NOT NULL,
    request_id UUID UNIQUE REFERENCES verification_requests(id),
    merchant_id UUID REFERENCES merchants(id),
    issued_by_admin_id UUID REFERENCES admins(id),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    qr_code_path TEXT,
    pdf_path TEXT,
    status certificate_status DEFAULT 'active',
    revocation_reason TEXT,
    expiry_notified_30 BOOL DEFAULT false,
    expiry_notified_15 BOOL DEFAULT false,
    expiry_notified_7 BOOL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (expiry_date > issue_date)
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    complainant_name VARCHAR NOT NULL,
    complainant_contact VARCHAR NOT NULL,
    description TEXT NOT NULL,
    photo_path TEXT,
    status complaint_status DEFAULT 'filed',
    admin_notes TEXT,
    resolved_by UUID REFERENCES admins(id),
    filed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL,
    recipient_role user_role NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOL DEFAULT false,
    related_entity_type VARCHAR,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    actor_role user_role NOT NULL,
    actor_email VARCHAR,
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_role user_role NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR
);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_role user_role NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ver_req_merchant_id ON verification_requests(merchant_id);
CREATE INDEX idx_ver_req_status ON verification_requests(status);
CREATE INDEX idx_ver_req_assigned_sub_admin_id ON verification_requests(assigned_sub_admin_id);
CREATE INDEX idx_ver_req_submitted_at ON verification_requests(submitted_at);

CREATE INDEX idx_visits_sub_admin_id ON visits(sub_admin_id);
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);
CREATE INDEX idx_visits_status ON visits(status);

CREATE INDEX idx_cert_merchant_id ON certificates(merchant_id);
CREATE INDEX idx_cert_status ON certificates(status);
CREATE INDEX idx_cert_expiry_date ON certificates(expiry_date);

CREATE INDEX idx_notif_recipient_id_is_read ON notifications(recipient_id, is_read);

CREATE INDEX idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

CREATE INDEX idx_refresh_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);

-- Seed Instrument Types
INSERT INTO instrument_types (name, description) VALUES
    ('Weighing Scale', 'General purpose weighing scales'),
    ('Fuel Dispenser', 'Pumps used for dispensing liquid fuel'),
    ('Gas Meter', 'Meters used for measuring gas consumption'),
    ('Water Meter', 'Meters used for measuring water consumption'),
    ('Taxi Meter', 'Meters used in taxis for fare calculation'),
    ('Electricity Meter', 'Meters used for measuring electricity consumption'),
    ('Clinical Thermometer', 'Thermometers used for medical purposes'),
    ('Pressure Gauge', 'Instruments used for measuring pressure')
ON CONFLICT (name) DO NOTHING;
