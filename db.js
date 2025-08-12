// db.js
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST, // IPv4 uniquement
  port: 5432,
  database: process.env.DB_NAME,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

module.exports = pool;
