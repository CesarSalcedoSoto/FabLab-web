-- ============================================================
-- FabLab Migration: Equipment Enhancements + ProjectDocuments
-- ============================================================
-- Date: 2026-03-06
-- 
-- Changes:
--   1. Equipment: add equipment_code, owner_area, technical_responsible_id,
--      last_review_date columns
--   2. Equipment: expand status enum (in-use, inactive, borrowed)
--   3. Equipment: expand category enum (power-tools, computing)
--   4. Equipment: create maintenance_history and failure_history array tables
--   5. ProjectDocuments: create new collection table + enums
--   6. Update payload_locked_documents_rels for project_documents FK
--
-- SAFE: Uses IF NOT EXISTS / ADD IF NOT EXISTS everywhere.
-- Can be executed multiple times without error.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Equipment: Add new status enum values
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in-use' AND enumtypid = 'enum_equipment_status'::regtype) THEN
        ALTER TYPE enum_equipment_status ADD VALUE 'in-use';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inactive' AND enumtypid = 'enum_equipment_status'::regtype) THEN
        ALTER TYPE enum_equipment_status ADD VALUE 'inactive';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'borrowed' AND enumtypid = 'enum_equipment_status'::regtype) THEN
        ALTER TYPE enum_equipment_status ADD VALUE 'borrowed';
    END IF;
END $$;

-- ============================================================
-- 2. Equipment: Add new category enum values
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'power-tools' AND enumtypid = 'enum_equipment_category'::regtype) THEN
        ALTER TYPE enum_equipment_category ADD VALUE 'power-tools';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'computing' AND enumtypid = 'enum_equipment_category'::regtype) THEN
        ALTER TYPE enum_equipment_category ADD VALUE 'computing';
    END IF;
END $$;

-- ============================================================
-- 3. Equipment: Add new columns
-- ============================================================
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_code varchar;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS owner_area varchar;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS technical_responsible_id integer;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_review_date timestamp(3) with time zone;

-- Unique index on equipment_code (only if doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'equipment_equipment_code_idx') THEN
        CREATE UNIQUE INDEX equipment_equipment_code_idx ON equipment (equipment_code) WHERE equipment_code IS NOT NULL;
    END IF;
END $$;

-- Foreign key for technical_responsible -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'equipment_technical_responsible_id_users_id_fk'
    ) THEN
        ALTER TABLE equipment ADD CONSTRAINT equipment_technical_responsible_id_users_id_fk
            FOREIGN KEY (technical_responsible_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index for technical_responsible_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_equipment_technical_responsible_id') THEN
        CREATE INDEX idx_equipment_technical_responsible_id ON equipment (technical_responsible_id);
    END IF;
END $$;

-- ============================================================
-- 4. Equipment: Maintenance History array table
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_equipment_maintenance_history_maintenance_type') THEN
        CREATE TYPE enum_equipment_maintenance_history_maintenance_type AS ENUM (
            'preventive', 'corrective', 'calibration', 'cleaning', 'upgrade'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS equipment_maintenance_history (
    id serial PRIMARY KEY,
    _order integer NOT NULL,
    _parent_id integer NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    date timestamp(3) with time zone NOT NULL,
    maintenance_type enum_equipment_maintenance_history_maintenance_type NOT NULL,
    description varchar NOT NULL,
    performed_by varchar,
    cost numeric,
    next_maintenance_date timestamp(3) with time zone
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'equipment_maintenance_history_order_parent_id_idx') THEN
        CREATE INDEX equipment_maintenance_history_order_parent_id_idx 
            ON equipment_maintenance_history (_order, _parent_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'equipment_maintenance_history_parent_id_fk') THEN
        CREATE INDEX equipment_maintenance_history_parent_id_fk 
            ON equipment_maintenance_history (_parent_id);
    END IF;
END $$;

-- ============================================================
-- 5. Equipment: Failure History array table
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_equipment_failure_history_severity') THEN
        CREATE TYPE enum_equipment_failure_history_severity AS ENUM (
            'low', 'medium', 'high', 'critical'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS equipment_failure_history (
    id serial PRIMARY KEY,
    _order integer NOT NULL,
    _parent_id integer NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    date timestamp(3) with time zone NOT NULL,
    severity enum_equipment_failure_history_severity NOT NULL,
    description varchar NOT NULL,
    reported_by varchar,
    resolved boolean DEFAULT false,
    resolution varchar,
    resolved_date timestamp(3) with time zone
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'equipment_failure_history_order_parent_id_idx') THEN
        CREATE INDEX equipment_failure_history_order_parent_id_idx 
            ON equipment_failure_history (_order, _parent_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'equipment_failure_history_parent_id_fk') THEN
        CREATE INDEX equipment_failure_history_parent_id_fk 
            ON equipment_failure_history (_parent_id);
    END IF;
END $$;

-- ============================================================
-- 6. ProjectDocuments: Create document_type enum
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_project_documents_document_type') THEN
        CREATE TYPE enum_project_documents_document_type AS ENUM (
            'technical', 'manual', 'report', 'minutes', 'trl-evaluation', 'other'
        );
    END IF;
END $$;

-- ============================================================
-- 7. ProjectDocuments: Create table
-- ============================================================
CREATE TABLE IF NOT EXISTS project_documents (
    id serial PRIMARY KEY,
    title varchar NOT NULL,
    project_id integer NOT NULL,
    document_type enum_project_documents_document_type DEFAULT 'technical',
    description varchar,
    file_id integer,
    version varchar DEFAULT '1.0',
    version_notes varchar,
    previous_version_id integer,
    uploaded_by_id integer,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

-- Foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_documents_project_id_projects_id_fk'
    ) THEN
        ALTER TABLE project_documents ADD CONSTRAINT project_documents_project_id_projects_id_fk
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_documents_file_id_media_id_fk'
    ) THEN
        ALTER TABLE project_documents ADD CONSTRAINT project_documents_file_id_media_id_fk
            FOREIGN KEY (file_id) REFERENCES media(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_documents_previous_version_id_fk'
    ) THEN
        ALTER TABLE project_documents ADD CONSTRAINT project_documents_previous_version_id_fk
            FOREIGN KEY (previous_version_id) REFERENCES project_documents(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_documents_uploaded_by_id_users_id_fk'
    ) THEN
        ALTER TABLE project_documents ADD CONSTRAINT project_documents_uploaded_by_id_users_id_fk
            FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'project_documents_project_idx') THEN
        CREATE INDEX project_documents_project_idx ON project_documents (project_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'project_documents_file_idx') THEN
        CREATE INDEX project_documents_file_idx ON project_documents (file_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'project_documents_uploaded_by_idx') THEN
        CREATE INDEX project_documents_uploaded_by_idx ON project_documents (uploaded_by_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'project_documents_created_at_idx') THEN
        CREATE INDEX project_documents_created_at_idx ON project_documents (created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'project_documents_updated_at_idx') THEN
        CREATE INDEX project_documents_updated_at_idx ON project_documents (updated_at);
    END IF;
END $$;

-- ============================================================
-- 8. payload_locked_documents_rels: Add FK for project_documents
-- ============================================================
ALTER TABLE payload_locked_documents_rels 
    ADD COLUMN IF NOT EXISTS project_documents_id integer;

COMMIT;

-- Verify
SELECT 'Equipment columns:' AS info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'equipment' AND column_name IN ('equipment_code', 'owner_area', 'technical_responsible_id', 'last_review_date')
ORDER BY column_name;

SELECT 'Equipment status enum:' AS info;
SELECT unnest(enum_range(NULL::enum_equipment_status));

SELECT 'Equipment category enum:' AS info;
SELECT unnest(enum_range(NULL::enum_equipment_category));

SELECT 'project_documents table exists:' AS info;
SELECT count(*) AS row_count FROM project_documents;
