/**
 * Script para recrear usuario admin completamente
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const NEW_EMAIL = 'admin@fablab.cl';
const NEW_PASSWORD = 'Admin123!';
const NEW_NAME = 'Administrador';

async function recreateAdmin() {
    console.log('🔄 Recreando usuario admin...');

    const payload = await getPayload({ config });

    // Eliminar usuario existente si existe
    const users = await payload.find({
        collection: 'users',
        where: { email: { equals: NEW_EMAIL } },
        limit: 1,
    });

    if (users.docs.length > 0) {
        console.log('🗑️  Eliminando usuario existente...');
        await payload.delete({
            collection: 'users',
            id: users.docs[0].id,
        });
    }

    // Crear usuario nuevo
    console.log('👤 Creando usuario nuevo...');
    const admin = await payload.create({
        collection: 'users',
        data: {
            email: NEW_EMAIL,
            password: NEW_PASSWORD,
            name: NEW_NAME,
            role: 'admin',
        },
    });

    console.log('\n✅ Usuario administrador creado!');
    console.log(`   Email: ${NEW_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`   ID: ${admin.id}`);
}

recreateAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
