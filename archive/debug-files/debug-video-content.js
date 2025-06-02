// debug-video-content.js - Check video content status
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'ai-literacy.db');
console.log('🗄️ Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Check video content
console.log('\n📹 Checking video content...');
db.all(`
  SELECT 
    id, 
    title, 
    type, 
    youtube_video_id, 
    duration,
    CASE 
      WHEN transcript_data IS NOT NULL THEN '✓ Has transcript'
      ELSE '✗ No transcript'
    END as transcript_status,
    LENGTH(transcript_data) as transcript_length,
    created_at
  FROM content 
  WHERE type = 'video'
`, (err, rows) => {
  if (err) {
    console.error('❌ Error querying content:', err);
    return;
  }
  
  console.log(`\n📊 Found ${rows.length} video(s):`);
  rows.forEach(row => {
    console.log(`\n  ID: ${row.id}`);
    console.log(`  Title: ${row.title}`);
    console.log(`  YouTube ID: ${row.youtube_video_id}`);
    console.log(`  Duration: ${row.duration} seconds`);
    console.log(`  Transcript: ${row.transcript_status} (${row.transcript_length || 0} bytes)`);
    console.log(`  Created: ${row.created_at}`);
  });
  
  // Check first video's transcript structure
  if (rows.length > 0) {
    db.get(`
      SELECT transcript_data 
      FROM content 
      WHERE id = ?
    `, [rows[0].id], (err, row) => {
      if (err) {
        console.error('❌ Error getting transcript:', err);
        return;
      }
      
      if (row && row.transcript_data) {
        try {
          const transcript = JSON.parse(row.transcript_data);
          console.log('\n📝 Transcript structure:');
          console.log(`  Chunks: ${transcript.length}`);
          if (transcript.length > 0) {
            console.log(`  First chunk:`, {
              start: transcript[0].start,
              end: transcript[0].end,
              text: transcript[0].text.substring(0, 50) + '...',
              topic: transcript[0].topic
            });
            console.log(`  Last chunk:`, {
              start: transcript[transcript.length - 1].start,
              end: transcript[transcript.length - 1].end,
              text: transcript[transcript.length - 1].text.substring(0, 50) + '...',
              topic: transcript[transcript.length - 1].topic
            });
          }
        } catch (e) {
          console.error('❌ Error parsing transcript:', e);
        }
      }
    });
  }
});

// Check progress tracking
console.log('\n📊 Checking progress tracking...');
db.all(`
  SELECT 
    p.*,
    c.title as content_title
  FROM progress p
  JOIN content c ON p.content_id = c.id
  ORDER BY p.last_updated DESC
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('❌ Error querying progress:', err);
    return;
  }
  
  console.log(`\n📈 Recent progress entries (${rows.length}):`);
  rows.forEach(row => {
    console.log(`\n  User: ${row.user_id}`);
    console.log(`  Content: ${row.content_title}`);
    console.log(`  Progress: ${row.current_position}/${row.duration} (${Math.round(row.progress)}%)`);
    console.log(`  Completed: ${row.completed ? '✓' : '✗'}`);
    console.log(`  Updated: ${row.last_updated}`);
  });
});

// Test API endpoint
const http = require('http');

console.log('\n🌐 Testing API endpoint...');
const testData = JSON.stringify({
  videoId: 'p09yRj47kNM',
  timestamp: 10,
  userId: 1
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/content/video-context',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

const req = http.request(options, (res) => {
  console.log(`\n📡 API Response Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📦 API Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('📄 Raw response:', data);
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('\n✅ Database closed');
      }
    });
  });
});

req.on('error', (e) => {
  console.error(`\n❌ API request error: ${e.message}`);
  console.log('💡 Make sure the backend server is running on port 3001');
  db.close();
});

req.write(testData);
req.end();
