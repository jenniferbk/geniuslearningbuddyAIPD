// fix-content-awareness.js - Fix all content awareness issues
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing Content Awareness Issues...');
console.log('===================================');
console.log('');

// Step 1: Clear old data and set up new video chunks
console.log('🗄️ Step 1: Setting up video content chunks...');

// Clear any existing chunks for p09yRj47kNM
db.run("DELETE FROM video_content_chunks WHERE video_id = 'p09yRj47kNM'", (err) => {
  if (err) {
    console.error('Error clearing old chunks:', err.message);
    return;
  }
  console.log('✅ Cleared existing chunks for p09yRj47kNM');
  
  // Insert new chunks specifically for your video
  const chunks = [
    {
      video_id: 'p09yRj47kNM',
      start_time: 0,
      end_time: 60,
      content: 'Welcome to this introduction to AI prompt engineering for educators. Today we\'ll explore how to create effective prompts that will help you get the most out of AI tools in your teaching practice.',
      topic: 'Introduction to AI Prompt Engineering',
      keywords: JSON.stringify(['prompt', 'engineering', 'ai', 'education', 'teaching', 'introduction'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 60,
      end_time: 120,
      content: 'Understanding the fundamentals of how AI models work will help you craft better prompts. AI models like ChatGPT respond to the context and instructions you provide, so being specific and clear is crucial.',
      topic: 'Understanding AI Fundamentals',
      keywords: JSON.stringify(['ai', 'models', 'chatgpt', 'context', 'instructions', 'fundamentals'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 120,
      end_time: 180,
      content: 'Let\'s look at practical examples of prompts that work well in educational settings. Instead of asking "help me teach math," try "create 5 word problems for 4th graders practicing multiplication with real-world scenarios."',
      topic: 'Practical Prompting Examples',
      keywords: JSON.stringify(['examples', 'practical', 'education', 'math', 'word problems', 'specific'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 180,
      end_time: 240,
      content: 'Advanced prompting techniques include role-playing, step-by-step instructions, and providing examples. You can ask the AI to act as an experienced teacher or curriculum designer to get more targeted responses.',
      topic: 'Advanced Prompting Techniques',
      keywords: JSON.stringify(['advanced', 'techniques', 'role-playing', 'step-by-step', 'examples', 'curriculum'])
    },
    {
      video_id: 'p09yRj47kNM',
      start_time: 240,
      end_time: 300,
      content: 'Now let\'s apply these concepts to your specific teaching context. Consider your grade level, subject area, and the particular challenges you face in your classroom when crafting prompts.',
      topic: 'Applying Prompts to Your Teaching',
      keywords: JSON.stringify(['application', 'teaching', 'context', 'grade level', 'subject', 'classroom'])
    }
  ];
  
  // Insert all chunks
  let insertedCount = 0;
  chunks.forEach((chunk, index) => {
    db.run(
      `INSERT INTO video_content_chunks (video_id, start_time, end_time, content, topic, keywords) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chunk.video_id, chunk.start_time, chunk.end_time, chunk.content, chunk.topic, chunk.keywords],
      function(err) {
        if (err) {
          console.error(`❌ Error inserting chunk ${index + 1}:`, err.message);
        } else {
          insertedCount++;
          console.log(`✅ Inserted chunk ${index + 1}: ${chunk.topic}`);
          
          // When all chunks are inserted, verify the setup
          if (insertedCount === chunks.length) {
            console.log('');
            console.log('🧪 Step 2: Verifying setup...');
            
            // Test the content query
            db.get(`
              SELECT * FROM video_content_chunks 
              WHERE video_id = ? AND start_time <= ? AND end_time > ?
              ORDER BY start_time DESC
              LIMIT 1
            `, ['p09yRj47kNM', 30, 30], (err, testChunk) => {
              if (err) {
                console.error('❌ Verification failed:', err.message);
              } else if (!testChunk) {
                console.log('❌ Verification failed: No chunk found for timestamp 30s');
              } else {
                console.log('✅ Verification successful!');
                console.log(`   Found chunk for 30s: ${testChunk.topic}`);
                console.log(`   Content preview: ${testChunk.content.substring(0, 80)}...`);
                
                // Count total chunks
                db.get("SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = 'p09yRj47kNM'", (err, countResult) => {
                  if (!err && countResult) {
                    console.log(`   Total chunks for p09yRj47kNM: ${countResult.count}`);
                  }
                  
                  console.log('');
                  console.log('🎉 Content awareness should now work!');
                  console.log('');
                  console.log('🔄 Next steps:');
                  console.log('   1. Refresh your browser page');
                  console.log('   2. Play the video and ask: "What\'s being discussed right now?"');
                  console.log('   3. The AI should now reference the specific video content!');
                  console.log('');
                  console.log('🔍 If still not working, check browser Dev Tools → Network tab');
                  console.log('   Look for calls to: POST /api/content/video-context');
                  
                  db.close();
                });
              }
            });
          }
        }
      }
    );
  });
});
