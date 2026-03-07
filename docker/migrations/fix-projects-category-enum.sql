-- ============================================================
-- Fix: Add missing values to enum_projects_category
-- ============================================================
-- Problema: El enum solo tiene algunos valores, faltan 'diseno' y/o 'animacion'
--
-- USO:
--   docker exec -i fablab-db psql -U fablab -d fablab_blog < /opt/FabLab-web/docker/migrations/fix-projects-category-enum.sql
-- ============================================================

-- Agregar 'diseno' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'diseno' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_projects_category')) THEN
        ALTER TYPE enum_projects_category ADD VALUE 'diseno';
    END IF;
END $$;

-- Agregar 'animacion' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'animacion' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_projects_category')) THEN
        ALTER TYPE enum_projects_category ADD VALUE 'animacion';
    END IF;
END $$;
