-- ============================================================
-- Fix Array Table IDs: serial (integer) → varchar
-- ============================================================
-- Problema: Las tablas de arrays fueron creadas con id serial
-- (integer), pero Payload 3 genera IDs varchar (UUID) para
-- sub-documentos de arrays. Al insertar, falla con:
--   "invalid input syntax for type integer: '<uuid>'"
--
-- USO:
--   docker exec -i fablab-db psql -U fablab -d fablab_blog < docker/migrations/fix-array-table-ids.sql
--
-- SEGURO: Idempotente. Verifica el tipo antes de alterar.
-- ============================================================

BEGIN;

-- Helper: solo altera si la columna es integer/serial, no si ya es varchar
DO $$
DECLARE
    tbl TEXT;
    col_type TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'projects_gallery',
        'projects_external_staff',
        'projects_creators',
        'projects_links',
        'projects_beneficiaries',
        'projects_practice_hours_specialists',
        'projects_practice_hours_bidireccion_entries'
    ]
    LOOP
        -- Verificar si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            -- Obtener tipo actual de la columna id
            SELECT data_type INTO col_type
            FROM information_schema.columns
            WHERE table_name = tbl AND column_name = 'id';

            IF col_type IS NOT NULL AND col_type = 'integer' THEN
                -- Quitar default del serial
                EXECUTE format('ALTER TABLE %I ALTER COLUMN id DROP DEFAULT', tbl);
                -- Convertir integer → varchar (los existentes se convierten a string)
                EXECUTE format('ALTER TABLE %I ALTER COLUMN id TYPE varchar USING id::varchar', tbl);
                -- Eliminar la secuencia serial huérfana
                EXECUTE format('DROP SEQUENCE IF EXISTS %I', tbl || '_id_seq');
                RAISE NOTICE 'Fixed table %: id integer → varchar', tbl;
            ELSE
                RAISE NOTICE 'Table % already has id type: %, skipping', tbl, COALESCE(col_type, 'N/A');
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl;
        END IF;
    END LOOP;
END $$;

COMMIT;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN (
    'projects_gallery',
    'projects_external_staff',
    'projects_creators',
    'projects_links',
    'projects_beneficiaries',
    'projects_practice_hours_specialists',
    'projects_practice_hours_bidireccion_entries'
) AND column_name = 'id'
ORDER BY table_name;
