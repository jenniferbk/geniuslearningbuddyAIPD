// cleanup-orphaned-records.js
// Script to clean up orphaned course_creators records and invalid users

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Cleaning up orphaned records...\n');

// Remove orphaned course_creators (creators without corresponding users)
db.run(`
  DELETE FROM course_creators 
  WHERE user_id NOT IN (SELECT id FROM users)
`, function(err) {
  if (err) {
    console.error('❌ Error cleaning orphaned creators:', err);
    return;
  }
  
  console.log(`✅ Removed ${this.changes} orphaned course_creator records`);
  
  // Remove users without password hashes (they can't login anyway)
  db.run(`
    DELETE FROM users 
    WHERE password_hash IS NULL OR password_hash = ''
  `, function(err) {
    if (err) {
      console.error('❌ Error cleaning users without passwords:', err);
      return;
    }
    
    console.log(`✅ Removed ${this.changes} users without password hashes`);
    
    // Show what's left
    db.all(`
      SELECT u.email, u.name, u.created_at,
             CASE WHEN cc.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_creator_permissions
      FROM users u
      LEFT JOIN course_creators cc ON u.id = cc.user_id
      ORDER BY u.created_at
    `, (err, users) => {
      if (err) {
        console.error('❌ Error querying final state:', err);
        return;
      }
      
      console.log('\n📊 FINAL USER STATE:');
      console.log('=====================');
      
      if (users.length === 0) {
        console.log('⚠️  No valid users remaining!');
      } else {
        users.forEach(user => {
          console.log(`📧 ${user.email}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Creator Permissions: ${user.has_creator_permissions}`);
          console.log(`   Created: ${user.created_at}`);
          console.log('');
        });
      }
      
      console.log(`\n✨ Cleanup complete! ${users.length} valid users remaining.`);
      
      if (users.length > 0) {
        console.log('\n💡 All remaining users should be able to:');
        console.log('   1. Login at /auth/login');
        console.log('   2. Access CMS if they have creator permissions');
        console.log('\n🔧 If login still fails, check password spelling or create a new user.');
      }
      
      db.close();
    });
  });
});
