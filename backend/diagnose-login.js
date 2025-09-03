// save as backend/diagnose-login.js
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const db = new sqlite3.Database('./learning_buddy.db');

console.log('=== LOGIN DIAGNOSTIC ===\n');

// Check users table structure
db.all("PRAGMA table_info(users)", (err, columns) => {
  console.log('User table columns:');
  columns.forEach(col => {
    if (col.name.includes('id') || col.name.includes('Id')) {
      console.log(`  - ${col.name} (${col.type})`);
    }
  });
  
  // Check actual users
  db.all("SELECT id, email, name FROM users LIMIT 5", (err, users) => {
    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}`);
    });
  });
});

// Decode a sample token if you have one
const sampleToken = process.argv[2];
if (sampleToken) {
  try {
    const decoded = jwt.decode(sampleToken);
    console.log('\nToken payload:', decoded);
  } catch(e) {
    console.log('\nCouldn't decode token');
  }
}