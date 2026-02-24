import pg from 'pg';
const { Client } = pg;
const c = new Client('postgres://fablab:fablab_secret_2024@localhost:9012/fablab_blog');
await c.connect();

console.log('🔄 Migración: inventory_items + show_in_tecnologias\n');

// ═══════════════════════════════════════════
// 1. Add show_in_tecnologias column to equipment table
// ═══════════════════════════════════════════
try {
    await c.query(`ALTER TABLE "equipment" ADD COLUMN "show_in_tecnologias" boolean DEFAULT true;`);
    console.log('✅ Added column show_in_tecnologias to equipment');
} catch (e) {
    if (e.code === '42701') { // column already exists
        console.log('⚠️ Column show_in_tecnologias already exists on equipment, skipping');
    } else {
        throw e;
    }
}

// Set all existing equipment to visible by default
await c.query(`UPDATE "equipment" SET "show_in_tecnologias" = true WHERE "show_in_tecnologias" IS NULL;`);
console.log('✅ Set existing equipment show_in_tecnologias = true');

// ═══════════════════════════════════════════
// 2. Create inventory_items table
// ═══════════════════════════════════════════
await c.query(`
    CREATE TABLE IF NOT EXISTS "inventory_items" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "sku" varchar,
        "category" varchar DEFAULT 'consumable',
        "description" text,
        "image_id" integer,
        "quantity" numeric DEFAULT 0,
        "unit" varchar DEFAULT 'unit',
        "minimum_stock" numeric DEFAULT 0,
        "location" varchar,
        "supplier" varchar,
        "unit_cost" numeric,
        "status" varchar DEFAULT 'available',
        "notes" text,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
    );
`);
console.log('✅ Created table inventory_items');

// 3. Add unique index on sku
try {
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_sku_idx" ON "inventory_items" ("sku") WHERE "sku" IS NOT NULL AND "sku" != '';`);
    console.log('✅ Created unique index on sku');
} catch (e) {
    console.log('⚠️ SKU index might already exist:', e.message);
}

// 4. Add foreign key for image
try {
    await c.query(`
        ALTER TABLE "inventory_items"
        ADD CONSTRAINT "inventory_items_image_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL;
    `);
    console.log('✅ Added foreign key for image_id -> media');
} catch (e) {
    if (e.code === '42710') {
        console.log('⚠️ Foreign key already exists, skipping');
    } else {
        console.log('⚠️ FK warning:', e.message);
    }
}

// 5. Add indexes for common queries
await c.query(`CREATE INDEX IF NOT EXISTS "inventory_items_category_idx" ON "inventory_items" ("category");`);
await c.query(`CREATE INDEX IF NOT EXISTS "inventory_items_status_idx" ON "inventory_items" ("status");`);
await c.query(`CREATE INDEX IF NOT EXISTS "inventory_items_updated_at_idx" ON "inventory_items" ("updated_at");`);
await c.query(`CREATE INDEX IF NOT EXISTS "inventory_items_created_at_idx" ON "inventory_items" ("created_at");`);
console.log('✅ Created indexes for inventory_items');

// ═══════════════════════════════════════════
// 3. Add in-use and out-of-service to equipment status if not present
// ═══════════════════════════════════════════
// (Payload select fields don't restrict at DB level, this is just documentation)

console.log('\n✅ Migration complete!');
console.log('  - equipment: added show_in_tecnologias column');
console.log('  - inventory_items: created table with indexes');
await c.end();
