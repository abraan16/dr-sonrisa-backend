-- ========================================================
-- SCRIPT DE REPARACIÓN TOTAL (Dr. Sonrisa AI)
-- Ejecutar este bloque completo en el SQL Editor de Supabase
-- ========================================================

-- 1. Asegurar tabla de Configuración y Alertas con nombres correctos
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    message TEXT NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. BLOQUE DE REPARACIÓN AGRESIVO (Renombrar todas las columnas con problemas de mayúsculas)
DO $$
BEGIN
    -- Tabla: clinic_alerts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_alerts' AND column_name = 'startdate') THEN
        ALTER TABLE clinic_alerts RENAME COLUMN startdate TO "startDate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_alerts' AND column_name = 'enddate') THEN
        ALTER TABLE clinic_alerts RENAME COLUMN enddate TO "endDate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_alerts' AND column_name = 'isactive') THEN
        ALTER TABLE clinic_alerts RENAME COLUMN isactive TO "isActive";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_alerts' AND column_name = 'createdat') THEN
        ALTER TABLE clinic_alerts RENAME COLUMN createdat TO "createdAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_alerts' AND column_name = 'updatedat') THEN
        ALTER TABLE clinic_alerts RENAME COLUMN updatedat TO "updatedAt";
    END IF;

    -- Tabla: system_settings
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'updatedat') THEN
        ALTER TABLE system_settings RENAME COLUMN updatedat TO "updatedAt";
    END IF;

    -- Tabla: promotions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'discounttext') THEN
        ALTER TABLE promotions RENAME COLUMN discounttext TO "discountText";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'validfrom') THEN
        ALTER TABLE promotions RENAME COLUMN validfrom TO "validFrom";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'validuntil') THEN
        ALTER TABLE promotions RENAME COLUMN validuntil TO "validUntil";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'isactive') THEN
        ALTER TABLE promotions RENAME COLUMN isactive TO "isActive";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'createdat') THEN
        ALTER TABLE promotions RENAME COLUMN createdat TO "createdAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'updatedat') THEN
        ALTER TABLE promotions RENAME COLUMN updatedat TO "updatedAt";
    END IF;
END $$;
