// debug-content-awareness.js - Debug content awareness issues
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Debugging Content Awareness Issues...');
console.log('======================================');
console.log('');

// Check 1: Verify video chunks exist for p09yRj47kNM
console.log('📊 1. Checking video chunks for p09yRj47kNM...');
db.all("SELECT * FROM video_content_chunks WHERE video_id = 'p09yRj47kNM' ORDER BY start_time", (err, chunks) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    return;
  }
  
  if (chunks.length === 0) {
    console.log('❌ NO CHUNKS FOUND for video p09yRj47kNM!');
    console.log('🔧 SOLUTION: Run the database setup:');
    console.log('   node setup-content-aware-database.js');
    console.log('');
  } else {
    console.log(`✅ Found ${chunks.length} chunks for p09yRj47kNM:`);
    chunks.forEach((chunk, i) => {
      console.log(`   ${i+1}. ${chunk.start_time}s-${chunk.end_time}s: ${chunk.topic}`);
      console.log(`      Content: ${chunk.content.substring(0, 60)}...`);
    });
    console.log('');
  }
  
  // Check 2: Verify API endpoint structure
  console.log('🔧 2. API Endpoint Check...');
  console.log('The VideoPlayer should be calling:');
  console.log('   POST /api/content/video-context');
  console.log('   Body: { videoId: "p09yRj47kNM", timestamp: 30, userId: "your-user-id" }');
  console.log('');
  
  // Check 3: Check if tables exist
  console.log('📋 3. Checking database structure...');
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%video%'", (err, tables) => {
    if (err) {
      console.error('❌ Error checking tables:', err.message);
      return;
    }
    
    console.log('✅ Video-related tables:');
    tables.forEach(table => console.log(`   - ${table.name}`));
    
    // Check 4: Test a sample query like the API would do
    console.log('');
    console.log('🧪 4. Testing sample context query...');
    const testTimestamp = 30; // 30 seconds into video
    db.get(`
      SELECT * FROM video_content_chunks 
      WHERE video_id = ? AND start_time <= ? AND end_time > ?
      ORDER BY start_time DESC
      LIMIT 1
    `, ['p09yRj47kNM', testTimestamp, testTimestamp], (err, chunk) => {
      if (err) {
        console.error('❌ Query error:', err.message);
      } else if (!chunk) {
        console.log('❌ No chunk found for timestamp 30s');
        console.log('🔧 This is why content awareness fails!');
      } else {
        console.log('✅ Sample query successful:');
        console.log(`   Found chunk: ${chunk.topic}`);
        console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
        console.log('');
        console.log('✅ Database is working! Issue might be:');
        console.log('   1. API calls not reaching server');
        console.log('   2. Frontend/backend not connecting');
        console.log('   3. Content context not passed to AI properly');
      }
      
      console.log('');
      console.log('🔍 Next debugging steps:');
      console.log('   1. Open browser Dev Tools → Network tab');
      console.log('   2. Watch for calls to /api/content/video-context');
      console.log('   3. Check if calls return proper content data');
      console.log('   4. Verify AI chat includes contentContext parameter');
      
      db.close();
    });
  });
});
