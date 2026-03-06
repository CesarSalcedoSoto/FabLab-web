-- ============================================================
-- FabLab Production DB Fix: Schema Sync Migration
-- ============================================================
-- Problema: El código tiene colecciones/campos que la DB no tiene.
-- Causa: push:true no sincronizó correctamente en standalone build.
--
-- USO (desde el servidor):
--   docker exec -i fablab-db psql -U fablab -d fablab_blog < migrations/fix-schema-sync.sql
--
-- SEGURO: Usa IF NOT EXISTS en todo. Se puede ejecutar múltiples veces.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: payload_locked_documents_rels
-- Agregar columnas FK para TODAS las colecciones.
-- Sin estas columnas, cualquier operación CRUD falla.
-- ============================================================

-- Asegurar que la tabla base existe (Payload la crea automáticamente,
-- pero si por alguna razón no existe, la creamos)
CREATE TABLE IF NOT EXISTS payload_locked_documents (
    id serial PRIMARY KEY,
    global_slug varchar,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS payload_locked_documents_rels (
    id serial PRIMARY KEY,
    "order" integer,
    parent_id integer NOT NULL REFERENCES payload_locked_documents(id) ON DELETE CASCADE,
    path varchar NOT NULL
);

-- Agregar TODAS las columnas FK para cada colección
-- (IF NOT EXISTS = seguro ejecutar múltiples veces)
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS users_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS media_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS posts_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS categories_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS blog_subscribers_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS services_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS equipment_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS equipment_requests_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS equipment_usage_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS inventory_items_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS team_members_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS projects_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS events_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS event_registrations_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS event_attendance_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS resources_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS gallery_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS faqs_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS testimonials_id integer;
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS contact_messages_id integer;

-- Índices para las FK (mejoran rendimiento de las consultas de locked docs)
CREATE INDEX IF NOT EXISTS idx_pldr_users ON payload_locked_documents_rels (users_id);
CREATE INDEX IF NOT EXISTS idx_pldr_media ON payload_locked_documents_rels (media_id);
CREATE INDEX IF NOT EXISTS idx_pldr_posts ON payload_locked_documents_rels (posts_id);
CREATE INDEX IF NOT EXISTS idx_pldr_categories ON payload_locked_documents_rels (categories_id);
CREATE INDEX IF NOT EXISTS idx_pldr_blog_subs ON payload_locked_documents_rels (blog_subscribers_id);
CREATE INDEX IF NOT EXISTS idx_pldr_services ON payload_locked_documents_rels (services_id);
CREATE INDEX IF NOT EXISTS idx_pldr_equipment ON payload_locked_documents_rels (equipment_id);
CREATE INDEX IF NOT EXISTS idx_pldr_equip_req ON payload_locked_documents_rels (equipment_requests_id);
CREATE INDEX IF NOT EXISTS idx_pldr_equip_use ON payload_locked_documents_rels (equipment_usage_id);
CREATE INDEX IF NOT EXISTS idx_pldr_inventory ON payload_locked_documents_rels (inventory_items_id);
CREATE INDEX IF NOT EXISTS idx_pldr_team ON payload_locked_documents_rels (team_members_id);
CREATE INDEX IF NOT EXISTS idx_pldr_projects ON payload_locked_documents_rels (projects_id);
CREATE INDEX IF NOT EXISTS idx_pldr_events ON payload_locked_documents_rels (events_id);
CREATE INDEX IF NOT EXISTS idx_pldr_evt_reg ON payload_locked_documents_rels (event_registrations_id);
CREATE INDEX IF NOT EXISTS idx_pldr_evt_att ON payload_locked_documents_rels (event_attendance_id);
CREATE INDEX IF NOT EXISTS idx_pldr_resources ON payload_locked_documents_rels (resources_id);
CREATE INDEX IF NOT EXISTS idx_pldr_gallery ON payload_locked_documents_rels (gallery_id);
CREATE INDEX IF NOT EXISTS idx_pldr_faqs ON payload_locked_documents_rels (faqs_id);
CREATE INDEX IF NOT EXISTS idx_pldr_testimonials ON payload_locked_documents_rels (testimonials_id);
CREATE INDEX IF NOT EXISTS idx_pldr_contact ON payload_locked_documents_rels (contact_messages_id);
CREATE INDEX IF NOT EXISTS idx_pldr_parent ON payload_locked_documents_rels (parent_id);
CREATE INDEX IF NOT EXISTS idx_pldr_path ON payload_locked_documents_rels (path);


-- ============================================================
-- PARTE 2: Tabla events — columnas faltantes
-- Error: column "calendar_color" of relation "events" does not exist
-- ============================================================

-- Enum para calendarColor
DO $$ BEGIN
    CREATE TYPE enum_events_calendar_color AS ENUM ('blue', 'purple', 'green', 'orange', 'pink', 'teal', 'red');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Columnas faltantes en events
ALTER TABLE events ADD COLUMN IF NOT EXISTS calendar_color enum_events_calendar_color DEFAULT 'blue';
ALTER TABLE events ADD COLUMN IF NOT EXISTS enable_direct_registration boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_signature boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_instructor varchar;

-- ============================================================
-- PARTE 3: Tablas de arrays de events que podrían faltar
-- ============================================================

-- Tabla para el campo array "registrationFields" de events
CREATE TABLE IF NOT EXISTS events_registration_fields (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    field_name varchar,
    field_type varchar,
    required boolean DEFAULT false,
    options varchar
);

-- Tabla para el campo array "requirements" de events
CREATE TABLE IF NOT EXISTS events_requirements (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    requirement varchar
);

-- Tabla para el campo array "materials" de events
CREATE TABLE IF NOT EXISTS events_materials (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    material varchar
);

-- Tabla para el campo array "tags" de events
CREATE TABLE IF NOT EXISTS events_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    tag varchar
);


-- ============================================================
-- PARTE 4: Tablas de colecciones que podrían faltar completas
-- (IF NOT EXISTS = seguro si ya existen)
-- ============================================================

-- blog_subscribers
CREATE TABLE IF NOT EXISTS blog_subscribers (
    id serial PRIMARY KEY,
    email varchar NOT NULL,
    active boolean DEFAULT true,
    unsubscribe_token varchar,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_subs_email ON blog_subscribers(email);

-- contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id serial PRIMARY KEY,
    nombre varchar NOT NULL,
    email varchar NOT NULL,
    telefono varchar,
    asunto varchar NOT NULL,
    mensaje varchar NOT NULL,
    estado varchar DEFAULT 'nuevo',
    respuesta varchar,
    fecha_respuesta timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- faqs
DO $$ BEGIN
    CREATE TYPE enum_faqs_category AS ENUM ('general', 'membership', 'services', 'equipment', 'events', 'schedule', 'payments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS faqs (
    id serial PRIMARY KEY,
    question varchar NOT NULL,
    answer jsonb,
    category enum_faqs_category DEFAULT 'general',
    "order" integer,
    published boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id serial PRIMARY KEY,
    author varchar NOT NULL,
    role varchar,
    content varchar NOT NULL,
    avatar_id integer,
    rating numeric,
    project_link_id integer,
    featured boolean DEFAULT false,
    published boolean DEFAULT true,
    "order" integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- gallery
DO $$ BEGIN
    CREATE TYPE enum_gallery_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS gallery (
    id serial PRIMARY KEY,
    title varchar NOT NULL,
    description varchar,
    image_id integer,
    album varchar,
    date timestamp with time zone,
    featured boolean DEFAULT false,
    status enum_gallery_status DEFAULT 'draft',
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- gallery_tags (array field)
CREATE TABLE IF NOT EXISTS gallery_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    tag varchar
);

-- resources
DO $$ BEGIN
    CREATE TYPE enum_resources_type AS ENUM ('document', 'guide', 'tutorial', 'template', 'software', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_resources_visibility AS ENUM ('public', 'authenticated', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_resources_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS resources (
    id serial PRIMARY KEY,
    title varchar NOT NULL,
    slug varchar,
    description varchar,
    type enum_resources_type DEFAULT 'document',
    file_id integer,
    external_url varchar,
    thumbnail_id integer,
    folder varchar,
    visibility enum_resources_visibility DEFAULT 'public',
    downloads numeric DEFAULT 0,
    status enum_resources_status DEFAULT 'draft',
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);

-- resources_tags (array field)
CREATE TABLE IF NOT EXISTS resources_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    tag varchar
);

-- event_registrations
DO $$ BEGIN
    CREATE TYPE enum_event_registrations_status AS ENUM ('pending', 'confirmed', 'cancelled', 'waitlist');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS event_registrations (
    id serial PRIMARY KEY,
    event_id integer,
    full_name varchar NOT NULL,
    last_name varchar,
    email varchar NOT NULL,
    phone varchar,
    institution varchar,
    rut varchar,
    custom_fields jsonb,
    signature varchar,
    status enum_event_registrations_status DEFAULT 'pending',
    notes varchar,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evt_reg_event ON event_registrations(event_id);

-- event_attendance
CREATE TABLE IF NOT EXISTS event_attendance (
    id serial PRIMARY KEY,
    event_id integer,
    registration_id integer,
    attended boolean DEFAULT false,
    check_in_time timestamp with time zone,
    notes varchar,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evt_att_event ON event_attendance(event_id);

-- services
DO $$ BEGIN
    CREATE TYPE enum_services_category AS ENUM ('3d-printing', 'laser-cutting', 'cnc', 'electronics', 'design', 'training');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_services_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS services (
    id serial PRIMARY KEY,
    name varchar NOT NULL,
    slug varchar NOT NULL,
    category enum_services_category,
    description varchar NOT NULL,
    content jsonb,
    icon varchar,
    featured_image_id integer,
    "order" integer,
    featured boolean DEFAULT false,
    status enum_services_status DEFAULT 'draft',
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON services(slug);

-- services array tables
CREATE TABLE IF NOT EXISTS services_gallery (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    image_id integer,
    caption varchar
);

CREATE TABLE IF NOT EXISTS services_pricing (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    item varchar,
    price varchar,
    notes varchar
);

CREATE TABLE IF NOT EXISTS services_features (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    feature varchar
);


-- ============================================================
-- PARTE 5: Verificación
-- ============================================================

-- Mostrar las columnas de payload_locked_documents_rels para confirmar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payload_locked_documents_rels' 
ORDER BY ordinal_position;

-- Mostrar las columnas de events para confirmar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

COMMIT;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- Si todo fue bien, verás las columnas listadas arriba.
-- Reinicia fablab-web después de ejecutar esto:
--   docker restart fablab-web
-- ============================================================
