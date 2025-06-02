// test-auth-backend.js - Test backend authentication
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔐 Testing Backend Authentication System...');
console.log('=========================================');
console.log('');

// Check if users table exists and has data
console.log('👥 Checking users table...');
db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
  if (err) {
    console.error('❌ Error checking users table:', err.message);
    return;
  }
  
  console.log(`✅ Users table exists with ${result.count} users`);
  
  // Get some sample user data (without passwords)
  db.all("SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 3", (err, users) => {
    if (err) {
      console.error('❌ Error getting users:', err.message);
      return;
    }
    
    console.log('📊 Recent users:');
    users.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} (${user.name}) - ID: ${user.id.substring(0, 8)}...`);
    });
    
    // Check if Jennifer's account exists
    console.log('');
    console.log('🔍 Looking for Jennifer\'s account...');
    db.get("SELECT id, email, name FROM users WHERE email LIKE '%jennifer%'", (err, jennifer) => {
      if (err) {
        console.error('❌ Error finding Jennifer:', err.message);
      } else if (!jennifer) {
        console.log('❌ No account found with "jennifer" in email');
        console.log('💡 Try registering with an email containing "jennifer"');
      } else {
        console.log('✅ Found Jennifer\'s account:');
        console.log(`   Email: ${jennifer.email}`);
        console.log(`   Name: ${jennifer.name}`);
        console.log(`   ID: ${jennifer.id}`);
      }
      
      console.log('');
      console.log('🧪 Authentication troubleshooting steps:');
      console.log('1. Try registering a completely new account');
      console.log('2. Check browser Dev Tools → Application → Local Storage');
      console.log('3. Look for "token" key after successful login');
      console.log('4. Check if any browser extensions are clearing localStorage');
      console.log('5. Try incognito/private browsing mode');
      
      db.close();
    });
  });
});
