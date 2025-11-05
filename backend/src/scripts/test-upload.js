const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testUpload() {
  try {
    console.log('🧪 Testing photo upload...\n');
    
    // Generate a test token for a seller using the real seller ID
    const testPayload = {
      userId: '0e084d30-963a-49c9-bba7-aa75e73d3a88', // Real seller ID from database
      userType: 'seller',
      username: 'testseller'
    };
    
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    console.log('🔑 Generated test token with real seller ID');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Create form data
    const formData = new FormData();
    formData.append('photos', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Test upload endpoint
    try {
      const response = await axios.post('http://localhost:3001/api/media/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      });
      
      console.log('📸 Upload response:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Test getting unassigned photos after upload
      const photosResponse = await axios.get('http://localhost:3001/api/media/unassigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n📋 Unassigned photos after upload:');
      console.log(JSON.stringify(photosResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Upload error:', error.response.status, error.response.data);
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
  testUpload();
}

module.exports = { testUpload };