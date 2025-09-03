// Quick script to check what content exists for a specific course
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

async function checkCourseContent() {
  const courseId = 'd00edb9f-1f1c-4c08-bec9-46b4c2ba7b6b';
  console.log(`🔍 Checking content for course: ${courseId}\n`);
  
  try {
    // Get course info
    const course = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`📚 Course: ${course?.title || 'Not found'}`);
    
    // Get modules
    const modules = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index', [courseId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📂 Modules: ${modules.length}`);
    
    for (const module of modules) {
      console.log(`\n  Module: ${module.title}`);
      
      // Get lessons for this module
      const lessons = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM course_lessons WHERE module_id = ? ORDER BY order_index', [module.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log(`    📝 Lessons: ${lessons.length}`);
      
      for (const lesson of lessons) {
        console.log(`\n      Lesson: ${lesson.title}`);
        
        // Get content for this lesson
        const content = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM content_items WHERE lesson_id = ? ORDER BY order_index', [lesson.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        console.log(`        💎 Content items: ${content.length}`);
        
        content.forEach((item, index) => {
          console.log(`\n          Content ${index + 1}:`);
          console.log(`            ID: ${item.id}`);
          console.log(`            Title: ${item.title}`);
          console.log(`            Type: ${item.content_type}`);
          console.log(`            Description: ${item.description?.substring(0, 100)}...`);
          
          // Parse and show metadata if it exists
          if (item.metadata) {
            try {
              const metadata = JSON.parse(item.metadata);
              console.log(`            Metadata keys: ${Object.keys(metadata)}`);
              
              if (metadata.content) {
                console.log(`            Content length: ${metadata.content.length} characters`);
                console.log(`            Content preview: ${metadata.content.substring(0, 200)}...`);
              }
            } catch (e) {
              console.log(`            Metadata: ${item.metadata.substring(0, 100)}...`);
            }
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

checkCourseContent();
