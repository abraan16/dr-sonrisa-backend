-- 1. Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Patients Table (CRM Core)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    "pushName" VARCHAR,
    metadata JSONB,
    tags TEXT[],
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    -- Lead Follow-up Fields
    status VARCHAR DEFAULT 'lead', -- 'lead' | 'patient' | 'stopped'
    "followUpStatus" VARCHAR DEFAULT 'pending', -- 'pending' | 'completed' | 'stopped'
    "followUpCount" INT DEFAULT 0,
    "lastInteractionAt" TIMESTAMP DEFAULT NOW(),

    -- Human Handoff Fields
    "botStatus" VARCHAR DEFAULT 'active', -- 'active' | 'paused'
    "handoffAt" TIMESTAMP,
    "lastHumanResponseAt" TIMESTAMP
);

-- 3. Interactions Table (Chat History)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID REFERENCES patients(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    "mediaType" VARCHAR DEFAULT 'text',
    -- embedding vector(1536), -- Uncomment if using vectors in DB
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Appointments Table (Calendar)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID REFERENCES patients(id) ON DELETE CASCADE,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP NOT NULL,
    status VARCHAR DEFAULT 'scheduled', -- 'scheduled' | 'cancelled' | 'completed'
    "googleEventId" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Promotions Table (Dynamic Marketing)
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR NOT NULL,
    description TEXT NOT NULL,
    "discountText" VARCHAR,
    "validFrom" TIMESTAMP,
    "validUntil" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 6. Clinic Alerts Table (Operational Notices)
CREATE TABLE IF NOT EXISTS clinic_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL, -- 'closure', 'warning', 'info'
    message TEXT NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 7. System Settings Table (White Label Configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL, -- 'prices', 'hours', 'location', 'doctor_info', 'payment_methods'
    value TEXT NOT NULL,
    description TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 8. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_interactions_patient_id ON interactions("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments("startTime");
