const { Pool } = require('pg');
const dotenv = require('dotenv');
const db = require('../config/db');

// Load env vars
dotenv.config({ path: './config/.env' });

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log('- User:', process.env.DB_USER);
console.log('- Host:', process.env.DB_HOST);
console.log('- Database:', process.env.DB_NAME);
console.log('- Port:', process.env.DB_PORT);

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    console.error('Connection details:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      // Don't log password
    });
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
    
    // Check if users table exists and has data
    pool.query('SELECT COUNT(*) FROM users', (usersErr, usersRes) => {
      if (usersErr) {
        console.error('Error checking users table:', usersErr.message);
      } else {
        console.log('Users in database:', usersRes.rows[0].count);
      }
    });
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};