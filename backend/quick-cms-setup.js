// Quick CMS Database Setup Test
// File: backend/quick-cms-setup.js
// Run this with: node quick-cms-setup.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Setting up CMS database tables...');

db.serialize(() => {
  // Create CMS tables
  db.run(`CREATE TABLE IF NOT EXISTS course_creators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'creator',
    permissions TEXT DEFAULT '["create_course", "edit_own", "upload_content"]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('course_creators error:', err);
    else console.log('✅ course_creators table created');
  });

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    estimated_duration INTEGER,
    difficulty_level TEXT DEFAULT 'beginner',
    created_by TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('courses error:', err);
    else console.log('✅ courses table created');
  });

  db.run(`CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('course_modules error:', err);
    else console.log('✅ course_modules table created');
  });

  db.run(`CREATE TABLE IF NOT EXISTS course_lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_duration INTEGER,
    lesson_type TEXT DEFAULT 'content',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('course_lessons error:', err);
    else console.log('✅ course_lessons table created');
  });

  db.run(`CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    duration INTEGER,
    metadata TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('content_items error:', err);
    else console.log('✅ content_items table created');
  });

  // Get the first user and grant them admin permissions
  db.get('SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1', (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
    } else if (!user) {
      console.log('ℹ️  No users found. Register a user first, then run this script again.');
    } else {
      // Grant admin permissions to the first user
      const creatorId = uuidv4();
      db.run(
        `INSERT OR IGNORE INTO course_creators (id, user_id, role, permissions) VALUES (?, ?, ?, ?)`,
        [
          creatorId, 
          user.id, 
          'admin', 
          JSON.stringify(['create_course', 'edit_any', 'delete_any', 'manage_users', 'upload_content'])
        ],
        function(insertErr) {
          if (insertErr) {
            console.error('Error creating admin permissions:', insertErr);
          } else if (this.changes > 0) {
            console.log(`✅ Admin permissions granted to ${user.email}`);
          } else {
            console.log(`ℹ️  Admin permissions already exist for ${user.email}`);
          }
        }
      );
    }
  });
});

// Close database after all operations
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n🎉 CMS setup completed successfully!');
      console.log('Next steps:');
      console.log('1. Start your backend: npm start');
      console.log('2. Test the health endpoint: http://localhost:3001/api/health');
      console.log('3. Test CMS endpoints: http://localhost:3001/api/cms/courses');
      console.log('4. Your colleagues can now create courses! 🚀');
    }
  });
}, 2000); // Wait 2 seconds for all operations to complete