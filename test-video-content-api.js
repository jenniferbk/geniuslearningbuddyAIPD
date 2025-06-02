// test-video-content-api.js - Test the video content API for timestamp lookup
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testVideoContentAPI() {
  const videoId = 'p09yRj47kNM';
  const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
  
  console.log('🧪 Testing Video Content API for timestamp lookup');
  console.log('📺 Video ID:', videoId);
  console.log('⏰ Target timestamps: 23s, 316s (5:16), 600s (10:00)\n');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Step 1: Check database chunks
    console.log('📊 Step 1: Database chunk analysis');
    console.log('=' * 40);
    
    const chunks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          start_time,
          end_time,
          topic,
          LENGTH(content) as content_length
        FROM video_content_chunks 
        WHERE video_id = ?
        ORDER BY start_time
      `, [videoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📋 Found ${chunks.length} chunks in database`);
    
    if (chunks.length === 0) {
      console.log('❌ NO CHUNKS FOUND!');
      console.log('💡 Run: node fix-transcript-chunking.js');
      return;
    }
    
    // Show chunk coverage
    console.log('\n📊 Chunk Coverage:');
    chunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.start_time}-${chunk.end_time}s: ${chunk.topic} (${chunk.content_length} chars)`);
    });
    
    // Step 2: Test specific timestamps
    console.log('\n🎯 Step 2: Testing specific timestamps');
    console.log('=' * 40);
    
    const testTimestamps = [23, 316, 600]; // 23s, 5:16, 10:00
    
    for (const timestamp of testTimestamps) {
      console.log(`\n🕐 Testing timestamp: ${timestamp}s (${Math.floor(timestamp/60)}:${(timestamp%60).toString().padStart(2,'0')})`);
      
      // Find matching chunk using the same query as the API
      const chunk = await new Promise((resolve, reject) => {
        db.get(`
          SELECT * FROM video_content_chunks 
          WHERE video_id = ? AND start_time <= ? AND end_time > ?
          ORDER BY start_time DESC
          LIMIT 1
        `, [videoId, timestamp, timestamp], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (chunk) {
        console.log(`  ✅ FOUND: Chunk ${chunk.start_time}-${chunk.end_time}s`);
        console.log(`  📚 Topic: ${chunk.topic}`);
        console.log(`  📄 Content: ${chunk.content.substring(0, 100)}...`);
      } else {
        console.log(`  ❌ NO CHUNK FOUND for ${timestamp}s`);
        
        // Find closest chunks
        const before = await new Promise((resolve, reject) => {
          db.get(`
            SELECT start_time, end_time, topic FROM video_content_chunks 
            WHERE video_id = ? AND end_time <= ?
            ORDER BY end_time DESC
            LIMIT 1
          `, [videoId, timestamp], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        const after = await new Promise((resolve, reject) => {
          db.get(`
            SELECT start_time, end_time, topic FROM video_content_chunks 
            WHERE video_id = ? AND start_time >= ?
            ORDER BY start_time ASC
            LIMIT 1
          `, [videoId, timestamp], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        console.log(`  📍 Closest before: ${before ? `${before.start_time}-${before.end_time}s` : 'none'}`);
        console.log(`  📍 Closest after: ${after ? `${after.start_time}-${after.end_time}s` : 'none'}`);
      }
    }
    
    // Step 3: Check gaps
    console.log('\n🔍 Step 3: Checking for gaps in coverage');
    console.log('=' * 40);
    
    let hasGaps = false;
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i-1].end_time;
      const currentStart = chunks[i].start_time;
      const gap = currentStart - prevEnd;
      
      if (gap > 1) { // 1+ second gap
        console.log(`⚠️  Gap: ${gap}s between chunks ${i} and ${i+1} (${prevEnd}s → ${currentStart}s)`);
        hasGaps = true;
      }
    }
    
    if (!hasGaps) {
      console.log('✅ No significant gaps found');
    }
    
    // Step 4: Test API simulation
    console.log('\n🌐 Step 4: API Response Simulation');
    console.log('=' * 40);
    
    for (const timestamp of testTimestamps) {
      const chunk = await new Promise((resolve, reject) => {
        db.get(`
          SELECT * FROM video_content_chunks 
          WHERE video_id = ? AND start_time <= ? AND end_time > ?
          ORDER BY start_time DESC
          LIMIT 1
        `, [videoId, timestamp, timestamp], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (chunk) {
        // Simulate API response
        const apiResponse = {
          timestamp: timestamp,
          videoId: videoId,
          chunk: {
            startTime: chunk.start_time,
            endTime: chunk.end_time,
            content: chunk.content,
            topic: chunk.topic,
            keywords: JSON.parse(chunk.keywords || '[]')
          },
          rag_content: chunk.content
        };
        
        console.log(`\n✅ API Response for ${timestamp}s:`);
        console.log(`   Topic: ${apiResponse.chunk.topic}`);
        console.log(`   Time Range: ${apiResponse.chunk.startTime}-${apiResponse.chunk.endTime}s`);
        console.log(`   Content Length: ${apiResponse.chunk.content.length} characters`);
        console.log(`   Keywords: ${apiResponse.chunk.keywords.slice(0, 5).join(', ')}`);
      } else {
        console.log(`\n❌ API would return "No content available" for ${timestamp}s`);
      }
    }
    
    // Summary
    console.log('\n🎯 SUMMARY');
    console.log('=' * 40);
    
    const working316 = chunks.some(c => c.start_time <= 316 && c.end_time > 316);
    const working23 = chunks.some(c => c.start_time <= 23 && c.end_time > 23);
    
    console.log(`📊 Total chunks: ${chunks.length}`);
    console.log(`🎯 Timestamp 23s: ${working23 ? '✅ COVERED' : '❌ NOT COVERED'}`);
    console.log(`🎯 Timestamp 316s (5:16): ${working316 ? '✅ COVERED' : '❌ NOT COVERED'}`);
    
    if (working23 && working316) {
      console.log('\n🎉 SUCCESS: Content awareness should work!');
      console.log('💡 Refresh your frontend to see the fix');
    } else {
      console.log('\n⚠️  ISSUE: Some timestamps not covered');
      console.log('🔧 Run: node fix-transcript-chunking.js');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    db.close();
  }
}

// Run the test
testVideoContentAPI();