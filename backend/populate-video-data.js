// populate-video-data.js - Add sample video content chunks for testing
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

// Sample video content chunks for p09yRj47kNM (Google's 9 Hour AI Prompt Engineering)
const sampleChunks = [
  {
    video_id: 'p09yRj47kNM',
    start_time: 0,
    end_time: 60,
    content: 'Welcome to Google\'s comprehensive AI Prompt Engineering course. In this introduction, we\'ll cover the fundamentals of creating effective prompts for AI systems like ChatGPT and Claude. Understanding prompt engineering is crucial for educators who want to integrate AI tools into their teaching practice.',
    topic: 'Introduction to AI Prompt Engineering',
    keywords: ['prompt engineering', 'AI fundamentals', 'ChatGPT', 'teaching', 'introduction']
  },
  {
    video_id: 'p09yRj47kNM',
    start_time: 60,
    end_time: 120,
    content: 'Effective prompts have several key characteristics: they are clear, specific, and provide context. For teachers, this means crafting prompts that help AI understand your educational goals, student level, and subject matter. Let\'s explore how to structure prompts for maximum effectiveness.',
    topic: 'Characteristics of Effective Prompts',
    keywords: ['prompt structure', 'clarity', 'specificity', 'context', 'educational goals']
  },
  {
    video_id: 'p09yRj47kNM',
    start_time: 120,
    end_time: 180,
    content: 'When writing prompts for educational content, consider your audience. Are you creating materials for elementary students or high schoolers? The AI needs this context to adjust vocabulary, complexity, and examples. Always specify the grade level and subject area in your prompts.',
    topic: 'Audience-Specific Prompt Writing',
    keywords: ['audience', 'grade level', 'vocabulary', 'complexity', 'subject area']
  },
  {
    video_id: 'p09yRj47kNM',
    start_time: 180,
    end_time: 240,
    content: 'Let\'s look at practical examples. Instead of asking "Create a lesson plan," try "Create a 45-minute lesson plan for 8th grade science students about photosynthesis, including a hands-on activity and assessment rubric." See how the specific details help the AI understand exactly what you need.',
    topic: 'Practical Prompt Examples',
    keywords: ['lesson plans', 'specific details', 'hands-on activities', 'assessment', 'examples']
  },
  {
    video_id: 'p09yRj47kNM',
    start_time: 240,
    end_time: 300,
    content: 'Common mistakes in prompt engineering include being too vague, not providing enough context, and forgetting to specify the format you want. For instance, if you want a rubric, ask for a rubric explicitly. If you want bullet points, mention that in your prompt.',
    topic: 'Common Prompt Engineering Mistakes',
    keywords: ['common mistakes', 'vague prompts', 'context', 'format specification', 'rubrics']
  },
  {
    video_id: 'p09yRj47kNM',
    start_time: 300,
    end_time: 360,
    content: 'Advanced prompt techniques include role-playing, where you ask the AI to take on a specific role like "Act as an experienced 5th grade teacher" or using step-by-step instructions. These techniques can dramatically improve the quality and relevance of AI responses.',
    topic: 'Advanced Prompt Techniques',
    keywords: ['role-playing', 'step-by-step', 'experienced teacher', 'advanced techniques', 'quality improvement']
  }
];

// Function to populate database
async function populateVideoData() {
  try {
    console.log('🗄️ Populating video content chunks...');
    
    // First, create the table if it doesn't exist
    await new Promise((resolve, reject) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS video_content_chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          content TEXT NOT NULL,
          topic TEXT,
          keywords TEXT,
          embedding TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Clear existing chunks for this video
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM video_content_chunks WHERE video_id = ?', ['p09yRj47kNM'], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Insert sample chunks
    const stmt = db.prepare(`
      INSERT INTO video_content_chunks 
      (video_id, start_time, end_time, content, topic, keywords)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const chunk of sampleChunks) {
      await new Promise((resolve, reject) => {
        stmt.run(
          chunk.video_id,
          chunk.start_time,
          chunk.end_time,
          chunk.content,
          chunk.topic,
          JSON.stringify(chunk.keywords),
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log(`✅ Added chunk: ${chunk.start_time}-${chunk.end_time}s - ${chunk.topic}`);
    }
    
    stmt.finalize();
    
    // Verify the data was inserted
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?', ['p09yRj47kNM'], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`🎉 Successfully populated ${count} video content chunks for p09yRj47kNM`);
    
    // Test a sample query
    const testChunk = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM video_content_chunks 
        WHERE video_id = ? AND start_time <= ? AND end_time > ?
        ORDER BY start_time DESC
        LIMIT 1
      `, ['p09yRj47kNM', 5, 5], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (testChunk) {
      console.log('🧪 Test query successful:', {
        topic: testChunk.topic,
        timeRange: `${testChunk.start_time}-${testChunk.end_time}s`
      });
    } else {
      console.log('⚠️ Test query returned no results');
    }
    
  } catch (error) {
    console.error('❌ Error populating video data:', error);
  } finally {
    db.close();
  }
}

// Run the population script
populateVideoData();
