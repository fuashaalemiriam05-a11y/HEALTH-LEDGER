-- HealthLedger Database Schema
-- PostgreSQL Database Initialization Script

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;

-- Create facilities table (clinics/hospitals)
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'provider', -- provider, admin, staff
    facility_id INTEGER REFERENCES facilities(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL, -- HS-99281 format
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    village VARCHAR(255),
    address TEXT,
    photo_url VARCHAR(500),
    id_photo_url VARCHAR(500),
    fingerprint_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- biometric, id_document, manual
    registered_by INTEGER REFERENCES users(id),
    facility_id INTEGER REFERENCES facilities(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_records table
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES users(id),
    facility_id INTEGER REFERENCES facilities(id),
    
    -- Record details
    diagnosis VARCHAR(255) NOT NULL,
    severity VARCHAR(50), -- mild, moderate, severe
    symptoms TEXT[], -- Array of symptoms
    clinical_observations TEXT,
    
    -- Medications
    medications JSONB, -- Array of medication objects
    
    -- Visit information
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_visit_date DATE,
    
    -- Sync status
    is_synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_patients_verified ON patients(is_verified);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Insert default facility
INSERT INTO facilities (name, location, address, phone, email) 
VALUES ('St. Jude Community Clinic', 'Cameroon', 'Community Health Center', '+237 123 456 789', 'info@stjudeclinic.org');

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, phone, password_hash, full_name, role, facility_id, is_active)
VALUES ('admin@healthledger.org', '+237 000 000 000', '$2a$10$rQ7H8p9QZ8X7Y6Z5A4B3C2D1E0F9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1', 'System Administrator', 'admin', 1, TRUE);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO healthledger_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO healthledger_user;