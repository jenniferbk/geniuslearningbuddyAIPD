// grant-creator-permissions-to-all.js
// Script to grant creator permissions to all existing users

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'learning_buddy.db');  // Note: Server uses learning_buddy.db not learning_buddy.db
const db = new sqlite3.Database(dbPath);

console.log('🔧 Granting creator permissions to all existing users...');

// First, ensure the course_creators table exists
db.run(`
  CREATE TABLE IF NOT EXISTS course_creators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'creator',
    permissions TEXT DEFAULT '["create_course", "edit_own", "upload_content"]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating course_creators table:', err);
    return;
  }
  
  console.log('✅ Course creators table ready');
  
  // Find all users who don't have creator permissions yet
  db.all(`
    SELECT u.id, u.email, u.name 
    FROM users u
    LEFT JOIN course_creators cc ON u.id = cc.user_id
    WHERE cc.user_id IS NULL
  `, (err, users) => {
    if (err) {
      console.error('❌ Error finding users:', err);
      return;
    }
    
    if (users.length === 0) {
      console.log('ℹ️  All users already have creator permissions!');
      db.close();
      return;
    }
    
    console.log(`📝 Found ${users.length} users without creator permissions`);
    
    // Grant permissions to each user
    const stmt = db.prepare(`
      INSERT INTO course_creators (id, user_id, role, permissions)
      VALUES (?, ?, ?, ?)
    `);
    
    let processed = 0;
    
    users.forEach(user => {
      const creatorId = uuidv4();
      const permissions = JSON.stringify(['create_course', 'edit_own', 'upload_content']);
      
      stmt.run(creatorId, user.id, 'creator', permissions, (err) => {
        if (err) {
          console.error(`❌ Error granting permissions to ${user.email}:`, err);
        } else {
          console.log(`✅ Granted creator permissions to: ${user.email}`);
        }
        
        processed++;
        
        if (processed === users.length) {
          stmt.finalize();
          console.log(`\n🎉 Successfully granted creator permissions to ${users.length} users!`);
          console.log('📍 All users can now access the CMS at /cms');
          db.close();
        }
      });
    });
  });
});
