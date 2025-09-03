// test-api-endpoints.js - Test if content-aware APIs are working
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing AI Learning Buddy API Endpoints...');
  console.log('=============================================');
  console.log('');

  // Test 1: Health check
  console.log('🏥 1. Testing health endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check successful:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Content Aware: ${response.data.contentAware}`);
    console.log(`   Memory Service: ${response.data.memoryService}`);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('🔧 Make sure backend server is running: npm run dev');
    return;
  }

  // Test 2: Check if content routes are mounted
  console.log('\n🎬 2. Testing video content endpoint...');
  try {
    // This should fail with 401 (needs auth) but at least show the route exists
    const response = await axios.post(`${BASE_URL}/api/content/video-context`, {
      videoId: 'p09yRj47kNM',
      timestamp: 30,
      userId: 'test-user'
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Content endpoint exists (401 = needs authentication)');
    } else if (error.response?.status === 404) {
      console.error('❌ Content endpoint not found (404)');
      console.log('🔧 Check if video-content-routes.js is properly mounted');
    } else {
      console.log(`⚠️  Content endpoint responded with: ${error.response?.status || error.message}`);
    }
  }

  // Test 3: Check database has video chunks
  console.log('\n🗄️ 3. Checking database directly...');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  
  const db = new sqlite3.Database(dbPath);
  db.get("SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = 'p09yRj47kNM'", (err, result) => {
    if (err) {
      console.error('❌ Database error:', err.message);
    } else {
      console.log(`📊 Video chunks for p09yRj47kNM: ${result.count}`);
      if (result.count === 0) {
        console.log('❌ No video chunks found! Run: node fix-content-awareness.js');
      } else {
        console.log('✅ Video chunks exist in database');
      }
    }
    db.close();
  });

  console.log('\n🔍 Next debugging steps:');
  console.log('1. Verify backend server is running on port 3001');
  console.log('2. Check if video-content-routes.js is properly mounted');
  console.log('3. Test content endpoint with proper authentication');
  console.log('4. Check browser Network tab for failed API calls');
}

testEndpoints().catch(console.error);
