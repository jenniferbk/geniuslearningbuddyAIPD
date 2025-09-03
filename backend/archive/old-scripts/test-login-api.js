// test-login-api.js
// Script to test login API directly

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogin(email, password) {
  console.log(`🔐 Testing login for: ${email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: email,
      password: password
    });
    
    if (response.data.token) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user.name} (${response.data.user.email})`);
      
      // Test CMS access
      try {
        const cmsResponse = await axios.get(`${BASE_URL}/api/cms/courses`, {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        console.log('✅ CMS access confirmed - user has creator permissions');
        console.log(`   Found ${cmsResponse.data.length} courses`);
      } catch (cmsError) {
        if (cmsError.response && cmsError.response.status === 403) {
          console.log('❌ CMS access denied - user lacks creator permissions');
        } else {
          console.log('⚠️  CMS test failed:', cmsError.message);
        }
      }
      
      return true;
    } else {
      console.log('❌ Login failed - no token returned');
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ Login failed: ${error.response.data.error}`);
    } else {
      console.log(`❌ Login request failed: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Login API...\n');
  
  // Test users mentioned in the issue
  const testUsers = [
    { email: 'jennifer.b.kleiman@gmail.com', password: 'your-password-here' },
    { email: 'kbrame@gmail.com', password: 'test-password' },
    { email: 'test@example.com', password: 'password123' }
  ];
  
  console.log('⚠️  Note: Replace passwords with actual passwords to test properly\n');
  
  let workingUsers = 0;
  
  for (const user of testUsers) {
    const success = await testLogin(user.email, user.password);
    if (success) workingUsers++;
    console.log('');
  }
  
  console.log(`📊 Results: ${workingUsers}/${testUsers.length} users can login successfully`);
  
  if (workingUsers === 0) {
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Make sure backend is running: npm start');
    console.log('2. Check database has users: node diagnose-users.js');
    console.log('3. Clean up database: node cleanup-orphaned-records.js');
    console.log('4. Create test user: node create-test-user.js');
  }
}

// Check if backend is running first
axios.get(`${BASE_URL}/api/health`)
  .then(() => {
    runTests();
  })
  .catch(() => {
    console.log('❌ Backend not running at http://localhost:3001');
    console.log('💡 Start it with: npm start');
  });
