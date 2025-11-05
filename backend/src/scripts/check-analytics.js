const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - using same config as the app
const pool = new Pool({
  user: process.env.DB_USER || 'turgus',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'turgus_db',
  password: process.env.DB_PASSWORD || 'turgus_dev_password',
  port: process.env.DB_PORT || 5432,
});

async function checkAnalytics() {
  try {
    console.log('📊 Checking analytics data...\n');
    
    // Check product views
    const viewsResult = await pool.query('SELECT COUNT(*) as count FROM product_views');
    console.log(`📈 Product views: ${viewsResult.rows[0].count}`);
    
    // Check online sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as count FROM online_sessions');
    console.log(`👥 Online sessions: ${sessionsResult.rows[0].count}`);
    
    // Check sales analytics
    const salesResult = await pool.query('SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales_analytics');
    console.log(`💰 Sales records: ${salesResult.rows[0].count}, Total: R$ ${salesResult.rows[0].total || 0}`);
    
    // Check product metrics
    const metricsResult = await pool.query('SELECT COUNT(*) as count FROM product_metrics');
    console.log(`📊 Product metrics: ${metricsResult.rows[0].count}`);
    
    // Check accounts
    const sellersResult = await pool.query('SELECT COUNT(*) as count FROM seller_accounts');
    const buyersResult = await pool.query('SELECT COUNT(*) as count FROM buyer_accounts');
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`\n🏪 Sellers: ${sellersResult.rows[0].count}`);
    console.log(`🛒 Buyers: ${buyersResult.rows[0].count}`);
    console.log(`📦 Products: ${productsResult.rows[0].count}`);
    
    // Get a sample seller ID for testing
    const sampleSeller = await pool.query('SELECT id FROM seller_accounts LIMIT 1');
    if (sampleSeller.rows.length > 0) {
      console.log(`\n🧪 Sample seller ID: ${sampleSeller.rows[0].id}`);
    }
    
    console.log('\n✅ Analytics check complete!');
    
  } catch (error) {
    console.error('❌ Error checking analytics:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkAnalytics();
}

module.exports = { checkAnalytics };