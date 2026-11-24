-- ====================================================================
-- SMART SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM
-- PostgreSQL Relational Schema
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(10) NOT NULL,
    course VARCHAR(50) NOT NULL,
    academic_year INT NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL,
    attendance NUMERIC(5,2) NOT NULL,
    annual_family_income NUMERIC(12,2) NOT NULL,
    active_arrears INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scholarship_schemes (
    scheme_code VARCHAR(10) PRIMARY KEY,
    scheme_name VARCHAR(100) NOT NULL,
    description TEXT,
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.50,
    min_attendance NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    max_family_income NUMERIC(12,2) NOT NULL DEFAULT 250000.00,
    max_arrears INT NOT NULL DEFAULT 0,
    slab_1_min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 9.00,
    slab_1_max_cgpa NUMERIC(4,2) NOT NULL DEFAULT 10.00,
    slab_1_amount NUMERIC(10,2) NOT NULL DEFAULT 20000.00,
    slab_2_min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 8.00,
    slab_2_max_cgpa NUMERIC(4,2) NOT NULL DEFAULT 8.99,
    slab_2_amount NUMERIC(10,2) NOT NULL DEFAULT 15000.00,
    slab_3_min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.50,
    slab_3_max_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.99,
    slab_3_amount NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    deadline DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scholarship_applications (
    application_id VARCHAR(20) PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    scheme_code VARCHAR(10) NOT NULL REFERENCES scholarship_schemes(scheme_code),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cgpa NUMERIC(4,2) NOT NULL,
    attendance NUMERIC(5,2) NOT NULL,
    annual_family_income NUMERIC(12,2) NOT NULL,
    active_arrears INT NOT NULL DEFAULT 0,
    bank_account_no VARCHAR(30) NOT NULL,
    bank_ifsc VARCHAR(15) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason VARCHAR(100),
    award_amount NUMERIC(10,2) DEFAULT 0,
    batch_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_scheme UNIQUE (student_id, scheme_code)
);

CREATE TABLE IF NOT EXISTS batch_jobs (
    batch_id VARCHAR(20) PRIMARY KEY,
    job_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    return_code VARCHAR(10),
    total_read INT DEFAULT 0,
    total_valid INT DEFAULT 0,
    total_eligible INT DEFAULT 0,
    total_rejected INT DEFAULT 0,
    total_duplicates INT DEFAULT 0,
    total_disbursement NUMERIC(12,2) DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    execution_engine VARCHAR(60) DEFAULT 'GnuCOBOL Linux/Windows Native',
    sysout_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eligibility_results (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(20) NOT NULL REFERENCES batch_jobs(batch_id) ON DELETE CASCADE,
    application_id VARCHAR(20) NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    scheme_code VARCHAR(10) NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL,
    attendance NUMERIC(5,2) NOT NULL,
    annual_family_income NUMERIC(12,2) NOT NULL,
    active_arrears INT NOT NULL,
    status VARCHAR(2) NOT NULL,
    reason_code VARCHAR(20) NOT NULL,
    award_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    processed_date VARCHAR(10),
    processed_time VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disbursement_records (
    disbursement_id VARCHAR(60) PRIMARY KEY,
    batch_id VARCHAR(20) NOT NULL REFERENCES batch_jobs(batch_id) ON DELETE CASCADE,
    application_id VARCHAR(20) NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    award_amount NUMERIC(10,2) NOT NULL,
    bank_account_no VARCHAR(30) NOT NULL,
    bank_ifsc VARCHAR(15) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_date VARCHAR(10),
    utr_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    details JSONB
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department);
CREATE INDEX IF NOT EXISTS idx_apps_student ON scholarship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_elig_batch ON eligibility_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_disb_batch ON disbursement_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_disb_app ON disbursement_records(application_id);
CREATE INDEX IF NOT EXISTS idx_disb_status ON disbursement_records(payment_status);

-- Sequences for collision-free concurrent ID generation
CREATE SEQUENCE IF NOT EXISTS app_id_seq START WITH 100 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS disb_id_seq START WITH 100 INCREMENT BY 1;
