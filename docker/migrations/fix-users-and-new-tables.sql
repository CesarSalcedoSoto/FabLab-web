-- ============================================================
-- FabLab Production DB Fix: Users Schema + New Tables
-- ============================================================
-- Problema: Login falla porque Payload busca tablas/columnas del
-- Users collection que no existen en producción:
--   - users_personal_skills
--   - users_technical_domain
--   - users_weekly_schedule
--   - users_weekly_schedule_time_ranges
--   - Columnas faltantes en users (avatar_id, bio, etc.)
--
-- También incluye tablas nuevas: rooms, room_reservations, meetings
--
-- USO (desde el servidor):
--   docker exec -i fablab-db psql -U fablab -d fablab_blog < migrations/fix-users-and-new-tables.sql
--
-- SEGURO: Usa IF NOT EXISTS / DO $$ en todo. Se puede ejecutar múltiples veces.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Enums necesarios para Users
-- ============================================================

DO $$ BEGIN
    CREATE TYPE enum_users_category AS ENUM ('leadership', 'specialist', 'collaborator', 'docente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_users_education_status AS ENUM ('graduated', 'studying', 'titled', 'bachelor', 'masters', 'doctorate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- enum_users_role ya debería existir, pero por si acaso:
DO $$ BEGIN
    CREATE TYPE enum_users_role AS ENUM ('admin', 'editor', 'author', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- PARTE 2: Columnas faltantes en tabla users
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_position varchar DEFAULT '50% 50%';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_in_team boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category enum_users_category DEFAULT 'specialist';
ALTER TABLE users ADD COLUMN IF NOT EXISTS docente_responsable_id integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_status enum_users_education_status DEFAULT 'graduated';
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_mode varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "order" numeric DEFAULT 99;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github varchar;

-- Índice y FK para avatar_id
CREATE INDEX IF NOT EXISTS users_avatar_idx ON users(avatar_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_avatar_id_media_id_fk'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_avatar_id_media_id_fk
            FOREIGN KEY (avatar_id) REFERENCES media(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índice y FK para docente_responsable_id
CREATE INDEX IF NOT EXISTS idx_users_docente_resp ON users(docente_responsable_id);


-- ============================================================
-- PARTE 3: Tablas array de Users
-- ============================================================

-- users_personal_skills
CREATE TABLE IF NOT EXISTS users_personal_skills (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    skill character varying,
    CONSTRAINT users_personal_skills_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_users_personal_skills_order ON users_personal_skills(_order);
CREATE INDEX IF NOT EXISTS idx_users_personal_skills_parent ON users_personal_skills(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_personal_skills__parent_id_fkey'
    ) THEN
        ALTER TABLE users_personal_skills ADD CONSTRAINT users_personal_skills__parent_id_fkey
            FOREIGN KEY (_parent_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- users_technical_domain
CREATE TABLE IF NOT EXISTS users_technical_domain (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    skill character varying,
    CONSTRAINT users_technical_domain_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_users_technical_domain_order ON users_technical_domain(_order);
CREATE INDEX IF NOT EXISTS idx_users_technical_domain_parent ON users_technical_domain(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_technical_domain__parent_id_fkey'
    ) THEN
        ALTER TABLE users_technical_domain ADD CONSTRAINT users_technical_domain__parent_id_fkey
            FOREIGN KEY (_parent_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- users_weekly_schedule
CREATE TABLE IF NOT EXISTS users_weekly_schedule (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    day character varying,
    active boolean DEFAULT true,
    CONSTRAINT users_weekly_schedule_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_users_weekly_schedule_order ON users_weekly_schedule(_order);
CREATE INDEX IF NOT EXISTS idx_users_weekly_schedule_parent ON users_weekly_schedule(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_weekly_schedule__parent_id_fkey'
    ) THEN
        ALTER TABLE users_weekly_schedule ADD CONSTRAINT users_weekly_schedule__parent_id_fkey
            FOREIGN KEY (_parent_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- users_weekly_schedule_time_ranges (nested array, parent = users_weekly_schedule)
CREATE TABLE IF NOT EXISTS users_weekly_schedule_time_ranges (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL,
    start_time character varying,
    end_time character varying,
    CONSTRAINT users_weekly_schedule_time_ranges_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_users_wstr_order ON users_weekly_schedule_time_ranges(_order);
CREATE INDEX IF NOT EXISTS idx_users_wstr_parent ON users_weekly_schedule_time_ranges(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_weekly_schedule_time_ranges__parent_id_fkey'
    ) THEN
        ALTER TABLE users_weekly_schedule_time_ranges ADD CONSTRAINT users_weekly_schedule_time_ranges__parent_id_fkey
            FOREIGN KEY (_parent_id) REFERENCES users_weekly_schedule(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 4: Meetings
-- ============================================================

DO $$ BEGIN
    CREATE TYPE enum_meetings_status AS ENUM ('programada', 'cancelada', 'realizada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS meetings (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    project_id integer,
    date timestamp(3) with time zone,
    time character varying,
    description character varying,
    status enum_meetings_status DEFAULT 'programada',
    notes character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'meetings_project_id_fkey'
    ) THEN
        ALTER TABLE meetings ADD CONSTRAINT meetings_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ============================================================
-- PARTE 5: Rooms (Salas)
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
    id serial PRIMARY KEY,
    name character varying NOT NULL,
    location character varying,
    capacity numeric DEFAULT 10,
    description character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS rooms_created_at_idx ON rooms(created_at);
CREATE INDEX IF NOT EXISTS rooms_updated_at_idx ON rooms(updated_at);

-- rooms_amenities (array)
CREATE TABLE IF NOT EXISTS rooms_amenities (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    value character varying,
    CONSTRAINT rooms_amenities_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS rooms_amenities_order_idx ON rooms_amenities(_order);
CREATE INDEX IF NOT EXISTS rooms_amenities_parent_id_idx ON rooms_amenities(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'rooms_amenities_parent_id_fk'
    ) THEN
        ALTER TABLE rooms_amenities ADD CONSTRAINT rooms_amenities_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- rooms_equipment (array)
CREATE TABLE IF NOT EXISTS rooms_equipment (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    name character varying NOT NULL,
    category character varying DEFAULT 'other',
    quantity numeric DEFAULT 1,
    CONSTRAINT rooms_equipment_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS rooms_equipment_order_idx ON rooms_equipment(_order);
CREATE INDEX IF NOT EXISTS rooms_equipment_parent_id_idx ON rooms_equipment(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'rooms_equipment_parent_id_fk'
    ) THEN
        ALTER TABLE rooms_equipment ADD CONSTRAINT rooms_equipment_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 6: Room Reservations (Reservas de Salas)
-- ============================================================

CREATE TABLE IF NOT EXISTS room_reservations (
    id serial PRIMARY KEY,
    room_id integer,
    room_name character varying,
    user_id integer,
    user_name character varying,
    date character varying NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    purpose character varying NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS room_reservations_room_idx ON room_reservations(room_id);
CREATE INDEX IF NOT EXISTS room_reservations_user_idx ON room_reservations(user_id);
CREATE INDEX IF NOT EXISTS room_reservations_date_idx ON room_reservations(date);
CREATE INDEX IF NOT EXISTS room_reservations_created_at_idx ON room_reservations(created_at);
CREATE INDEX IF NOT EXISTS room_reservations_updated_at_idx ON room_reservations(updated_at);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'room_reservations_room_id_rooms_id_fk'
    ) THEN
        ALTER TABLE room_reservations ADD CONSTRAINT room_reservations_room_id_rooms_id_fk
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'room_reservations_user_id_users_id_fk'
    ) THEN
        ALTER TABLE room_reservations ADD CONSTRAINT room_reservations_user_id_users_id_fk
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- room_reservations_companions (array)
CREATE TABLE IF NOT EXISTS room_reservations_companions (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    name character varying,
    CONSTRAINT room_reservations_companions_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS room_reservations_companions_order_idx ON room_reservations_companions(_order);
CREATE INDEX IF NOT EXISTS room_reservations_companions_parent_id_idx ON room_reservations_companions(_parent_id);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'room_reservations_companions_parent_id_fk'
    ) THEN
        ALTER TABLE room_reservations_companions ADD CONSTRAINT room_reservations_companions_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES room_reservations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 7: Equipment - columna location_id (apunta a rooms)
-- ============================================================

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location_id integer;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'equipment_location_id_fkey'
    ) THEN
        ALTER TABLE equipment ADD CONSTRAINT equipment_location_id_fkey
            FOREIGN KEY (location_id) REFERENCES rooms(id) ON DELETE SET NULL;
    END IF;
END $$;

-- inventory_items - columna location_id (apunta a rooms)
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location_id integer;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'inventory_items_location_id_fkey'
    ) THEN
        ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_location_id_fkey
            FOREIGN KEY (location_id) REFERENCES rooms(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ============================================================
-- PARTE 8: payload_locked_documents_rels - FKs nuevas
-- ============================================================

ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS meetings_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS rooms_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS room_reservations_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS project_documents_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS technologies_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS equipment_reservations_id integer;

CREATE INDEX IF NOT EXISTS idx_pldr_meetings ON payload_locked_documents_rels(meetings_id);
CREATE INDEX IF NOT EXISTS idx_pldr_rooms ON payload_locked_documents_rels(rooms_id);
CREATE INDEX IF NOT EXISTS idx_pldr_room_res ON payload_locked_documents_rels(room_reservations_id);
CREATE INDEX IF NOT EXISTS idx_pldr_proj_docs ON payload_locked_documents_rels(project_documents_id);
CREATE INDEX IF NOT EXISTS idx_pldr_technologies ON payload_locked_documents_rels(technologies_id);
CREATE INDEX IF NOT EXISTS idx_pldr_equip_res ON payload_locked_documents_rels(equipment_reservations_id);

-- FKs para las columnas nuevas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_meetings_fk') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_meetings_fk
            FOREIGN KEY (meetings_id) REFERENCES meetings(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_rooms_id_fkey') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_rooms_id_fkey
            FOREIGN KEY (rooms_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_room_reservations_id_fkey') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_room_reservations_id_fkey
            FOREIGN KEY (room_reservations_id) REFERENCES room_reservations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_project_documents_fk') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_project_documents_fk
            FOREIGN KEY (project_documents_id) REFERENCES project_documents(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_technologies_fk') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_technologies_fk
            FOREIGN KEY (technologies_id) REFERENCES technologies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_locked_documents_rels_equipment_reservations_fk') THEN
        ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_equipment_reservations_fk
            FOREIGN KEY (equipment_reservations_id) REFERENCES equipment_reservations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 9: payload_preferences_rels - FKs nuevas
-- ============================================================

ALTER TABLE payload_preferences_rels ADD COLUMN IF NOT EXISTS equipment_reservations_id integer;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payload_preferences_rels_equipment_reservations_fk') THEN
        ALTER TABLE payload_preferences_rels ADD CONSTRAINT payload_preferences_rels_equipment_reservations_fk
            FOREIGN KEY (equipment_reservations_id) REFERENCES equipment_reservations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 10: Verificación
-- ============================================================

-- Verificar tablas de users
SELECT 'users_personal_skills' AS tabla, count(*) AS filas FROM users_personal_skills
UNION ALL
SELECT 'users_technical_domain', count(*) FROM users_technical_domain
UNION ALL
SELECT 'users_weekly_schedule', count(*) FROM users_weekly_schedule
UNION ALL
SELECT 'users_weekly_schedule_time_ranges', count(*) FROM users_weekly_schedule_time_ranges;

-- Verificar que las columnas nuevas de users existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('avatar_id', 'image_position', 'bio', 'job_title', 'show_in_team',
                       'category', 'docente_responsable_id', 'experience', 'education_status',
                       'availability_mode', 'order', 'linkedin', 'github')
ORDER BY column_name;

-- Verificar tablas nuevas
SELECT 'meetings' AS tabla, count(*) AS filas FROM meetings
UNION ALL
SELECT 'rooms', count(*) FROM rooms
UNION ALL
SELECT 'room_reservations', count(*) FROM room_reservations;

COMMIT;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- Después de ejecutar, reiniciar fablab-web:
--   docker restart fablab-web
-- ============================================================
