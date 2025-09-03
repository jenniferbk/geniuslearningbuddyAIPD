// debug-database-state.js - Check current state of video content database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database state...');

// Check if video_content_chunks table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='video_content_chunks'", (err, row) => {
  if (err) {
    console.error('❌ Error checking table:', err);
    return;
  }
  
  if (!row) {
    console.log('❌ video_content_chunks table does NOT exist!');
    console.log('💡 Need to run: node setup-content-aware-database.js');
    db.close();
    return;
  }
  
  console.log('✅ video_content_chunks table exists');
  
  // Get all chunks for p09yRj47kNM
  db.all('SELECT * FROM video_content_chunks WHERE video_id = ? ORDER BY start_time', ['p09yRj47kNM'], (err, chunks) => {
    if (err) {
      console.error('❌ Error getting chunks:', err);
      db.close();
      return;
    }
    
    console.log(`\n📊 Found ${chunks.length} chunks for video p09yRj47kNM:`);
    
    if (chunks.length === 0) {
      console.log('❌ NO CHUNKS FOUND! Need to populate data.');
      console.log('💡 Will create sample data...');
      createSampleData();
      return;
    }
    
    chunks.forEach((chunk, i) => {
      console.log(`\nChunk ${i + 1}:`);
      console.log(`  ID: ${chunk.id}`);
      console.log(`  Time: ${chunk.start_time}s - ${chunk.end_time}s`);
      console.log(`  Topic: "${chunk.topic}"`);
      console.log(`  Content: "${chunk.content?.substring(0, 100)}..."`);
      console.log(`  Keywords: ${chunk.keywords}`);
    });
    
    // Test the specific query that's failing
    console.log('\n🧪 Testing query for timestamp 217s...');
    db.get(`
      SELECT * FROM video_content_chunks 
      WHERE video_id = ? AND start_time <= ? AND end_time > ?
      ORDER BY start_time DESC
      LIMIT 1
    `, ['p09yRj47kNM', 217, 217], (err, testChunk) => {
      if (err) {
        console.error('❌ Error in test query:', err);
      } else if (!testChunk) {
        console.log('❌ NO CHUNK FOUND for 217s! Need chunk that covers 180s-240s range.');
        console.log('💡 Current chunks don\'t cover timestamp 217s');
      } else {
        console.log('✅ Found chunk for 217s:');
        console.log(`  Time: ${testChunk.start_time}s - ${testChunk.end_time}s`);
        console.log(`  Topic: "${testChunk.topic}"`);
      }
      
      // Test surrounding chunks query
      console.log('\n🧪 Testing surrounding chunks query...');
      db.all(`
        SELECT * FROM video_content_chunks
        WHERE video_id = ? 
        AND start_time >= ? 
        AND start_time <= ?
        ORDER BY start_time
        LIMIT 3
      `, ['p09yRj47kNM', 157, 277], (err, surroundingChunks) => {
        if (err) {
          console.error('❌ Error in surrounding query:', err);
        } else {
          console.log(`📊 Surrounding chunks query returned: ${typeof surroundingChunks}`);
          console.log(`📊 Is array: ${Array.isArray(surroundingChunks)}`);
          console.log(`📊 Length: ${surroundingChunks?.length || 'N/A'}`);
          if (surroundingChunks && Array.isArray(surroundingChunks)) {
            console.log('✅ Surrounding chunks query working correctly');
          } else {
            console.log('❌ Surrounding chunks query returning wrong type!');
          }
        }
        db.close();
      });
    });
  });
});

function createSampleData() {
  console.log('\n📝 Creating comprehensive sample data for p09yRj47kNM...');
  
  // Create chunks that cover the full video including timestamp 217s
  const sampleChunks = [
    {
      video_id: 'p09yRj47kNM',
      start_time: 0,
      end_time: 60,
      content: 'Welcome to Google\'s comprehensive AI Prompt Engineering course. In this introduction, we\'ll cover the fundamentals of creating effective prompts for AI systems like ChatGPT and Claude. Understanding prompt engineering is crucial for educators who want to integrate AI tools into their teaching practice.',
      topic: 'Introduction to AI Prompt Engineering',
      keywords: JSON.stringify(['prompt engineering', 'AI fundamentals', 'ChatGPT', 'teaching', 'introduction'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 60,
      end_time: 120,
      content: 'Effective prompts have several key characteristics: they are clear, specific, and provide context. For teachers, this means crafting prompts that help AI understand your educational goals, student level, and subject matter. Let\'s explore how to structure prompts for maximum effectiveness.',
      topic: 'Characteristics of Effective Prompts',
      keywords: JSON.stringify(['prompt structure', 'clarity', 'specificity', 'context', 'educational goals'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 120,
      end_time: 180,
      content: 'When writing prompts for educational content, consider your audience. Are you creating materials for elementary students or high schoolers? The AI needs this context to adjust vocabulary, complexity, and examples. Always specify the grade level and subject area in your prompts.',
      topic: 'Audience-Specific Prompt Writing',
      keywords: JSON.stringify(['audience', 'grade level', 'vocabulary', 'complexity', 'subject area'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 180,
      end_time: 240,
      content: 'Let\'s look at practical examples of effective prompting. Instead of asking "Create a lesson plan," try "Create a 45-minute lesson plan for 8th grade science students about photosynthesis, including a hands-on activity and assessment rubric." Notice how the specific details help the AI understand exactly what you need.',
      topic: 'Practical Prompt Examples',
      keywords: JSON.stringify(['lesson plans', 'specific details', 'hands-on activities', 'assessment', 'examples'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 240,
      end_time: 300,
      content: 'Common mistakes in prompt engineering include being too vague, not providing enough context, and forgetting to specify the format you want. For instance, if you want a rubric, ask for a rubric explicitly. If you want bullet points, mention that in your prompt. Always be specific about your desired output format.',
      topic: 'Common Prompt Engineering Mistakes',
      keywords: JSON.stringify(['common mistakes', 'vague prompts', 'context', 'format specification', 'rubrics'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 300,
      end_time: 360,
      content: 'Advanced prompt techniques include role-playing, where you ask the AI to take on a specific role like "Act as an experienced 5th grade teacher" or using step-by-step instructions. These techniques can dramatically improve the quality and relevance of AI responses for educational purposes.',
      topic: 'Advanced Prompt Techniques',
      keywords: JSON.stringify(['role-playing', 'step-by-step', 'experienced teacher', 'advanced techniques', 'quality improvement'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 360,
      end_time: 420,
      content: 'Let\'s practice with some real examples. We\'ll work through creating prompts for different educational scenarios: generating discussion questions, creating assessments, adapting content for different learning levels, and developing interactive classroom activities. Each example will show you the before and after of prompt improvement.',
      topic: 'Hands-on Practice Examples',
      keywords: JSON.stringify(['practice', 'examples', 'discussion questions', 'assessments', 'learning levels', 'interactive activities'])
    }
  ];
  
  // Clear existing data first
  db.run('DELETE FROM video_content_chunks WHERE video_id = ?', ['p09yRj47kNM'], (err) => {
    if (err) {
      console.error('❌ Error clearing old data:', err);
      db.close();
      return;
    }
    
    console.log('🗑️ Cleared old chunks');
    
    // Insert new comprehensive data
    const insertStmt = db.prepare(`
      INSERT INTO video_content_chunks 
      (video_id, start_time, end_time, content, topic, keywords)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    sampleChunks.forEach((chunk, index) => {
      insertStmt.run(
        chunk.video_id,
        chunk.start_time,
        chunk.end_time,
        chunk.content,
        chunk.topic,
        chunk.keywords,
        (err) => {
          if (err) {
            console.error(`❌ Error inserting chunk ${index}:`, err);
          } else {
            insertedCount++;
            console.log(`✅ Inserted chunk ${index + 1}: ${chunk.start_time}s-${chunk.end_time}s`);
          }
          
          if (insertedCount === sampleChunks.length) {
            insertStmt.finalize();
            console.log(`\n🎉 Successfully created ${insertedCount} chunks!`);
            console.log('💡 Now timestamp 217s should map to chunk: 180s-240s');
            db.close();
          }
        }
      );
    });
  });
}
