// debug-video-context-flow.js - Debug the complete video context flow
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function debugVideoContextFlow() {
  const videoId = 'p09yRj47kNM';
  const testTimestamp = 51; // Around where the video is at
  const testUserId = 'test-user'; // We'll need to check what userId is being sent
  const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
  
  console.log('🔍 DEBUGGING VIDEO CONTEXT FLOW');
  console.log('📺 Video ID:', videoId);
  console.log('⏰ Test timestamp:', testTimestamp + 's');
  console.log('👤 Test user ID:', testUserId);
  console.log('');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Step 1: Check if we have chunks for this timestamp
    console.log('📊 Step 1: Database chunk lookup');
    console.log('=' * 40);
    
    const chunk = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM video_content_chunks 
        WHERE video_id = ? AND start_time <= ? AND end_time > ?
        ORDER BY start_time DESC
        LIMIT 1
      `, [videoId, testTimestamp, testTimestamp], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (chunk) {
      console.log('✅ CHUNK FOUND:');
      console.log(`   ID: ${chunk.id}`);
      console.log(`   Time: ${chunk.start_time}-${chunk.end_time}s`);
      console.log(`   Topic: ${chunk.topic}`);
      console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
      console.log(`   Keywords: ${chunk.keywords}`);
    } else {
      console.log('❌ NO CHUNK FOUND for timestamp ' + testTimestamp);
      return;
    }
    
    // Step 2: Simulate the exact API call that VideoPlayer makes
    console.log('\n🌐 Step 2: Simulating API call');
    console.log('=' * 40);
    
    console.log('📤 Request body that VideoPlayer should send:');
    const requestBody = {
      videoId: videoId,
      timestamp: Math.floor(testTimestamp),
      userId: testUserId
    };
    console.log(JSON.stringify(requestBody, null, 2));
    
    // Step 3: Simulate the getVideoContext function
    console.log('\n⚙️ Step 3: Simulating getVideoContext function');
    console.log('=' * 40);
    
    try {
      // Parse keywords safely
      let keywords = [];
      try {
        if (chunk.keywords && chunk.keywords !== 'undefined' && chunk.keywords !== 'null') {
          keywords = JSON.parse(chunk.keywords);
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse keywords:', parseError);
        keywords = [];
      }
      
      // Build the exact context object that should be returned
      const contextResponse = {
        timestamp: testTimestamp,
        videoId: videoId,
        chunk: {
          startTime: chunk.start_time,
          endTime: chunk.end_time,
          content: chunk.content,
          topic: chunk.topic,
          keywords: keywords
        },
        surroundingContext: [], // Simplified for test
        userContext: {},
        rag_content: chunk.content,
        suggestions: []
      };
      
      console.log('✅ CONTEXT RESPONSE:');
      console.log(JSON.stringify(contextResponse, null, 2));
      
    } catch (contextError) {
      console.error('❌ Error building context:', contextError);
    }
    
    // Step 4: Check what the frontend VideoPlayer is actually sending
    console.log('\n🔍 Step 4: Frontend debugging hints');
    console.log('=' * 40);
    
    console.log('🧪 To debug the frontend:');
    console.log('1. Open browser console');
    console.log('2. Look for these log messages:');
    console.log('   - "🔍 Attempting content context update:"');
    console.log('   - "🌐 API Response:"');
    console.log('   - "🎯 Content context received:"');
    console.log('');
    console.log('🔍 Check if VideoPlayer is sending:');
    console.log(`   - videoId: "${videoId}"`);
    console.log(`   - timestamp: ${testTimestamp} (not 0!)`);
    console.log(`   - userId: actual user ID (not null/undefined)`);
    console.log('');
    console.log('❌ Common issues:');
    console.log('   - VideoPlayer sends timestamp 0 instead of actual time');
    console.log('   - userId is null/undefined');
    console.log('   - Auth token missing or invalid');
    console.log('   - API endpoint not being called at all');
    
    // Step 5: Check authentication requirements
    console.log('\n🔐 Step 5: Authentication check');
    console.log('=' * 40);
    
    console.log('🔑 The API requires:');
    console.log('   - Valid auth token in localStorage');
    console.log('   - Token sent as "Bearer {token}" in Authorization header');
    console.log('   - Valid userId that matches the token');
    console.log('');
    console.log('🧪 To test manually in browser console:');
    console.log(`
// Test the API call manually
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
console.log('Token:', token ? token.substring(0, 20) + '...' : 'NONE');

fetch('/api/content/video-context', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    videoId: '${videoId}',
    timestamp: ${testTimestamp},
    userId: 'YOUR_ACTUAL_USER_ID'
  })
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
    `);
    
    // Step 6: Expected vs actual behavior
    console.log('\n🎯 Step 6: Expected vs Actual');
    console.log('=' * 40);
    
    console.log('✅ EXPECTED:');
    console.log(`   - AI says: "You're at ${testTimestamp} seconds"`);
    console.log(`   - AI says: "The video is about ${chunk.topic}"`);
    console.log(`   - AI references: Specific content from the video`);
    console.log('');
    console.log('❌ ACTUAL (from your screenshot):');
    console.log('   - AI says: "You\'re at timestamp 0 seconds"');
    console.log('   - AI says: "Video is untitled"');
    console.log('   - AI gives: Generic responses');
    console.log('');
    console.log('🔧 THIS INDICATES:');
    console.log('   - Content context API call is failing or not happening');
    console.log('   - VideoPlayer not sending correct timestamp');
    console.log('   - Chat system not receiving video context');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    db.close();
  }
}

// Run the debug
debugVideoContextFlow();