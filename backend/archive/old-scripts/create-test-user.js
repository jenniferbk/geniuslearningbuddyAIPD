// create-test-user.js
// Script to create a test user with known credentials

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123', // Simple password for testing
  name: 'Test User',
  gradeLevel: 'mixed',
  subjects: ['AI', 'Technology'],
  techComfort: 'medium'
};

console.log('👤 Creating test user with known credentials...\n');

async function createTestUser() {
  try {
    // Check if user already exists
    db.get('SELECT id, email FROM users WHERE email = ?', [testUser.email], async (err, existingUser) => {
      if (err) {
        console.error('❌ Database error:', err);
        return;
      }
      
      if (existingUser) {
        console.log(`⚠️  User ${testUser.email} already exists (ID: ${existingUser.id})`);
        console.log('🔧 Updating password to ensure it works...');
        
        // Update the password
        const passwordHash = await bcrypt.hash(testUser.password, 10);
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, existingUser.id], (updateErr) => {
          if (updateErr) {
            console.error('❌ Error updating password:', updateErr);
            return;
          }
          
          console.log('✅ Password updated successfully');
          
          // Ensure they have creator permissions
          db.get('SELECT id FROM course_creators WHERE user_id = ?', [existingUser.id], (permErr, permission) => {
            if (permErr) {
              console.error('❌ Error checking permissions:', permErr);
              return;
            }
            
            if (!permission) {
              const creatorId = uuidv4();
              db.run(
                'INSERT INTO course_creators (id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
                [creatorId, existingUser.id, 'creator', JSON.stringify(['create_course', 'edit_own', 'upload_content'])],
                (creatorErr) => {
                  if (creatorErr) {
                    console.error('❌ Error creating permissions:', creatorErr);
                    return;
                  }
                  console.log('✅ Creator permissions granted');
                  printTestInstructions();
                  db.close();
                }
              );
            } else {
              console.log('✅ Creator permissions already exist');
              printTestInstructions();
              db.close();
            }
          });
        });
      } else {
        // Create new user
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(testUser.password, 10);
        
        db.run(
          `INSERT INTO users (id, email, password_hash, name, grade_level, subjects, tech_comfort) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, testUser.email, passwordHash, testUser.name, testUser.gradeLevel, JSON.stringify(testUser.subjects), testUser.techComfort],
          function(userErr) {
            if (userErr) {
              console.error('❌ Error creating user:', userErr);
              return;
            }
            
            console.log('✅ Test user created successfully');
            
            // Create learning progress
            db.run(
              `INSERT INTO learning_progress (id, user_id, module_id, completion_percentage, current_topic) 
               VALUES (?, ?, ?, ?, ?)`,
              [uuidv4(), userId, 'basic_ai_literacy', 0.0, 'what_is_ai'],
              (progressErr) => {
                if (progressErr) {
                  console.error('⚠️  Warning: Failed to create learning progress:', progressErr);
                }
              }
            );
            
            // Create creator permissions
            const creatorId = uuidv4();
            db.run(
              'INSERT INTO course_creators (id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
              [creatorId, userId, 'creator', JSON.stringify(['create_course', 'edit_own', 'upload_content'])],
              (creatorErr) => {
                if (creatorErr) {
                  console.error('❌ Error creating permissions:', creatorErr);
                  return;
                }
                console.log('✅ Creator permissions granted');
                printTestInstructions();
                db.close();
              }
            );
          }
        );
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    db.close();
  }
}

function printTestInstructions() {
  console.log('\n🎯 TEST USER READY:');
  console.log('==================');
  console.log(`📧 Email: ${testUser.email}`);
  console.log(`🔑 Password: ${testUser.password}`);
  console.log('');
  console.log('🔧 Test Steps:');
  console.log('1. Start the backend: npm start');
  console.log('2. Start the frontend: cd ../frontend-next && npm run dev');
  console.log('3. Go to: http://localhost:3000/auth/login');
  console.log(`4. Login with: ${testUser.email} / ${testUser.password}`);
  console.log('5. Navigate to: http://localhost:3000/cms');
  console.log('');
  console.log('✅ This should work perfectly!');
}

// Run the creation
createTestUser();
