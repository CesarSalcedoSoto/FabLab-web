-- Add 'docente' to the enum_users_category enum in PostgreSQL
-- This value was added in the Payload collection config but not synced to the DB

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'docente'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_category')
    ) THEN
        ALTER TYPE enum_users_category ADD VALUE 'docente';
    END IF;
END
$$;
