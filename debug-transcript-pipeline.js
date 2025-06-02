// debug-transcript-pipeline.js - Debug the transcript processing pipeline
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function debugTranscriptPipeline() {
  const videoId = 'p09yRj47kNM';
  const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
  
  console.log('🔍 Debugging transcript processing pipeline for:', videoId);
  console.log('📊 Expected: 156 raw segments → 10-15 processed chunks');
  console.log('🔍 Current: Only 5 chunks showing\n');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Step 1: Check what's actually in the database
    console.log('📊 Step 1: Database Analysis');
    console.log('=' * 50);
    
    const chunks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          start_time,
          end_time,
          topic,
          LENGTH(content) as content_length,
          keywords,
          confidence,
          created_at
        FROM video_content_chunks 
        WHERE video_id = ?
        ORDER BY start_time
      `, [videoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📋 Database contains: ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      console.log('❌ NO CHUNKS FOUND IN DATABASE!');
      console.log('💡 This means the transcript fetch/store process failed');
      console.log('\n🔧 Solutions:');
      console.log('   1. Re-run the transcript fetcher');
      console.log('   2. Check for API errors');
      console.log('   3. Verify database permissions');
      return;
    }
    
    // Analyze the chunks
    console.log('\n📊 Chunk Analysis:');
    chunks.forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(`  ⏱️  Time: ${chunk.start_time}-${chunk.end_time}s (${chunk.end_time - chunk.start_time}s duration)`);
      console.log(`  📚 Topic: ${chunk.topic}`);
      console.log(`  📏 Content: ${chunk.content_length} characters`);
      console.log(`  🎯 Confidence: ${chunk.confidence || 'N/A'}`);
      console.log(`  📅 Created: ${chunk.created_at}`);
      
      // Parse keywords safely
      try {
        const keywords = JSON.parse(chunk.keywords || '[]');
        console.log(`  🏷️  Keywords: ${keywords.slice(0, 5).join(', ')}`);
      } catch (e) {
        console.log(`  🏷️  Keywords: Parse error`);
      }
    });
    
    // Step 2: Check the time coverage
    console.log('\n⏱️ Step 2: Time Coverage Analysis');
    console.log('=' * 50);
    
    const totalDuration = chunks[chunks.length - 1]?.end_time || 0;
    const expectedDuration = 1260; // ~21 minutes for this video
    
    console.log(`📊 Video duration coverage: ${totalDuration}s`);
    console.log(`📊 Expected duration: ~${expectedDuration}s`);
    console.log(`📊 Coverage: ${((totalDuration / expectedDuration) * 100).toFixed(1)}%`);
    
    // Check for gaps
    let hasGaps = false;
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i-1].end_time;
      const currentStart = chunks[i].start_time;
      const gap = currentStart - prevEnd;
      
      if (gap > 5) { // 5+ second gap
        console.log(`⚠️  Gap detected: ${gap}s gap between chunks ${i} and ${i+1}`);
        hasGaps = true;
      }
    }
    
    if (!hasGaps) {
      console.log('✅ No significant gaps detected');
    }
    
    // Step 3: Check the API response
    console.log('\n🌐 Step 3: API Response Test');
    console.log('=' * 50);
    
    // Test the video context API for a timestamp where we should have content
    const testTimestamp = 23; // From the screenshot
    
    const contextChunk = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          start_time,
          end_time,
          content,
          topic
        FROM video_content_chunks 
        WHERE video_id = ? AND start_time <= ? AND end_time > ?
        ORDER BY start_time DESC
        LIMIT 1
      `, [videoId, testTimestamp, testTimestamp], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`🎯 Testing timestamp: ${testTimestamp}s`);
    if (contextChunk) {
      console.log('✅ FOUND matching chunk:');
      console.log(`   Time: ${contextChunk.start_time}-${contextChunk.end_time}s`);
      console.log(`   Topic: ${contextChunk.topic}`);
      console.log(`   Content: ${contextChunk.content.substring(0, 100)}...`);
    } else {
      console.log('❌ NO CHUNK FOUND for timestamp 23s');
      console.log('🔍 This explains why the AI says "content isn\'t defined"');
    }
    
    // Step 4: Chunk size analysis
    console.log('\n📏 Step 4: Chunk Size Analysis');
    console.log('=' * 50);
    
    const avgDuration = chunks.reduce((sum, chunk) => sum + (chunk.end_time - chunk.start_time), 0) / chunks.length;
    const avgContentLength = chunks.reduce((sum, chunk) => sum + chunk.content_length, 0) / chunks.length;
    
    console.log(`📊 Average chunk duration: ${avgDuration.toFixed(1)}s`);
    console.log(`📊 Average content length: ${avgContentLength.toFixed(0)} characters`);
    console.log(`📊 Expected chunk duration: ~60-90s`);
    
    if (avgDuration > 120) {
      console.log('⚠️  Chunks are too large - this reduces granularity');
    } else if (avgDuration < 30) {
      console.log('⚠️  Chunks are too small - this creates too many chunks');
    } else {
      console.log('✅ Chunk duration looks reasonable');
    }
    
    // Step 5: Diagnosis and recommendations
    console.log('\n🎯 Step 5: Diagnosis & Recommendations');
    console.log('=' * 50);
    
    if (chunks.length < 8) {
      console.log('❌ PROBLEM: Too few chunks for this video duration');
      console.log('📊 Expected: 10-15 chunks for a ~21 minute video');
      console.log('🔍 Possible causes:');
      console.log('   • Transcript processing created chunks too large');
      console.log('   • Raw segments weren\'t processed correctly');
      console.log('   • Database insert partially failed');
      console.log('   • API timeout during processing');
      
      console.log('\n🔧 Recommended fixes:');
      console.log('   1. Clear and re-fetch transcript with debug logging');
      console.log('   2. Adjust chunk processing parameters (60s max)');
      console.log('   3. Check for processing errors in logs');
      console.log('   4. Verify all 156 segments were processed');
    }
    
    if (!contextChunk) {
      console.log('\n❌ PROBLEM: No content found for current video timestamp');
      console.log('🔧 This explains the AI\'s "content isn\'t defined" message');
      console.log('💡 The chunks may not cover the early part of the video');
    }
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run improved transcript processing with better chunking');
    console.log('2. Ensure 156 segments → 10-15 proper chunks');
    console.log('3. Test video context API at multiple timestamps');
    console.log('4. Verify content-aware chat integration');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    db.close();
  }
}

// Run the analysis
debugTranscriptPipeline();