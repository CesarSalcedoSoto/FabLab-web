-- ============================================================
-- Fix projects_rels: MongoDB ObjectId cleanup
-- ============================================================
-- Problema: La tabla projects_rels puede tener filas con IDs de
-- MongoDB (ej: "69ac65c95a872f00018177bb") en columnas integer.
-- Cuando Payload resuelve relaciones, intenta castear ese texto
-- a integer → "invalid input syntax for type integer".
--
-- USO:
--   docker exec -i fablab-db psql -U fablab -d fablab_blog < /opt/FabLab-web/docker/migrations/fix-projects-rels-ids.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Eliminar filas de projects_rels con values no-numéricos
--    (MongoDB ObjectIds, UUIDs, o cualquier valor con letras/guiones)
--    Funciona tanto si la columna es INTEGER como TEXT/VARCHAR
-- ============================================================

DO $$
BEGIN
    -- Limpiar technologies_id con valores no-numéricos
    DELETE FROM projects_rels
    WHERE technologies_id IS NOT NULL
      AND technologies_id::text ~ '[^0-9]';

    RAISE NOTICE 'technologies_id cleanup done';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'technologies_id cleanup skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Limpiar users_id con valores no-numéricos
    DELETE FROM projects_rels
    WHERE users_id IS NOT NULL
      AND users_id::text ~ '[^0-9]';

    RAISE NOTICE 'users_id cleanup done';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'users_id cleanup skipped: %', SQLERRM;
END $$;

-- ============================================================
-- 2. Eliminar referencias a proyectos huérfanas (por si acaso)
-- ============================================================

DO $$
BEGIN
    DELETE FROM projects_rels
    WHERE parent_id NOT IN (SELECT id FROM projects);

    RAISE NOTICE 'orphaned rels cleanup done';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'orphaned rels cleanup skipped: %', SQLERRM;
END $$;

-- ============================================================
-- 3. Verificar resultado
-- ============================================================

DO $$
DECLARE
    total_rels INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rels FROM projects_rels;
    RAISE NOTICE 'projects_rels rows after cleanup: %', total_rels;
END $$;

COMMIT;
