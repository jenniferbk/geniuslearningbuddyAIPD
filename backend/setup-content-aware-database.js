// setup-content-aware-database.js - Database setup for content-aware features
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Setting up content-aware database tables...');

// Add content_context column to conversations table if it doesn't exist
db.exec(`
  ALTER TABLE conversations ADD COLUMN content_context TEXT;
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding content_context column:', err.message);
  } else {
    console.log('✅ Added content_context column to conversations table');
  }
});

// Add content_context column to research_logs table if it doesn't exist
db.exec(`
  ALTER TABLE research_logs ADD COLUMN content_context TEXT;
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding content_context column to research_logs:', err.message);
  } else {
    console.log('✅ Added content_context column to research_logs table');
  }
});

// Create video content chunks table
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
  );
`, (err) => {
  if (err) {
    console.error('Error creating video_content_chunks table:', err.message);
  } else {
    console.log('✅ Created video_content_chunks table');
  }
});

// Create user video progress table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_video_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    current_position REAL NOT NULL,
    duration REAL NOT NULL,
    progress_percentage REAL NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
  );
`, (err) => {
  if (err) {
    console.error('Error creating user_video_progress table:', err.message);
  } else {
    console.log('✅ Created user_video_progress table');
  }
});

// Create video content context cache table
db.exec(`
  CREATE TABLE IF NOT EXISTS video_context_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    context_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, timestamp)
  );
`, (err) => {
  if (err) {
    console.error('Error creating video_context_cache table:', err.message);
  } else {
    console.log('✅ Created video_context_cache table');
  }
});

// Create content interactions table for research tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS content_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL,
    timestamp REAL,
    message_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`, (err) => {
  if (err) {
    console.error('Error creating content_interactions table:', err.message);
  } else {
    console.log('✅ Created content_interactions table');
  }
});

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_video_chunks_video_time ON video_content_chunks(video_id, start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_video_progress_user ON user_video_progress(user_id, video_id);
  CREATE INDEX IF NOT EXISTS idx_video_cache_lookup ON video_context_cache(video_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id, content_id);
`, (err) => {
  if (err) {
    console.error('Error creating indexes:', err.message);
  } else {
    console.log('✅ Created performance indexes');
  }
});

// Sample video content for testing (optional)
const sampleVideoContent = `
Welcome to our introduction to AI prompt engineering. In this lesson, we'll explore the fundamentals of creating effective prompts for AI systems. 

Prompt engineering is the art and science of crafting input text that guides AI models to produce desired outputs. Think of it like learning to ask the right questions to get the best answers.

Key principles include being specific, providing context, and iterating on your prompts. For example, instead of asking "write a lesson plan," you might ask "create a 45-minute lesson plan for 3rd-grade students about ecosystems, including hands-on activities and assessment questions."

We'll practice these techniques throughout this course, helping you become more effective at integrating AI tools into your teaching practice.
`;

// Clear any existing data and insert fresh content for the current video
db.run(`DELETE FROM video_content_chunks WHERE video_id IN ('intro_to_prompting', 'p09yRj47kNM')`, (err) => {
  if (err) {
    console.error('Error clearing old content:', err.message);
  } else {
    console.log('✅ Cleared old video content chunks');
  }
});

// Insert sample video content chunks for AI prompt engineering video
db.run(`
  INSERT INTO video_content_chunks (video_id, start_time, end_time, content, topic, keywords)
  VALUES 
    ('intro_to_prompting', 0, 60, ?, 'What is Prompt Engineering', ?),
    ('intro_to_prompting', 60, 120, ?, 'Why Teachers Need Prompt Engineering', ?),
    ('intro_to_prompting', 120, 180, ?, 'Basic Prompting Techniques', ?),
    ('intro_to_prompting', 180, 240, ?, 'Advanced Strategies for Education', ?),
    ('intro_to_prompting', 240, 300, ?, 'Classroom Examples and Applications', ?),
    ('p09yRj47kNM', 0, 60, ?, 'Introduction to AI Tools', ?),
    ('p09yRj47kNM', 60, 120, ?, 'Understanding AI Capabilities', ?),
    ('p09yRj47kNM', 120, 180, ?, 'Practical AI Applications', ?),
    ('p09yRj47kNM', 180, 240, ?, 'Getting Started with AI', ?)
`, [
  'Welcome teachers! Today we\'re learning about prompt engineering - the skill of writing clear, specific instructions for AI tools like ChatGPT. This is essential for getting useful responses in your classroom.',
  JSON.stringify(['prompt', 'engineering', 'teachers', 'chatgpt', 'instructions', 'classroom']),
  'As educators, you need to know how to communicate effectively with AI to save time on lesson planning, grading, and creating educational materials. Good prompts make AI your teaching assistant.',
  JSON.stringify(['educators', 'ai', 'lesson', 'planning', 'grading', 'teaching', 'assistant']),
  'Start with clear, specific requests. Instead of "help me teach math," try "create 5 word problems for 4th graders practicing multiplication with real-world scenarios about animals."',
  JSON.stringify(['specific', 'requests', 'math', 'word', 'problems', '4th', 'grade', 'multiplication']),
  'Advanced techniques include role-playing prompts, step-by-step instructions, and providing examples. Tell the AI to act as an experienced teacher or curriculum designer.',
  JSON.stringify(['advanced', 'techniques', 'role-playing', 'step-by-step', 'examples', 'curriculum']),
  'Let\'s see real classroom applications: generating discussion questions, creating rubrics, adapting content for different learning levels, and brainstorming creative lesson activities.',
  JSON.stringify(['classroom', 'applications', 'discussion', 'questions', 'rubrics', 'learning', 'levels'])
], (err) => {
  if (err) {
    console.error('Error inserting sample content:', err.message);
  } else {
    console.log('✅ Inserted sample video content chunks for video p09yRj47kNM and intro_to_prompting');
  }
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('🎉 Content-aware database setup complete!');
    console.log('');
    console.log('New Features Added:');
    console.log('• Timestamp-based video content chunks');
    console.log('• User video progress tracking');
    console.log('• Content context caching');
    console.log('• Content interaction logging');
    console.log('• Performance indexes');
    console.log('');
    console.log('🔧 Run this script with: node setup-content-aware-database.js');
  }
});
