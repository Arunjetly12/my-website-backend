// This file's only job is to connect to the database

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'my_users',
  password: 'postgres', // Make sure this is your correct password
  port: 5432,
});

// Export the pool so other files (like index.js) can use it
module.exports = pool;