const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ma_boutique',
  password: '1961',
  port: 5432,
});

module.exports = pool;
