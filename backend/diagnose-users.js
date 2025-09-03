// diagnose-users.js
// Script to diagnose user authentication and permission issues

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Diagnosing user authentication and permissions...\n');

// Check all users in the users table
db.all(`SELECT id, email, name, password_hash, created_at FROM users ORDER BY created_at`, (err, users) => {
  if (err) {
    console.error('❌ Error querying users:', err);
    return;
  }
  
  console.log('👥 USERS TABLE:');
  console.log('================');
  if (users.length === 0) {
    console.log('⚠️  No users found in users table!');
  } else {
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Password Hash: ${user.password_hash ? 'Present ✅' : 'Missing ❌'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
  }
  
  // Check all course_creators
  db.all(`
    SELECT cc.*, u.email as user_email, u.name as user_name 
    FROM course_creators cc
    LEFT JOIN users u ON cc.user_id = u.id
    ORDER BY cc.created_at
  `, (err, creators) => {
    if (err) {
      console.error('❌ Error querying course_creators:', err);
      return;
    }
    
    console.log('\n🎨 COURSE CREATORS TABLE:');
    console.log('==========================');
    if (creators.length === 0) {
      console.log('⚠️  No course creators found!');
    } else {
      creators.forEach(creator => {
        console.log(`🔑 Creator ID: ${creator.id}`);
        console.log(`   User ID: ${creator.user_id}`);
        console.log(`   Email: ${creator.user_email || 'USER NOT FOUND ❌'}`);
        console.log(`   Name: ${creator.user_name || 'USER NOT FOUND ❌'}`);
        console.log(`   Role: ${creator.role}`);
        console.log(`   Status: ${creator.user_email ? 'Valid ✅' : 'Orphaned ❌'}`);
        console.log('');
      });
    }
    
    // Summary analysis
    console.log('\n📊 ANALYSIS:');
    console.log('=============');
    console.log(`Total users: ${users.length}`);
    console.log(`Total course creators: ${creators.length}`);
    
    const validCreators = creators.filter(c => c.user_email);
    const orphanedCreators = creators.filter(c => !c.user_email);
    
    console.log(`Valid creators: ${validCreators.length}`);
    console.log(`Orphaned creators: ${orphanedCreators.length}`);
    
    if (orphanedCreators.length > 0) {
      console.log('\n⚠️  ORPHANED CREATORS DETECTED:');
      orphanedCreators.forEach(creator => {
        console.log(`   - Creator ${creator.id} references non-existent user ${creator.user_id}`);
      });
      console.log('\n💡 These should be cleaned up.');
    }
    
    // Check for users without password hashes
    const usersWithoutPasswords = users.filter(u => !u.password_hash);
    if (usersWithoutPasswords.length > 0) {
      console.log('\n⚠️  USERS WITHOUT PASSWORD HASHES:');
      usersWithoutPasswords.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log('\n💡 These users cannot log in and should be fixed or removed.');
    }
    
    // List working logins
    const workingUsers = users.filter(u => u.password_hash);
    if (workingUsers.length > 0) {
      console.log('\n✅ USERS WHO CAN LOGIN:');
      workingUsers.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }
    
    db.close();
  });
});
