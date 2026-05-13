const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?{ rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to Neon Postgres database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
