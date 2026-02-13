import pg from 'pg';

async function checkUsers() {
    const client = new pg.Client({ 
        connectionString: 'postgres://fablab:fablab_secret_2024@localhost:5432/fablab_blog' 
    });
    
    await client.connect();
    
    // Ver estructura de la tabla
    const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
    `);
    console.log('Columnas de users:', columns.rows.map(r => r.column_name));
    
    // Ver datos completos
    const result = await client.query('SELECT * FROM users');
    console.log('\nUsuarios en BD:', JSON.stringify(result.rows, null, 2));
    
    await client.end();
}

checkUsers().catch(console.error);
