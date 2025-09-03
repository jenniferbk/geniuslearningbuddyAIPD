// Create sample course with modules, lessons, and content
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);

async function createSampleCourse() {
  console.log('🎯 Creating sample course with full structure...\n');
  
  try {
    // 1. Find a user to be the course creator
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email FROM users LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      console.log('❌ No users found. Please register a user first.');
      return;
    }
    
    console.log(`👤 Using user: ${user.email} as course creator`);
    
    // 2. Create the course
    const courseId = uuidv4();
    const courseResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO courses (id, title, description, learning_objectives, estimated_duration, difficulty_level, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        courseId,
        'AI Literacy for Educators',
        'Learn how to effectively integrate AI tools into your K-12 teaching practice. This comprehensive course covers AI fundamentals, practical applications, and ethical considerations.',
        JSON.stringify([
          'Understand AI fundamentals and their educational applications',
          'Create effective prompts for AI-powered lesson planning',
          'Implement AI tools for student assessment and feedback',
          'Navigate ethical considerations of AI in education'
        ]),
        240, // 4 hours
        'beginner',
        user.id,
        'published'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log(`📚 Course created: ${courseResult > 0 ? 'NEW' : 'UPDATED'}`);
    
    // 3. Create Module 1
    const module1Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO course_modules (id, course_id, title, description, learning_objectives, order_index, estimated_duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        module1Id,
        courseId,
        'Understanding AI Fundamentals',
        'Introduction to artificial intelligence concepts and their relevance to education',
        JSON.stringify([
          'Define AI and machine learning in educational contexts',
          'Identify different types of AI tools available to educators'
        ]),
        1,
        80
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('📂 Module 1 created: Understanding AI Fundamentals');
    
    // 4. Create lessons for Module 1
    const lesson1Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO course_lessons (id, module_id, title, description, order_index, estimated_duration, lesson_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        lesson1Id,
        module1Id,
        'What is AI?',
        'Explore the basic concepts of artificial intelligence and how they apply to education',
        1,
        40,
        'content'
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('  📝 Lesson 1.1 created: What is AI?');
    
    // 5. Create content for Lesson 1
    const content1Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO content_items (id, lesson_id, title, description, content_type, order_index, is_required, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        content1Id,
        lesson1Id,
        'AI Foundations Video',
        'Watch this introductory video about AI concepts for educators',
        'video',
        1,
        true,
        JSON.stringify({
          videoId: 'p09yRj47kNM',
          contentUrl: 'https://www.youtube.com/watch?v=p09yRj47kNM',
          duration: '12:30'
        })
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('    🎥 Content 1.1.1 created: AI Foundations Video');
    
    // 6. Create second lesson
    const lesson2Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO course_lessons (id, module_id, title, description, order_index, estimated_duration, lesson_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        lesson2Id,
        module1Id,
        'AI Tools for Teachers',
        'Survey of popular AI tools and their classroom applications',
        2,
        40,
        'content'
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('  📝 Lesson 1.2 created: AI Tools for Teachers');
    
    // 7. Create text content for Lesson 2
    const content2Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO content_items (id, lesson_id, title, description, content_type, order_index, is_required, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        content2Id,
        lesson2Id,
        'Popular AI Tools Overview',
        'Read about the most commonly used AI tools in education',
        'text',
        1,
        true,
        JSON.stringify({
          content: `# Popular AI Tools for Educators

Here are some of the most useful AI tools for teachers:

## Content Creation
- **ChatGPT**: Generate lesson plans, assignments, and explanations
- **Claude**: Create detailed educational content and provide tutoring support  
- **Jasper AI**: Develop marketing materials and parent communications

## Assessment & Feedback
- **Gradescope**: Automated grading with AI assistance
- **Turnitin**: Plagiarism detection and writing feedback
- **Quillbot**: Grammar checking and writing improvement

## Classroom Management
- **Otter.ai**: Automatic meeting transcription
- **Calendly**: AI-powered scheduling
- **Notion**: Organized lesson planning with AI templates

## Student Engagement
- **Kahoot!**: AI-generated quiz questions
- **Flipgrid**: Video discussions with automated moderation
- **Padlet**: Collaborative boards with smart organization

Remember: Start with one tool, master it, then expand your toolkit gradually.`
        })
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('    📄 Content 1.2.1 created: Popular AI Tools Overview');
    
    // 8. Create Module 2
    const module2Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO course_modules (id, course_id, title, description, learning_objectives, order_index, estimated_duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        module2Id,
        courseId,
        'Practical AI Applications',
        'Hands-on experience with AI tools for lesson planning and student support',
        JSON.stringify([
          'Create effective prompts for educational content generation',
          'Use AI for personalized student feedback and assessment'
        ]),
        2,
        160
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('📂 Module 2 created: Practical AI Applications');
    
    // 9. Create lesson for Module 2
    const lesson3Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO course_lessons (id, module_id, title, description, order_index, estimated_duration, lesson_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        lesson3Id,
        module2Id,
        'Prompt Engineering for Educators',
        'Learn how to write effective prompts that get the best results from AI tools',
        1,
        60,
        'activity'
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('  📝 Lesson 2.1 created: Prompt Engineering for Educators');
    
    // 10. Create content for Module 2 lesson
    const content3Id = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO content_items (id, lesson_id, title, description, content_type, order_index, is_required, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        content3Id,
        lesson3Id,
        'Prompt Engineering Basics',
        'Learn the fundamentals of writing effective AI prompts',
        'text',
        1,
        true,
        JSON.stringify({
          content: `# Prompt Engineering for Educators

Effective prompts are the key to getting useful responses from AI tools. Here's how to write them:

## The CLEAR Framework

### **C**ontext
Always provide relevant background:
- "I teach 5th grade science"
- "My students are English language learners"
- "This is for a unit on ecosystems"

### **L**ength
Specify the desired length:
- "Write a 200-word summary"
- "Create a 45-minute lesson plan"
- "Generate 5 discussion questions"

### **E**xample
Show what you want:
- "Like this example: [provide sample]"
- "In the style of [familiar format]"
- "Similar to [well-known resource]"

### **A**udience
Define your target audience:
- "For 8th graders reading at grade level"
- "Appropriate for parents at back-to-school night"
- "For beginning teachers in their first year"

### **R**ole
Tell the AI what role to take:
- "Act as an experienced kindergarten teacher"
- "Respond as a patient tutor"
- "Write from the perspective of a curriculum specialist"

## Practice Activity
Try rewriting this weak prompt using the CLEAR framework:
**Weak**: "Make a lesson about plants"
**Strong**: "Act as a 3rd grade teacher and create a 30-minute hands-on lesson about plant parts for 20 students, including a simple experiment they can do with bean seeds, formatted as a detailed lesson plan with materials list and step-by-step instructions."

The difference in results will amaze you!`
        })
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('    📄 Content 2.1.1 created: Prompt Engineering Basics');
    
    console.log('\n✅ Sample course structure created successfully!');
    console.log(`\n📋 Course Summary:`);
    console.log(`   Course ID: ${courseId}`);
    console.log(`   Modules: 2`);
    console.log(`   Lessons: 3`);
    console.log(`   Content Items: 3`);
    console.log(`\n🌐 Test URLs:`);
    console.log(`   Homepage: http://localhost:3000/`);
    console.log(`   Course: http://localhost:3000/courses/${courseId}`);
    console.log(`   Debug: http://localhost:3001/api/debug/course-structure/${courseId}`);
    
  } catch (error) {
    console.error('❌ Error creating sample course:', error);
  } finally {
    db.close();
  }
}

createSampleCourse();
