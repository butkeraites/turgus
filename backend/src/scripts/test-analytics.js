const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testAnalytics() {
  try {
    console.log('🧪 Testing analytics endpoints...\n');
    
    // Generate a test token for a seller using the real seller ID
    const testPayload = {
      userId: '0e084d30-963a-49c9-bba7-aa75e73d3a88', // Real seller ID from database
      userType: 'seller',
      username: 'testseller'
    };
    
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    console.log('🔑 Generated test token with real seller ID');
    
    // Test dashboard metrics endpoint
    try {
      const response = await axios.get('http://localhost:3001/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Dashboard metrics response:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Dashboard metrics error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test online users endpoint
    try {
      const response = await axios.get('http://localhost:3001/api/analytics/online-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n👥 Online users response:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Online users error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testAnalytics();
}

module.exports = { testAnalytics };