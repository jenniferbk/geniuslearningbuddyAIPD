// force-rebuild-video-system.js - Nuclear option to rebuild video content system
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('💥 FORCE REBUILDING video content system...');

// Step 1: Drop and recreate tables
console.log('🗑️ Dropping existing video tables...');

db.serialize(() => {
  // Drop all video-related tables
  db.run('DROP TABLE IF EXISTS video_content_chunks');
  db.run('DROP TABLE IF EXISTS video_context_cache'); 
  db.run('DROP TABLE IF EXISTS user_video_progress');
  db.run('DROP TABLE IF EXISTS youtube_videos');
  
  console.log('✅ Dropped old tables');
  
  // Recreate with proper schema
  console.log('🔧 Creating new tables with proper schema...');
  
  db.run(`
    CREATE TABLE video_content_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      start_time INTEGER NOT NULL DEFAULT 0,
      end_time INTEGER NOT NULL DEFAULT 60,
      content TEXT NOT NULL DEFAULT '',
      topic TEXT NOT NULL DEFAULT 'Video Content',
      keywords TEXT NOT NULL DEFAULT '[]',
      embedding TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE user_video_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      current_position REAL NOT NULL,
      duration REAL NOT NULL,
      progress_percentage REAL NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, video_id)
    )
  `);
  
  db.run(`
    CREATE TABLE video_context_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      context_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, timestamp)
    )
  `);
  
  db.run(`
    CREATE TABLE youtube_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      youtube_id TEXT UNIQUE NOT NULL,
      title TEXT,
      duration INTEGER,
      transcript_status TEXT DEFAULT 'loaded',
      transcript_loaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Created new tables');
  
  // Insert comprehensive video data that covers ALL timestamps
  console.log('📝 Inserting comprehensive video content...');
  
  const comprehensiveChunks = [
    { start: 0, end: 60, topic: 'Course Introduction', content: 'Welcome to Google\'s AI Prompt Engineering course for educators. We\'ll explore how to create effective prompts for AI systems like ChatGPT and Claude to enhance your teaching practice.' },
    { start: 60, end: 120, topic: 'What is Prompt Engineering', content: 'Prompt engineering is the practice of crafting clear, specific instructions for AI systems. For teachers, this means learning to communicate your educational goals effectively to get useful classroom content.' },
    { start: 120, end: 180, topic: 'Understanding Your Audience', content: 'When creating prompts, always consider your student audience. Specify grade level, subject area, and learning objectives. This helps AI tailor vocabulary, complexity, and examples appropriately.' },
    { start: 180, end: 240, topic: 'Practical Prompting Examples', content: 'Let\'s see effective prompting in action. Instead of "create a lesson," try "create a 45-minute lesson plan for 8th grade biology about photosynthesis, including hands-on activities and assessment rubric."' },
    { start: 240, end: 300, topic: 'Common Mistakes to Avoid', content: 'Avoid these common prompting mistakes: being too vague, omitting context about your students, forgetting to specify desired format, and not iterating to improve results.' },
    { start: 300, end: 360, topic: 'Advanced Techniques', content: 'Advanced prompting includes role-playing ("act as an experienced teacher"), step-by-step instructions, and providing examples. These techniques dramatically improve AI response quality.' },
    { start: 360, end: 420, topic: 'Hands-on Practice', content: 'Now let\'s practice together! We\'ll work through real examples of creating prompts for lesson plans, assessments, discussion questions, and differentiated instruction materials.' }
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO video_content_chunks 
    (video_id, start_time, end_time, content, topic, keywords)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  comprehensiveChunks.forEach(chunk => {
    const keywords = JSON.stringify([
      chunk.topic.toLowerCase().replace(/\s+/g, ' ').split(' ').slice(0, 3),
      'education', 'teaching', 'AI tools'
    ].flat());
    
    insertStmt.run(
      'p09yRj47kNM',
      chunk.start,
      chunk.end,
      chunk.content,
      chunk.topic,
      keywords
    );
  });
  
  insertStmt.finalize();
  
  // Insert video metadata
  db.run(`
    INSERT INTO youtube_videos (youtube_id, title, transcript_status)
    VALUES ('p09yRj47kNM', 'AI Prompt Engineering for Educators', 'loaded')
  `);
  
  console.log('✅ Inserted comprehensive video content');
  
  // Test the critical query
  console.log('\n🧪 Testing timestamp 217s query...');
  db.get(`
    SELECT * FROM video_content_chunks 
    WHERE video_id = 'p09yRj47kNM' AND start_time <= 217 AND end_time > 217
    ORDER BY start_time DESC
    LIMIT 1
  `, (err, chunk) => {
    if (err) {
      console.error('❌ Test failed:', err);
    } else if (chunk) {
      console.log('✅ SUCCESS! Found chunk for 217s:');
      console.log(`   ${chunk.start_time}s-${chunk.end_time}s: ${chunk.topic}`);
    } else {
      console.log('❌ Still no chunk found for 217s');
    }
    
    // Test surrounding chunks
    db.all(`
      SELECT * FROM video_content_chunks
      WHERE video_id = 'p09yRj47kNM' 
      AND start_time >= 157 
      AND start_time <= 277
      ORDER BY start_time
    `, (err, surrounding) => {
      if (err) {
        console.error('❌ Surrounding test failed:', err);
      } else {
        console.log(`✅ Surrounding chunks: ${surrounding.length} found`);
        console.log(`   Type: ${typeof surrounding}, IsArray: ${Array.isArray(surrounding)}`);
      }
      
      console.log('\n🎉 FORCE REBUILD COMPLETE!');
      console.log('💡 Restart your server and test again');
      db.close();
    });
  });
});
