// Debug script to check user courses and permissions
// Run this to see what's in the database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the main database
const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Database Debug Information');
console.log('=============================\n');

// Check users
console.log('📋 USERS:');
db.all('SELECT id, email, name FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  
  users.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
  });
  
  console.log('\n📋 CREATOR PERMISSIONS:');
  db.all('SELECT cc.*, u.email FROM course_creators cc JOIN users u ON cc.user_id = u.id', (err, creators) => {
    if (err) {
      console.error('Error fetching creators:', err);
      return;
    }
    
    if (creators.length === 0) {
      console.log('  ❌ No creator permissions found!');
    } else {
      creators.forEach(creator => {
        console.log(`  - ${creator.email}: ${creator.role} (Permissions: ${creator.permissions})`);
      });
    }
    
    console.log('\n📋 COURSES:');
    db.all(`
      SELECT c.id, c.title, c.status, c.created_by, u.email as creator_email 
      FROM courses c 
      LEFT JOIN users u ON c.created_by = u.id
    `, (err, courses) => {
      if (err) {
        console.error('Error fetching courses:', err);
        return;
      }
      
      if (courses.length === 0) {
        console.log('  ❌ No courses found!');
      } else {
        courses.forEach(course => {
          console.log(`  - "${course.title}"`);
          console.log(`    Status: ${course.status}`);
          console.log(`    Created by: ${course.creator_email || 'Unknown'} (${course.created_by ? course.created_by.substring(0, 8) : 'null'}...)`);
        });
      }
      
      console.log('\n📋 COURSE MODULES:');
      db.all('SELECT COUNT(*) as count FROM course_modules', (err, result) => {
        if (err) {
          console.error('Error counting modules:', err);
        } else {
          console.log(`  Total modules: ${result[0].count}`);
        }
        
        console.log('\n📋 COURSE LESSONS:');
        db.all('SELECT COUNT(*) as count FROM course_lessons', (err, result) => {
          if (err) {
            console.error('Error counting lessons:', err);
          } else {
            console.log(`  Total lessons: ${result[0].count}`);
          }
          
          console.log('\n=============================');
          console.log('🔧 RECOMMENDATIONS:\n');
          
          if (creators.length === 0) {
            console.log('1. Run: node grant-creator-permissions-to-all.js');
          }
          
          if (courses.length === 0) {
            console.log('2. No courses exist. Create one through the CMS.');
          } else {
            console.log('2. Check that course created_by matches your user ID');
          }
          
          console.log('3. Make sure using correct database (learning_buddy.db)');
          console.log('\n✅ Debug complete!');
          
          db.close();
        });
      });
    });
  });
});
