const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('PostgreSQL connection error:', err.message);
    process.exit(1);
  }
  console.log('PostgreSQL connected');
});

module.exports = pool;
