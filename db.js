// === db.js (FINAL & BULLETPROOFED) ===

const { Pool } = require('pg');
require('dotenv').config();

// --- Configuration ---
const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// --- Loud & Clear Startup Log ---
// This prints to the console when the server starts, so we can see what's happening.
console.log('--- Database Configuration ---');
console.log(`Is Production Environment: ${isProduction}`);
if (!connectionString) {
  console.error('!!! WARNING: DATABASE_URL not found. Using local fallback. This is OK for local dev.');
} else {
  console.log('DATABASE_URL found. Will connect to production database.');
}
console.log('----------------------------');


// --- FAIL-FAST FOR PRODUCTION ---
// If we are in production and there is NO connection string, we crash the app ON PURPOSE.
// This is a safety feature to prevent it from running with a bad configuration.
if (isProduction && !connectionString) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not set in the production environment.');
  console.error('The application cannot start without a database. Shutting down.');
  process.exit(1); // This immediately stops the server with an error code.
}


// --- Create the Database Pool ---
const pool = new Pool({
  // Use the connectionString from the environment.
  // If we're local and it's missing, this will be undefined, and Pool will use other env vars or local defaults.
  // If we're in production and it's missing, the app will have already crashed above.
  connectionString: connectionString,
  
  // The crucial SSL setting for all cloud database connections like Supabase, Heroku, etc.
  // We only enable this in production.
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});


// --- Export the pool for other files to use ---
module.exports = pool;