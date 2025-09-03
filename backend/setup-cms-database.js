// CMS Database Setup Script
// File: backend/setup-cms-database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'learning_buddy.db');  // Using the main database
const db = new sqlite3.Database(dbPath);

console.log('Setting up Content Management System database...');

// SQL scripts for creating CMS tables
const createCMSTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Course creators and permissions
      db.run(`CREATE TABLE IF NOT EXISTS course_creators (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'creator',
        permissions TEXT DEFAULT '["create_course", "edit_own", "upload_content"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Main courses table
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
      )`);

      // Course modules
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
      )`);

      // Course lessons
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
      )`);

      // Content items
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
      )`);

      // User progress tracking
      db.run(`CREATE TABLE IF NOT EXISTS user_content_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_item_id TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        progress_percentage REAL DEFAULT 0.0,
        time_spent INTEGER DEFAULT 0,
        last_position INTEGER DEFAULT 0,
        completion_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (content_item_id) REFERENCES content_items(id),
        UNIQUE(user_id, content_item_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_lesson_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        progress_percentage REAL DEFAULT 0.0,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (lesson_id) REFERENCES course_lessons(id),
        UNIQUE(user_id, lesson_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_module_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_id TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        progress_percentage REAL DEFAULT 0.0,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (module_id) REFERENCES course_modules(id),
        UNIQUE(user_id, module_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_course_enrollments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        status TEXT DEFAULT 'enrolled',
        progress_percentage REAL DEFAULT 0.0,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        last_accessed DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        UNIQUE(user_id, course_id)
      )`);

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_courses_creator ON courses(created_by)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id, order_index)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_lessons_module ON course_lessons(module_id, order_index)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_content_lesson ON content_items(lesson_id, order_index)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_progress_user_content ON user_content_progress(user_id, content_item_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_course_enrollments(user_id, status)`);

      console.log('✅ CMS database tables created successfully');
      resolve();
    });
  });
};

// Add creator permissions column to users table
const addCreatorPermissions = () => {
  return new Promise((resolve, reject) => {
    db.run(`ALTER TABLE users ADD COLUMN can_create_courses BOOLEAN DEFAULT false`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.warn('Note: can_create_courses column may already exist');
      }
      console.log('✅ User permissions updated');
      resolve();
    });
  });
};

// Create sample course creator permissions
const createSamplePermissions = () => {
  return new Promise((resolve, reject) => {
    // Check if there are any users to grant permissions to
    db.get(`SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1`, (err, user) => {
      if (err) {
        console.error('Error finding users:', err);
        reject(err);
        return;
      }

      if (!user) {
        console.log('ℹ️  No users found. Create a user first, then run this script again to grant creator permissions.');
        resolve();
        return;
      }

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
            console.error('Error creating creator permissions:', insertErr);
            reject(insertErr);
            return;
          }

          if (this.changes > 0) {
            console.log(`✅ Admin permissions granted to ${user.email}`);
          } else {
            console.log(`ℹ️  Permissions already exist for ${user.email}`);
          }
          resolve();
        }
      );
    });
  });
};

// Create sample course structure
const createSampleCourse = () => {
  return new Promise((resolve, reject) => {
    // Get the first admin user
    db.get(`SELECT cc.user_id FROM course_creators cc WHERE cc.role = 'admin' LIMIT 1`, (err, creator) => {
      if (err || !creator) {
        console.log('ℹ️  No admin users found. Skipping sample course creation.');
        resolve();
        return;
      }

      const courseId = uuidv4();
      const moduleId = uuidv4();
      const lessonId = uuidv4();
      const contentId = uuidv4();

      // Create sample course
      db.run(
        `INSERT OR IGNORE INTO courses (id, title, description, learning_objectives, estimated_duration, difficulty_level, created_by, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          courseId,
          'Introduction to AI in Education',
          'A comprehensive introduction to using artificial intelligence tools effectively in K-12 classroom settings.',
          JSON.stringify([
            'Understand the basic principles of AI and how they apply to education',
            'Identify appropriate AI tools for different classroom scenarios',
            'Create effective prompts for AI-assisted lesson planning',
            'Evaluate the ethical implications of AI use in education'
          ]),
          180, // 3 hours
          'beginner',
          creator.user_id,
          'published'
        ],
        function(courseErr) {
          if (courseErr) {
            console.error('Error creating sample course:', courseErr);
            reject(courseErr);
            return;
          }

          if (this.changes === 0) {
            console.log('ℹ️  Sample course already exists');
            resolve();
            return;
          }

          // Create sample module
          db.run(
            `INSERT INTO course_modules (id, course_id, title, description, learning_objectives, order_index, estimated_duration)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              moduleId,
              courseId,
              'Getting Started with AI',
              'Fundamental concepts and first steps with AI tools',
              JSON.stringify([
                'Define artificial intelligence in educational contexts',
                'Identify common AI tools available to educators'
              ]),
              1,
              60
            ],
            function(moduleErr) {
              if (moduleErr) {
                console.error('Error creating sample module:', moduleErr);
                reject(moduleErr);
                return;
              }

              // Create sample lesson
              db.run(
                `INSERT INTO course_lessons (id, module_id, title, description, order_index, estimated_duration, lesson_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  lessonId,
                  moduleId,
                  'What is AI?',
                  'Understanding the basics of artificial intelligence and its applications in education',
                  1,
                  30,
                  'content'
                ],
                function(lessonErr) {
                  if (lessonErr) {
                    console.error('Error creating sample lesson:', lessonErr);
                    reject(lessonErr);
                    return;
                  }

                  // Create sample content item
                  db.run(
                    `INSERT INTO content_items (id, lesson_id, title, description, content_type, order_index, is_required, metadata)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      contentId,
                      lessonId,
                      'Introduction to AI Concepts',
                      'A brief overview of artificial intelligence and machine learning concepts relevant to education',
                      'text',
                      1,
                      true,
                      JSON.stringify({
                        content: `# Introduction to AI in Education

Artificial Intelligence (AI) is transforming how we approach teaching and learning. In this lesson, we'll explore:

## What is AI?
AI refers to computer systems that can perform tasks that typically require human intelligence, such as:
- Understanding and generating text
- Recognizing patterns in data
- Making predictions based on information
- Adapting to new situations

## AI in Education
AI tools can help educators:
- Create personalized learning experiences
- Generate educational content and assessments
- Provide instant feedback to students
- Analyze learning patterns and progress
- Automate administrative tasks

## Getting Started
The key to successful AI integration is to start small and focus on tools that address real classroom needs. Remember: AI is a tool to enhance your teaching, not replace your expertise.`
                      })
                    ],
                    function(contentErr) {
                      if (contentErr) {
                        console.error('Error creating sample content:', contentErr);
                        reject(contentErr);
                        return;
                      }

                      console.log('✅ Sample course structure created successfully');
                      resolve();
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

// Main setup function
async function setupCMS() {
  try {
    await createCMSTables();
    await addCreatorPermissions();
    await createSamplePermissions();
    await createSampleCourse();
    
    console.log('\n🎉 CMS setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Install multer: npm install multer');
    console.log('2. Create uploads directories');
    console.log('3. Add CMS routes to server.js');
    console.log('4. Add CourseCreator component to frontend');
    console.log('\nYour colleagues can now create courses! 🚀');
    
  } catch (error) {
    console.error('❌ CMS setup failed:', error);
  } finally {
    db.close();
  }
}

// Run setup
setupCMS();