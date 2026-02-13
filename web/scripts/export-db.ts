/**
 * Script para exportar toda la base de datos PostgreSQL
 * Exporta: esquema (DDL), datos, enums, secuencias
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://fablab:fablab_secret_2024@localhost:5432/fablab_blog';
const OUTPUT_DIR = path.join('C:', 'Users', 'cesar', 'Desktop', 'fablab-postgres');

async function exportDB() {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Crear directorio de salida
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let sql = '';
    
    // --- 1. ENUMS ---
    console.log('\n📋 Exportando enums...');
    const enums = await client.query(`
        SELECT t.typname AS enum_name, 
               string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname
    `);
    
    sql += '-- ==========================================\n';
    sql += '-- ENUMS\n';
    sql += '-- ==========================================\n\n';
    
    for (const en of enums.rows) {
        const values = en.enum_values.split(',').map((v: string) => `'${v}'`).join(', ');
        sql += `CREATE TYPE "${en.enum_name}" AS ENUM (${values});\n`;
        console.log(`   ✓ ${en.enum_name}`);
    }
    sql += '\n';

    // --- 2. TABLAS (DDL) ---
    console.log('\n📋 Exportando estructura de tablas...');
    const tables = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    `);
    
    sql += '-- ==========================================\n';
    sql += '-- TABLES\n';
    sql += '-- ==========================================\n\n';
    
    for (const table of tables.rows) {
        const tableName = table.tablename;
        
        // Obtener columnas
        const columns = await client.query(`
            SELECT 
                c.column_name,
                c.data_type,
                c.udt_name,
                c.column_default,
                c.is_nullable,
                c.character_maximum_length,
                c.numeric_precision,
                c.numeric_scale
            FROM information_schema.columns c
            WHERE c.table_name = $1 AND c.table_schema = 'public'
            ORDER BY c.ordinal_position
        `, [tableName]);
        
        sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
        const colDefs: string[] = [];
        
        for (const col of columns.rows) {
            let colType = '';
            
            // Manejar serials
            if (col.column_default?.startsWith("nextval(")) {
                colType = 'serial';
            } else if (col.data_type === 'USER-DEFINED') {
                colType = `"${col.udt_name}"`;
            } else if (col.data_type === 'character varying') {
                colType = col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar';
            } else if (col.data_type === 'timestamp with time zone') {
                colType = 'timestamp(3) with time zone';
            } else if (col.data_type === 'timestamp without time zone') {
                colType = 'timestamp(3) without time zone';
            } else {
                colType = col.data_type;
            }
            
            let def = `    "${col.column_name}" ${colType}`;
            
            if (col.column_default && !col.column_default.startsWith("nextval(")) {
                def += ` DEFAULT ${col.column_default}`;
            }
            
            if (col.is_nullable === 'NO' && colType !== 'serial') {
                def += ' NOT NULL';
            }
            
            colDefs.push(def);
        }
        
        // Primary key
        const pk = await client.query(`
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = $1::regclass AND i.indisprimary
        `, [`"${tableName}"`]);
        
        if (pk.rows.length > 0) {
            const pkCols = pk.rows.map((r: any) => `"${r.attname}"`).join(', ');
            colDefs.push(`    PRIMARY KEY (${pkCols})`);
        }
        
        sql += colDefs.join(',\n');
        sql += '\n);\n\n';
        
        console.log(`   ✓ ${tableName} (${columns.rows.length} columnas)`);
    }

    // --- 3. FOREIGN KEYS ---
    console.log('\n📋 Exportando foreign keys...');
    sql += '-- ==========================================\n';
    sql += '-- FOREIGN KEYS\n';
    sql += '-- ==========================================\n\n';
    
    const fks = await client.query(`
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule,
            rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name
    `);
    
    for (const fk of fks.rows) {
        let fkSql = `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" `;
        fkSql += `FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`;
        if (fk.delete_rule !== 'NO ACTION') fkSql += ` ON DELETE ${fk.delete_rule}`;
        if (fk.update_rule !== 'NO ACTION') fkSql += ` ON UPDATE ${fk.update_rule}`;
        fkSql += ';\n';
        sql += fkSql;
        console.log(`   ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }
    sql += '\n';

    // --- 4. INDEXES ---
    console.log('\n📋 Exportando índices...');
    sql += '-- ==========================================\n';
    sql += '-- INDEXES\n';
    sql += '-- ==========================================\n\n';
    
    const indexes = await client.query(`
        SELECT indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
    `);
    
    for (const idx of indexes.rows) {
        sql += `${idx.indexdef};\n`;
    }
    sql += '\n';
    console.log(`   ✓ ${indexes.rows.length} índices`);

    // --- 5. SEQUENCES ---
    console.log('\n📋 Exportando secuencias...');
    sql += '-- ==========================================\n';
    sql += '-- SEQUENCES (reset values)\n';
    sql += '-- ==========================================\n\n';
    
    const sequences = await client.query(`
        SELECT sequence_name FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    `);
    
    for (const seq of sequences.rows) {
        const val = await client.query(`SELECT last_value FROM "${seq.sequence_name}"`);
        sql += `SELECT setval('"${seq.sequence_name}"', ${val.rows[0].last_value}, true);\n`;
    }
    sql += '\n';

    // Guardar esquema
    const schemaFile = path.join(OUTPUT_DIR, '01-schema.sql');
    fs.writeFileSync(schemaFile, sql);
    console.log(`\n💾 Esquema guardado: ${schemaFile}`);

    // --- 6. DATOS ---
    console.log('\n📋 Exportando datos...');
    let dataSql = '-- ==========================================\n';
    dataSql += '-- DATA\n';
    dataSql += '-- ==========================================\n\n';
    
    let totalRows = 0;
    
    for (const table of tables.rows) {
        const tableName = table.tablename;
        const rows = await client.query(`SELECT * FROM "${tableName}"`);
        
        if (rows.rows.length === 0) continue;
        
        dataSql += `-- ${tableName} (${rows.rows.length} rows)\n`;
        
        for (const row of rows.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                if (typeof val === 'number') return String(val);
                if (val instanceof Date) return `'${val.toISOString()}'`;
                if (Array.isArray(val)) return `'${JSON.stringify(val)}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                return `'${String(val).replace(/'/g, "''")}'`;
            });
            
            dataSql += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            totalRows++;
        }
        dataSql += '\n';
        console.log(`   ✓ ${tableName}: ${rows.rows.length} registros`);
    }

    const dataFile = path.join(OUTPUT_DIR, '02-data.sql');
    fs.writeFileSync(dataFile, dataSql);
    console.log(`\n💾 Datos guardados: ${dataFile} (${totalRows} registros total)`);

    await client.end();
    console.log('\n🎉 Exportación completada en:', OUTPUT_DIR);
}

exportDB().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
