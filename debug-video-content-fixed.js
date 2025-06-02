// debug-video-content-fixed.js - Check video content status with correct tables
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the correct database name
const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
console.log('🗄️ Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Check video content chunks
console.log('\n📹 Checking video content chunks...');
db.all(`
  SELECT 
    video_id,
    COUNT(*) as chunk_count,
    MIN(start_time) as min_time,
    MAX(end_time) as max_time,
    GROUP_CONCAT(DISTINCT topic) as topics
  FROM video_content_chunks
  GROUP BY video_id
`, (err, rows) => {
  if (err) {
    console.error('❌ Error querying video chunks:', err);
    // Try to create the table
    console.log('\n🔨 Attempting to create video_content_chunks table...');
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
    `, (createErr) => {
      if (createErr) {
        console.error('❌ Error creating table:', createErr);
      } else {
        console.log('✅ Table created successfully');
      }
    });
    return;
  }
  
  console.log(`\n📊 Found ${rows ? rows.length : 0} video(s) with chunks:`);
  if (rows) {
    rows.forEach(row => {
      console.log(`\n  Video ID: ${row.video_id}`);
      console.log(`  Chunks: ${row.chunk_count}`);
      console.log(`  Time range: ${row.min_time}-${row.max_time} seconds`);
      console.log(`  Topics: ${row.topics}`);
    });
  }
});

// Check specific video
const targetVideoId = 'p09yRj47kNM';
console.log(`\n🎥 Checking specific video: ${targetVideoId}`);
db.all(`
  SELECT 
    start_time,
    end_time,
    topic,
    SUBSTR(content, 1, 100) as content_preview
  FROM video_content_chunks
  WHERE video_id = ?
  ORDER BY start_time
  LIMIT 5
`, [targetVideoId], (err, rows) => {
  if (err) {
    console.error('❌ Error querying specific video:', err);
    return;
  }
  
  if (!rows || rows.length === 0) {
    console.log('\n⚠️ No chunks found for this video');
    console.log('💡 Run the app and click "Load Content" button to populate sample data');
  } else {
    console.log(`\n📝 First ${rows.length} chunks:`);
    rows.forEach((row, idx) => {
      console.log(`\n  Chunk ${idx + 1}:`);
      console.log(`    Time: ${row.start_time}-${row.end_time}s`);
      console.log(`    Topic: ${row.topic}`);
      console.log(`    Content: ${row.content_preview}...`);
    });
  }
});

// Check user video progress
console.log('\n📊 Checking user video progress...');
db.all(`
  SELECT 
    user_id,
    video_id,
    current_position,
    duration,
    progress_percentage,
    completed,
    last_updated
  FROM user_video_progress
  ORDER BY last_updated DESC
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('❌ Error querying progress:', err);
    // Try to create the table
    console.log('\n🔨 Attempting to create user_video_progress table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_video_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        current_position REAL NOT NULL,
        duration REAL NOT NULL,
        progress_percentage REAL NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, video_id)
      )
    `, (createErr) => {
      if (createErr) {
        console.error('❌ Error creating table:', createErr);
      } else {
        console.log('✅ Table created successfully');
      }
    });
    return;
  }
  
  console.log(`\n📈 Recent progress entries (${rows ? rows.length : 0}):`);
  if (rows) {
    rows.forEach(row => {
      console.log(`\n  User: ${row.user_id}`);
      console.log(`  Video: ${row.video_id}`);
      console.log(`  Progress: ${row.current_position}/${row.duration} (${Math.round(row.progress_percentage)}%)`);
      console.log(`  Completed: ${row.completed ? '✓' : '✗'}`);
      console.log(`  Updated: ${row.last_updated}`);
    });
  }
});

// Test API endpoint
const http = require('http');

console.log('\n🌐 Testing API endpoint...');
const testData = JSON.stringify({
  videoId: targetVideoId,
  timestamp: 10,
  userId: 1
});

// Need to get a valid auth token first
console.log('\n⚠️ Note: API test requires authentication token');
console.log('💡 To test API, ensure backend is running and you are logged in');

// Close database after a delay
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('\n✅ Database closed');
    }
  });
}, 2000);
