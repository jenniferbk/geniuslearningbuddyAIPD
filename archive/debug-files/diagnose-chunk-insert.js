// diagnose-chunk-insert.js - Debug why chunks aren't inserting properly
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function diagnoseChunkInsert() {
  const videoId = 'p09yRj47kNM';
  const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
  
  console.log('🔍 DIAGNOSING CHUNK INSERT ISSUES');
  console.log('📺 Video ID:', videoId);
  console.log('🎯 Goal: Figure out why only 9/13 chunks are inserting\n');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Step 1: Clear and start fresh
    console.log('🗑️ Step 1: Clearing existing chunks...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM video_content_chunks WHERE video_id = ?', [videoId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Chunks cleared');
    
    // Step 2: Insert chunks one by one with detailed logging
    console.log('\n📊 Step 2: Inserting chunks individually with logging...');
    
    const properChunks = [
      { start_time: 0, end_time: 75, topic: "Course Introduction and Welcome" },
      { start_time: 75, end_time: 150, topic: "What is Prompt Engineering" },
      { start_time: 150, end_time: 225, topic: "Essential Elements of Educational Prompts" },
      { start_time: 225, end_time: 300, topic: "Practical Prompt Examples" },
      { start_time: 300, end_time: 375, topic: "Common Prompting Mistakes to Avoid" }, // This should cover 316s!
      { start_time: 375, end_time: 450, topic: "Differentiated Instruction with AI" },
      { start_time: 450, end_time: 525, topic: "Creating Assessments with AI" },
      { start_time: 525, end_time: 600, topic: "Advanced Prompting Techniques" },
      { start_time: 600, end_time: 675, topic: "Classroom Implementation Strategies" }, // This should cover 600s!
      { start_time: 675, end_time: 750, topic: "Enhancing Student Engagement" },
      { start_time: 750, end_time: 825, topic: "Ethics and Responsible AI Use" },
      { start_time: 825, end_time: 900, topic: "Collaborative Lesson Planning" }, // This should cover 900s!
      { start_time: 900, end_time: 975, topic: "Course Summary and Next Steps" }
    ];
    
    // Add full content to each chunk
    const chunksWithContent = properChunks.map(chunk => ({
      ...chunk,
      content: `This is the content for ${chunk.topic}. Here we discuss the key concepts and practical applications for educators learning about AI prompt engineering. This section covers important strategies and examples that teachers can use in their classrooms.`,
      keywords: ["ai", "prompt", "engineering", "education", "teaching", "classroom"]
    }));
    
    console.log(`📋 Prepared ${chunksWithContent.length} chunks for insertion`);
    
    // Insert chunks one by one with error checking
    for (let i = 0; i < chunksWithContent.length; i++) {
      const chunk = chunksWithContent[i];
      
      try {
        console.log(`\n📥 Inserting chunk ${i + 1}/${chunksWithContent.length}:`);
        console.log(`   Time: ${chunk.start_time}-${chunk.end_time}s`);
        console.log(`   Topic: ${chunk.topic}`);
        
        const result = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO video_content_chunks 
            (video_id, start_time, end_time, content, topic, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            videoId,
            chunk.start_time,
            chunk.end_time,
            chunk.content,
            chunk.topic,
            JSON.stringify(chunk.keywords)
          ], function(err) {
            if (err) reject(err);
            else resolve({ insertId: this.lastID, changes: this.changes });
          });
        });
        
        console.log(`   ✅ SUCCESS: Inserted with ID ${result.insertId}`);
        
      } catch (insertError) {
        console.log(`   ❌ FAILED: ${insertError.message}`);
        console.log(`   🔍 Error details:`, insertError);
      }
    }
    
    // Step 3: Verify what actually got inserted
    console.log('\n📊 Step 3: Verifying what was actually inserted...');
    
    const actualChunks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, start_time, end_time, topic
        FROM video_content_chunks 
        WHERE video_id = ?
        ORDER BY start_time
      `, [videoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📋 Actually inserted: ${actualChunks.length} chunks`);
    
    actualChunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.start_time}-${chunk.end_time}s: ${chunk.topic} (ID: ${chunk.id})`);
    });
    
    // Step 4: Test the problematic timestamps
    console.log('\n🧪 Step 4: Testing problematic timestamps...');
    
    const testTimestamps = [316, 600, 900];
    
    for (const timestamp of testTimestamps) {
      const chunk = await new Promise((resolve, reject) => {
        db.get(`
          SELECT start_time, end_time, topic
          FROM video_content_chunks 
          WHERE video_id = ? AND start_time <= ? AND end_time > ?
          ORDER BY start_time DESC
          LIMIT 1
        `, [videoId, timestamp, timestamp], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (chunk) {
        console.log(`  ✅ ${timestamp}s: FOUND in ${chunk.topic} (${chunk.start_time}-${chunk.end_time}s)`);
      } else {
        console.log(`  ❌ ${timestamp}s: NOT FOUND`);
        
        // Check what chunks are around this timestamp
        const before = await new Promise((resolve, reject) => {
          db.get(`
            SELECT end_time, topic FROM video_content_chunks 
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
            SELECT start_time, topic FROM video_content_chunks 
            WHERE video_id = ? AND start_time >= ?
            ORDER BY start_time ASC
            LIMIT 1
          `, [videoId, timestamp], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        console.log(`     Before: ${before ? `ends at ${before.end_time}s` : 'none'}`);
        console.log(`     After: ${after ? `starts at ${after.start_time}s` : 'none'}`);
      }
    }
    
    // Step 5: Summary
    console.log('\n🎯 DIAGNOSIS SUMMARY');
    console.log('=' * 40);
    
    const maxEndTime = Math.max(...actualChunks.map(c => c.end_time));
    
    console.log(`📊 Expected chunks: 13`);
    console.log(`📊 Actual chunks: ${actualChunks.length}`);
    console.log(`⏱️ Expected coverage: 0-975s`);
    console.log(`⏱️ Actual coverage: 0-${maxEndTime}s`);
    
    if (actualChunks.length < 13) {
      console.log('\n❌ PROBLEM: Missing chunks');
      console.log('🔍 Possible causes:');
      console.log('   • Database constraint violations');
      console.log('   • Silent INSERT failures');
      console.log('   • Data type mismatches');
      console.log('   • Transaction rollbacks');
    }
    
    if (maxEndTime < 900) {
      console.log('\n❌ PROBLEM: Coverage gap');
      console.log(`🔍 Missing timestamps: ${maxEndTime+1}-975s`);
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    db.close();
  }
}

// Run the diagnosis
diagnoseChunkInsert();