// debug-cms-permissions.js
// Script to debug what's happening with CMS permission checks

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function debugCMSPermissions() {
  console.log('🔍 Debugging CMS Permission Issues...\n');
  
  // Test the exact same API call that the frontend makes
  console.log('🧪 Testing CMS permission check without authentication...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/cms/courses`);
    console.log(`✅ No auth required? Status: ${response.status}`);
    console.log(`   Found ${response.data.length} courses`);
  } catch (error) {
    if (error.response) {
      console.log(`❌ Without auth - Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error || 'Unknown error'}`);
      console.log('   ✅ This is expected - authentication should be required');
    } else {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n🧪 Testing with test@example.com credentials...');
  
  try {
    // Login first
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test CMS access with detailed error info
    try {
      const cmsResponse = await axios.get(`${BASE_URL}/api/cms/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`✅ CMS Access Success - Status: ${cmsResponse.status}`);
      console.log(`   Found ${cmsResponse.data.length} courses`);
      console.log('   This should work in frontend too!');
      
    } catch (cmsError) {
      console.log(`❌ CMS Access Failed - Status: ${cmsError.response?.status}`);
      console.log(`   Error: ${cmsError.response?.data?.error || 'Unknown error'}`);
      console.log(`   Response data:`, cmsError.response?.data);
      
      // Check if it's a different error than expected
      if (cmsError.response?.status !== 403) {
        console.log('\n🔍 This is the problem! Frontend expects either:');
        console.log('   - Status 200 (success)');
        console.log('   - Status 403 (no permissions)');
        console.log(`   - But got status ${cmsError.response?.status} instead`);
      }
    }
  } catch (loginError) {
    console.log('❌ Login failed:', loginError.response?.data?.error || loginError.message);
  }
  
  // Test health endpoint
  console.log('\n🧪 Testing backend health...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Backend healthy');
    console.log('   OpenAI configured:', healthResponse.data.openaiConfigured);
    console.log('   Memory service:', healthResponse.data.memoryService);
    console.log('   Content aware:', healthResponse.data.contentAware);
  } catch (healthError) {
    console.log('❌ Backend health check failed');
  }
}

// Check if backend is running first
console.log('🔌 Checking if backend is running...');
axios.get(`${BASE_URL}/api/health`)
  .then(() => {
    console.log('✅ Backend is running\n');
    debugCMSPermissions();
  })
  .catch(() => {
    console.log('❌ Backend not running at http://localhost:3001');
    console.log('💡 Start it with: npm start');
  });
