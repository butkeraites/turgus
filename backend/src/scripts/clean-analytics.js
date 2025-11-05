const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'turgus',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'turgus_db',
  password: process.env.DB_PASSWORD || 'turgus_dev_password',
  port: process.env.DB_PORT || 5432,
});

async function cleanAnalytics() {
  try {
    console.log('🧹 Cleaning mock analytics data...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'clean-analytics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Analytics data cleaned successfully!');
    console.log('📊 Dashboard will now show real zeros until actual usage occurs');
    console.log('🎯 Analytics tracking is active and will capture real user behavior');
    
  } catch (error) {
    console.error('❌ Error cleaning analytics data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  cleanAnalytics();
}

module.exports = { cleanAnalytics };