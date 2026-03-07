-- ============================================================
-- Fix Projects Full Schema: All missing columns and tables
-- ============================================================
-- Problema: La colección Projects en Payload tiene campos que
-- no existen en la DB de producción. La query generada por
-- Payload falla porque faltan columnas y tablas.
--
-- USO:
--   docker exec -i fablab-postgres psql -U fablab -d fablab_blog < docker/migrations/fix-projects-full-schema.sql
--
-- SEGURO: Usa IF NOT EXISTS en todo. Se puede ejecutar múltiples veces.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Columnas faltantes en tabla projects
-- ============================================================

-- richText content (lexical → jsonb)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content jsonb;

-- Fechas (por si fix-projects-schema.sql no se ejecutó)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Horas de práctica: checkbox
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_enabled boolean DEFAULT false;

-- Horas de práctica: campos del grupo (Payload aplana groups → prefijo practice_hours_)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_beneficiary_type varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_institution_name varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_institution_rut varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_email varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_phone varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_commune varchar;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practice_hours_referring_organization varchar;


-- ============================================================
-- PARTE 2: Tabla projects_gallery (array de imágenes)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_gallery (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    image_id integer
);
CREATE INDEX IF NOT EXISTS idx_projects_gallery_order ON projects_gallery(_order);
CREATE INDEX IF NOT EXISTS idx_projects_gallery_parent ON projects_gallery(_parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_gallery_image ON projects_gallery(image_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_gallery_parent_id_fk'
    ) THEN
        ALTER TABLE projects_gallery ADD CONSTRAINT projects_gallery_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_gallery_image_id_fk'
    ) THEN
        ALTER TABLE projects_gallery ADD CONSTRAINT projects_gallery_image_id_fk
            FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ============================================================
-- PARTE 3: Tabla projects_external_staff (array externalStaff)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_external_staff (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    name varchar,
    role varchar
);
CREATE INDEX IF NOT EXISTS idx_projects_ext_staff_order ON projects_external_staff(_order);
CREATE INDEX IF NOT EXISTS idx_projects_ext_staff_parent ON projects_external_staff(_parent_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_external_staff_parent_id_fk'
    ) THEN
        ALTER TABLE projects_external_staff ADD CONSTRAINT projects_external_staff_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 4: Tabla projects_creators (array creators)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_creators (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    team_member_id integer,
    external_name varchar,
    role varchar
);
CREATE INDEX IF NOT EXISTS idx_projects_creators_order ON projects_creators(_order);
CREATE INDEX IF NOT EXISTS idx_projects_creators_parent ON projects_creators(_parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_creators_team_member ON projects_creators(team_member_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_creators_parent_id_fk'
    ) THEN
        ALTER TABLE projects_creators ADD CONSTRAINT projects_creators_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_creators_team_member_id_fk'
    ) THEN
        ALTER TABLE projects_creators ADD CONSTRAINT projects_creators_team_member_id_fk
            FOREIGN KEY (team_member_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ============================================================
-- PARTE 5: Tabla projects_links (array links)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    label varchar,
    url varchar
);
CREATE INDEX IF NOT EXISTS idx_projects_links_order ON projects_links(_order);
CREATE INDEX IF NOT EXISTS idx_projects_links_parent ON projects_links(_parent_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_links_parent_id_fk'
    ) THEN
        ALTER TABLE projects_links ADD CONSTRAINT projects_links_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 6: Tabla projects_beneficiaries (por si no se creó antes)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_beneficiaries (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    tipo_beneficiario varchar,
    rut varchar,
    first_name varchar,
    paternal_last_name varchar,
    maternal_last_name varchar,
    rol varchar,
    horas_docente numeric,
    horas_estudiante numeric
);
CREATE INDEX IF NOT EXISTS idx_projects_beneficiaries_parent ON projects_beneficiaries(_parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_beneficiaries_order ON projects_beneficiaries(_order);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_beneficiaries_parent_id_fk'
    ) THEN
        ALTER TABLE projects_beneficiaries ADD CONSTRAINT projects_beneficiaries_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 7: Tabla projects_practice_hours_specialists
-- (array dentro del grupo practiceHours)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_practice_hours_specialists (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    first_name varchar,
    paternal_last_name varchar,
    maternal_last_name varchar,
    rut varchar
);
CREATE INDEX IF NOT EXISTS idx_projects_ph_specialists_order ON projects_practice_hours_specialists(_order);
CREATE INDEX IF NOT EXISTS idx_projects_ph_specialists_parent ON projects_practice_hours_specialists(_parent_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_ph_specialists_parent_id_fk'
    ) THEN
        ALTER TABLE projects_practice_hours_specialists ADD CONSTRAINT projects_ph_specialists_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 8: Tabla projects_practice_hours_bidireccion_entries
-- (array dentro del grupo practiceHours)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_practice_hours_bidireccion_entries (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id serial PRIMARY KEY,
    tipo_beneficiario varchar,
    rut varchar,
    first_name varchar,
    paternal_last_name varchar,
    maternal_last_name varchar,
    rol varchar,
    horas_docente numeric,
    horas_estudiante numeric
);
CREATE INDEX IF NOT EXISTS idx_projects_ph_bidireccion_order ON projects_practice_hours_bidireccion_entries(_order);
CREATE INDEX IF NOT EXISTS idx_projects_ph_bidireccion_parent ON projects_practice_hours_bidireccion_entries(_parent_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_ph_bidireccion_parent_id_fk'
    ) THEN
        ALTER TABLE projects_practice_hours_bidireccion_entries ADD CONSTRAINT projects_ph_bidireccion_parent_id_fk
            FOREIGN KEY (_parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ============================================================
-- PARTE 9: Tabla projects_rels (relationships hasMany)
-- Para technologies y responsibleStaff (users)
-- ============================================================

CREATE TABLE IF NOT EXISTS projects_rels (
    id serial PRIMARY KEY,
    "order" integer,
    parent_id integer NOT NULL,
    path varchar NOT NULL,
    technologies_id integer,
    users_id integer
);
CREATE INDEX IF NOT EXISTS idx_projects_rels_parent ON projects_rels(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_rels_path ON projects_rels(path);
CREATE INDEX IF NOT EXISTS idx_projects_rels_technologies ON projects_rels(technologies_id);
CREATE INDEX IF NOT EXISTS idx_projects_rels_users ON projects_rels(users_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_rels_parent_id_fk'
    ) THEN
        ALTER TABLE projects_rels ADD CONSTRAINT projects_rels_parent_id_fk
            FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;


COMMIT;
