BEGIN;

DO $$ BEGIN
    CREATE TYPE enum_technologies_category AS ENUM ('hardware', 'software', 'design', 'fabrication', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS technologies (
    id serial PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    category enum_technologies_category DEFAULT 'other',
    icon varchar,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Asegurar que payload_locked_documents_rels tenga la columna FK
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS technologies_id integer;
CREATE INDEX IF NOT EXISTS idx_pldr_technologies ON payload_locked_documents_rels(technologies_id);

COMMIT;
