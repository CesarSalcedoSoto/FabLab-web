-- ============================================================
-- Fix Projects Schema: Missing columns and tables
-- ============================================================
-- Problema: La tabla projects no tiene start_date/end_date,
-- falta projects_beneficiaries y projects_rels.
--
-- USO:
--   docker exec -i fablab-postgres psql -U fablab -d fablab_blog < docker/migrations/fix-projects-schema.sql
-- ============================================================

BEGIN;

-- 1. Columnas faltantes en projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- 2. Tabla projects_beneficiaries (array beneficiaries)
CREATE TABLE IF NOT EXISTS projects_beneficiaries (
    _order integer NOT NULL,
    _parent_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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

-- 3. Tabla projects_rels (para campos relationship hasMany: technologies y responsibleStaff/users)
CREATE TABLE IF NOT EXISTS projects_rels (
    id serial PRIMARY KEY,
    "order" integer,
    parent_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path varchar NOT NULL,
    technologies_id integer,
    users_id integer
);
CREATE INDEX IF NOT EXISTS idx_projects_rels_parent ON projects_rels(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_rels_path ON projects_rels(path);
CREATE INDEX IF NOT EXISTS idx_projects_rels_technologies ON projects_rels(technologies_id);
CREATE INDEX IF NOT EXISTS idx_projects_rels_users ON projects_rels(users_id);

-- Nota: projects_technologies es una tabla array legacy con campo 'name' (texto).
-- La nueva relación hasMany usa projects_rels con technologies_id (FK numérico).
-- No se migran automáticamente porque los tipos no coinciden.

COMMIT;
