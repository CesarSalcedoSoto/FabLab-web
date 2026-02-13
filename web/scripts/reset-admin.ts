import { getPayload } from 'payload';
import config from '../payload.config';
import pg from 'pg';

const NEW_EMAIL = 'admin@fablab.cl';
const NEW_PASSWORD = 'FabLab2026!';
const NEW_NAME = 'Administrador';

async function resetAdmin() {
    console.log('🔄 Reseteando base de datos y usuario administrador...');

    // Limpiar TODA la base de datos para evitar problemas de enums corruptos
    const DATABASE_URL = process.env.DATABASE_URL || 'postgres://fablab:fablab_secret_2024@localhost:5432/fablab_blog';
    const client = new pg.Client({ connectionString: DATABASE_URL });
    
    try {
        await client.connect();
        console.log('🗑️  Eliminando TODAS las tablas...');
        
        // Obtener todas las tablas
        const tablesResult = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        `);
        
        for (const row of tablesResult.rows) {
            await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
            console.log(`   ❌ Tabla eliminada: ${row.tablename}`);
        }
        
        // Obtener todos los tipos enum
        const enumsResult = await client.query(`
            SELECT t.typname 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            GROUP BY t.typname
        `);
        
        for (const row of enumsResult.rows) {
            await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
            console.log(`   ❌ Enum eliminado: ${row.typname}`);
        }
        
        console.log('✅ Base de datos limpiada completamente');
    } catch (e: any) {
        console.log('⚠️  Error limpiando:', e.message);
    } finally {
        await client.end();
    }

    console.log('\n🔄 Inicializando Payload (esto recreará todas las tablas)...');
    const payload = await getPayload({ config });

    console.log('✅ Tablas recreadas exitosamente');
    
    // Crear nuevo admin (la base de datos está vacía)
    console.log('\n👤 Creando usuario administrador...');
    const admin = await payload.create({
        collection: 'users',
        data: {
            email: NEW_EMAIL,
            password: NEW_PASSWORD,
            name: NEW_NAME,
            role: 'admin',
        },
    });

    console.log('\n✅ Nuevo usuario administrador creado!');
    console.log(`   Email: ${NEW_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);

    return admin;
}

resetAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });