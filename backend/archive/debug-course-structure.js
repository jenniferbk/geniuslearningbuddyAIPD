// Debug script to check course structure in database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ContentManagementService = require('./cms-service');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);
const cmsService = new ContentManagementService(db);

async function debugCourseStructure() {
  console.log('=== DEBUGGING COURSE STRUCTURE ===\n');
  
  try {
    // 1. Check all courses
    const courses = await cmsService.getCourses();
    console.log(`📚 Found ${courses.length} courses:`);
    courses.forEach(course => {
      console.log(`  - ${course.id}: ${course.title} (status: ${course.status})`);
    });
    console.log();
    
    if (courses.length === 0) {
      console.log('❌ No courses found in database!');
      console.log('Run: node setup-cms-database.js to create sample course');
      return;
    }
    
    // 2. Check modules for each course
    for (const course of courses) {
      console.log(`🔍 Checking modules for course: ${course.title}`);
      const modules = await cmsService.getModules(course.id);
      console.log(`  📂 Found ${modules.length} modules`);
      
      if (modules.length === 0) {
        console.log('    ⚠️ No modules found for this course!');
        continue;
      }
      
      modules.forEach(module => {
        console.log(`    - ${module.id}: ${module.title} (order: ${module.order_index})`);
      });
      
      // 3. Check lessons for each module
      for (const module of modules) {
        console.log(`    🔍 Checking lessons for module: ${module.title}`);
        const lessons = await cmsService.getLessons(module.id);
        console.log(`      📝 Found ${lessons.length} lessons`);
        
        if (lessons.length === 0) {
          console.log('        ⚠️ No lessons found for this module!');
          continue;
        }
        
        lessons.forEach(lesson => {
          console.log(`        - ${lesson.id}: ${lesson.title} (order: ${lesson.order_index})`);
        });
        
        // 4. Check content for each lesson
        for (const lesson of lessons) {
          console.log(`        🔍 Checking content for lesson: ${lesson.title}`);
          const content = await cmsService.getContentItems(lesson.id);
          console.log(`          💎 Found ${content.length} content items`);
          
          content.forEach(item => {
            console.log(`            - ${item.id}: ${item.title} (type: ${item.content_type})`);
          });
        }
      }
      console.log();
    }
    
    // 5. Test getFullCourseStructure for first course
    if (courses.length > 0) {
      const firstCourse = courses[0];
      console.log(`🧪 Testing getFullCourseStructure for: ${firstCourse.title}`);
      
      const fullStructure = await cmsService.getFullCourseStructure(firstCourse.id);
      
      if (!fullStructure) {
        console.log('❌ getFullCourseStructure returned null!');
      } else {
        console.log('✅ Full course structure:');
        console.log(`  Course: ${fullStructure.title}`);
        console.log(`  Modules: ${fullStructure.modules ? fullStructure.modules.length : 0}`);
        
        if (fullStructure.modules) {
          fullStructure.modules.forEach(module => {
            console.log(`    Module: ${module.title} (${module.lessons ? module.lessons.length : 0} lessons)`);
            if (module.lessons) {
              module.lessons.forEach(lesson => {
                console.log(`      Lesson: ${lesson.title} (${lesson.contentItems ? lesson.contentItems.length : 0} content items)`);
              });
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    db.close();
  }
}

debugCourseStructure();
