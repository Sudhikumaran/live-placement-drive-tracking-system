-- Live Placement Drive Tracker Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (for development - remove in production)
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS shortlist_rounds CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS placement_drives CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- STUDENT TABLE
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  cgpa DECIMAL(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  graduation_year INTEGER NOT NULL,
  resume_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_grad_year ON students(graduation_year);
CREATE INDEX idx_students_email ON students(email);

-- COMPANY TABLE
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website TEXT,
  hr_contact_name VARCHAR(255),
  hr_contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_email ON companies(email);

-- ADMIN TABLE
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admins_email ON admins(email);

-- PLACEMENT DRIVE TABLE
CREATE TABLE placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  job_role VARCHAR(255) NOT NULL,
  ctc DECIMAL(10,2) CHECK (ctc > 0),
  location VARCHAR(255),
  eligible_departments TEXT[], -- Array of departments
  min_cgpa DECIMAL(3,2) CHECK (min_cgpa >= 0 AND min_cgpa <= 10),
  total_rounds INTEGER DEFAULT 1 CHECK (total_rounds > 0),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'COMPLETED')),
  drive_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drives_company ON placement_drives(company_id);
CREATE INDEX idx_drives_status ON placement_drives(status);
CREATE INDEX idx_drives_date ON placement_drives(drive_date);

-- APPLICATION TABLE
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
  current_round INTEGER DEFAULT 0,
  overall_status VARCHAR(50) DEFAULT 'APPLIED' CHECK (
    overall_status IN ('APPLIED', 'IN_PROGRESS', 'SELECTED', 'REJECTED', 'OFFER_ACCEPTED', 'OFFER_DECLINED')
  ),
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, drive_id) -- Prevent duplicate applications
);

CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_drive ON applications(drive_id);
CREATE INDEX idx_applications_status ON applications(overall_status);

-- SHORTLIST ROUND TABLE
CREATE TABLE shortlist_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'SELECTED', 'REJECTED')),
  round_name VARCHAR(255), -- e.g., "Aptitude Test", "Technical Interview"
  feedback TEXT,
  updated_by UUID, -- Company HR who updated
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(application_id, round_number)
);

CREATE INDEX idx_rounds_application ON shortlist_rounds(application_id);
CREATE INDEX idx_rounds_status ON shortlist_rounds(status);

-- NOTIFICATION TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Student, Company, or Admin ID
  user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('STUDENT', 'COMPANY', 'ADMIN')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- SHORTLIST_UPDATE, APPLICATION_RECEIVED, DRIVE_CREATED, etc.
  related_drive_id UUID REFERENCES placement_drives(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, user_role);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- OFFER TABLE
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  ctc DECIMAL(10,2) NOT NULL CHECK (ctc > 0),
  joining_date DATE,
  offer_letter_url TEXT,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(application_id) -- One offer per application
);

CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_application ON offers(application_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drives_updated_at BEFORE UPDATE ON placement_drives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON shortlist_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial admin account (password: admin123)
-- In production, this should be changed immediately
INSERT INTO admins (email, password_hash, full_name, role) VALUES
('admin@college.edu', '$2a$10$X8Y9Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y', 'System Administrator', 'ADMIN');

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
