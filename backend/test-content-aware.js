// test-content-aware.js - Quick test for content-aware functionality
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testing Content-Aware System...');
console.log('');

// Test 1: Check if video content tables exist
console.log('📋 1. Checking database tables...');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%video%'", (err, tables) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    return;
  }
  
  console.log(`✅ Found ${tables.length} video-related tables:`);
  tables.forEach(table => console.log(`   - ${table.name}`));
  
  // Test 2: Check if video content chunks exist
  console.log('\n📊 2. Checking video content chunks...');
  db.all("SELECT video_id, COUNT(*) as chunk_count FROM video_content_chunks GROUP BY video_id", (err, chunks) => {
    if (err) {
      console.error('❌ Error checking chunks:', err.message);
      return;
    }
    
    if (chunks.length === 0) {
      console.log('❌ No video content chunks found!');
      console.log('🔧 Run: node setup-content-aware-database.js');
    } else {
      console.log(`✅ Found chunks for ${chunks.length} videos:`);
      chunks.forEach(chunk => {
        console.log(`   - ${chunk.video_id}: ${chunk.chunk_count} chunks`);
      });
    }
    
    // Test 3: Check specific video chunks
    console.log('\n🎬 3. Checking demo video chunks...');
    const testVideoIds = ['p09yRj47kNM', 'intro_to_prompting'];
    
    testVideoIds.forEach(videoId => {
      db.all("SELECT * FROM video_content_chunks WHERE video_id = ? ORDER BY start_time", [videoId], (err, videoChunks) => {
        if (err) {
          console.error(`❌ Error checking ${videoId}:`, err.message);
          return;
        }
        
        if (videoChunks.length === 0) {
          console.log(`❌ No chunks found for video: ${videoId}`);
        } else {
          console.log(`✅ Video ${videoId}: ${videoChunks.length} chunks`);
          videoChunks.forEach((chunk, i) => {
            console.log(`   ${i+1}. ${chunk.start_time}s-${chunk.end_time}s: ${chunk.topic || 'No topic'}`);
            console.log(`      Content: ${chunk.content.substring(0, 80)}...`);
          });
        }
        
        // Close database after last check
        if (videoId === testVideoIds[testVideoIds.length - 1]) {
          console.log('\n🏁 Test complete!');
          console.log('\n💡 If no chunks found, run:');
          console.log('   node setup-content-aware-database.js');
          console.log('\n🚀 Then start the servers:');
          console.log('   Backend: npm run dev');
          console.log('   Frontend: cd ../frontend && npm start');
          
          db.close();
        }
      });
    });
  });
});
