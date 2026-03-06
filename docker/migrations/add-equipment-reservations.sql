-- Migration: Add equipment_reservations table
-- Date: 2026-03-06
-- Description: Create the equipment-reservations table for Payload CMS

-- Create enum for equipment reservation status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_equipment_reservations_status') THEN
        CREATE TYPE enum_equipment_reservations_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
    END IF;
END
$$;

-- Create equipment_reservations table
CREATE TABLE IF NOT EXISTS equipment_reservations (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(255) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    date VARCHAR(10) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    description TEXT NOT NULL,
    status enum_equipment_reservations_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_reservations_equipment_id ON equipment_reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_reservations_user ON equipment_reservations("user");
CREATE INDEX IF NOT EXISTS idx_equipment_reservations_date ON equipment_reservations(date);
CREATE INDEX IF NOT EXISTS idx_equipment_reservations_status ON equipment_reservations(status);

-- Done
SELECT 'equipment_reservations table created successfully' AS result;
