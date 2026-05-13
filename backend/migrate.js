const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

dotenv.config();


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('Running database migrations...');
        const schemaPath = path.join(__dirname, 'config', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

        await client.query(schemaSql);
        console.log('Migrations completed successfully!');
        console.log('Schema loaded from config/schema.sql');
        console.log('Core tables ensured:');
        console.log('- users');
        console.log('- recipes');
        console.log('- ingredients');
        console.log('- recipe_ingredients');
    } catch (err) {
        console.error('Error running migrations:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
