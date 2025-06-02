// fix-video-database.js - Repair corrupted video content chunks
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Starting video database repair...');

// Step 1: Check current state of video_content_chunks table
db.all('SELECT COUNT(*) as total, COUNT(topic) as with_topic, COUNT(start_time) as with_start FROM video_content_chunks', (err, rows) => {
  if (err) {
    console.error('❌ Error checking table state:', err);
    return;
  }
  
  const stats = rows[0];
  console.log(`📊 Current state: ${stats.total} total chunks, ${stats.with_topic} with topics, ${stats.with_start} with start times`);
  
  if (stats.total > 0 && (stats.with_topic < stats.total || stats.with_start < stats.total)) {
    console.log('⚠️ Found corrupted chunks, repairing...');
    repairChunks();
  } else if (stats.total === 0) {
    console.log('📝 No chunks found, inserting sample data...');
    insertSampleData();
  } else {
    console.log('✅ All chunks appear to be valid!');
    db.close();
  }
});

function repairChunks() {
  // Get all chunks that need repair
  db.all(`
    SELECT id, video_id, start_time, end_time, content, topic, keywords 
    FROM video_content_chunks 
    WHERE topic IS NULL OR start_time IS NULL OR end_time IS NULL OR content IS NULL OR keywords IS NULL
  `, (err, brokenChunks) => {
    if (err) {
      console.error('❌ Error finding broken chunks:', err);
      return;
    }
    
    console.log(`🔧 Repairing ${brokenChunks.length} broken chunks...`);
    
    if (brokenChunks.length === 0) {
      console.log('✅ No chunks need repair!');
      db.close();
      return;
    }
    
    const repairStmt = db.prepare(`
      UPDATE video_content_chunks 
      SET start_time = ?, end_time = ?, content = ?, topic = ?, keywords = ?
      WHERE id = ?
    `);
    
    brokenChunks.forEach((chunk, index) => {
      const repaired = {
        start_time: chunk.start_time || (index * 60),
        end_time: chunk.end_time || ((index + 1) * 60),
        content: chunk.content || `Content for chunk ${index + 1}`,
        topic: chunk.topic || `Video Section ${index + 1}`,
        keywords: chunk.keywords || '[]'
      };
      
      repairStmt.run(
        repaired.start_time,
        repaired.end_time,
        repaired.content,
        repaired.topic,
        repaired.keywords,
        chunk.id
      );
    });
    
    repairStmt.finalize(() => {
      console.log(`✅ Successfully repaired ${brokenChunks.length} chunks!`);
      
      // Verify the repair
      db.get('SELECT COUNT(*) as total, COUNT(topic) as with_topic FROM video_content_chunks', (err, result) => {
        if (err) {
          console.error('❌ Error verifying repair:', err);
        } else {
          console.log(`📊 After repair: ${result.total} total chunks, ${result.with_topic} with topics`);
        }
        db.close();
      });
    });
  });
}

function insertSampleData() {
  console.log('📝 Inserting sample video content for p09yRj47kNM...');
  
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
      content: 'Let\'s look at practical examples. Instead of asking "Create a lesson plan," try "Create a 45-minute lesson plan for 8th grade science students about photosynthesis, including a hands-on activity and assessment rubric." See how the specific details help the AI understand exactly what you need.',
      topic: 'Practical Prompt Examples',
      keywords: JSON.stringify(['lesson plans', 'specific details', 'hands-on activities', 'assessment', 'examples'])
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO video_content_chunks 
    (video_id, start_time, end_time, content, topic, keywords)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  sampleChunks.forEach(chunk => {
    insertStmt.run(
      chunk.video_id,
      chunk.start_time,
      chunk.end_time,
      chunk.content,
      chunk.topic,
      chunk.keywords
    );
  });
  
  insertStmt.finalize(() => {
    console.log(`✅ Inserted ${sampleChunks.length} sample chunks for video p09yRj47kNM`);
    db.close();
  });
}
