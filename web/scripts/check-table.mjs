import pg from 'pg';
const { Client } = pg;
const c = new Client('postgres://fablab:fablab_secret_2024@localhost:9012/fablab_blog');
await c.connect();

// 1. Create bidireccionEntries table
await c.query(`
  CREATE TABLE IF NOT EXISTS "projects_practice_hours_bidireccion_entries" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar NOT NULL PRIMARY KEY,
    "tipo_beneficiario" varchar,
    "rut" varchar,
    "first_name" varchar,
    "paternal_last_name" varchar,
    "maternal_last_name" varchar,
    "rol" varchar,
    "horas_docente" numeric,
    "horas_estudiante" numeric
  );
`);
console.log('✅ Created table projects_practice_hours_bidireccion_entries');

// 2. Create indexes (matching Payload's conventions)
await c.query(`
  CREATE INDEX IF NOT EXISTS "projects_practice_hours_bidireccion_entries_order_idx" 
  ON "projects_practice_hours_bidireccion_entries" ("_order");
`);
await c.query(`
  CREATE INDEX IF NOT EXISTS "projects_practice_hours_bidireccion_entries_parent_id_idx" 
  ON "projects_practice_hours_bidireccion_entries" ("_parent_id");
`);
console.log('✅ Created indexes');

// 3. Add foreign key
try {
  await c.query(`
    ALTER TABLE "projects_practice_hours_bidireccion_entries"
    ADD CONSTRAINT "projects_practice_hours_bidireccion_entries_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "projects"("id") ON DELETE CASCADE;
  `);
  console.log('✅ Added foreign key');
} catch (e) {
  if (e.code === '42710') {
    console.log('⚠️ Foreign key already exists, skipping');
  } else {
    throw e;
  }
}

// 4. Remove old columns from specialists table (rolDocente, horasDocente, rolEstudiante, horasEstudiante)
const oldCols = ['rol_docente', 'horas_docente', 'rol_estudiante', 'horas_estudiante'];
for (const col of oldCols) {
  try {
    await c.query(`ALTER TABLE "projects_practice_hours_specialists" DROP COLUMN IF EXISTS "${col}";`);
    console.log(`✅ Dropped column ${col} from specialists`);
  } catch (e) {
    console.log(`⚠️ Could not drop ${col}: ${e.message}`);
  }
}

console.log('\n✅ Migration complete!');
await c.end();
