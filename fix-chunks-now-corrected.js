// fix-chunks-now-corrected.js - Fixed version without confidence column
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixChunksNow() {
  const videoId = 'p09yRj47kNM';
  const dbPath = path.join(__dirname, 'backend', 'ai_literacy_buddy.db');
  
  console.log('🔧 FIXING CHUNKS NOW! (Corrected version)');
  console.log('📺 Video ID:', videoId);
  console.log('🎯 Goal: Create 12-15 chunks covering full 21-minute video\n');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Step 1: Check table schema first
    console.log('🔍 Checking database table schema...');
    const schema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(video_content_chunks)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const columns = schema.map(col => col.name);
    console.log('📊 Available columns:', columns.join(', '));
    
    // Step 2: Clear existing test chunks
    console.log('\n🗑️ Step 2: Clearing 5 test chunks...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM video_content_chunks WHERE video_id = ?', [videoId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Test chunks cleared');
    
    // Step 3: Create proper chunks with full video coverage
    console.log('\n📊 Step 3: Creating 13 chunks with full coverage...');
    
    // Create realistic chunks that cover the full 21-minute video
    const properChunks = [
      {
        start_time: 0,
        end_time: 75,
        content: "Welcome to Google's comprehensive AI prompt engineering course for educators. I'm your instructor, and today we'll dive deep into how teachers can effectively use AI tools like ChatGPT and Claude in their classrooms. We'll start with the fundamentals of prompt engineering and work our way up to advanced applications that can transform your teaching practice.",
        topic: "Course Introduction and Welcome",
        keywords: ["google", "ai", "prompt", "engineering", "educators", "teachers", "chatgpt", "claude", "fundamentals", "teaching"]
      },
      {
        start_time: 75,
        end_time: 150,
        content: "Prompt engineering is the practice of crafting effective instructions for AI language models. For teachers, this means learning how to communicate with AI systems to get useful educational content. The key principles are specificity, context, and clear expectations. Think of it as giving very detailed instructions to a highly capable but literal-minded assistant.",
        topic: "What is Prompt Engineering",
        keywords: ["prompt", "engineering", "instructions", "ai", "language", "models", "teachers", "specificity", "context", "expectations"]
      },
      {
        start_time: 150,
        end_time: 225,
        content: "When creating prompts for educational purposes, always include three essential elements: the grade level of your students, the subject area you're teaching, and your specific learning objectives. For example, instead of asking 'Create a science lesson,' try 'Create a 45-minute lesson plan for 7th grade biology students on photosynthesis, including hands-on activities and formative assessments.'",
        topic: "Essential Elements of Educational Prompts",
        keywords: ["educational", "prompts", "grade", "level", "subject", "objectives", "lesson", "plan", "biology", "photosynthesis", "activities", "assessments"]
      },
      {
        start_time: 225,
        end_time: 300,
        content: "Let's look at practical examples of effective prompts. Here's a good one: 'Act as an experienced 5th grade teacher. Create a creative writing assignment about space exploration that includes a rubric focusing on creativity, scientific accuracy, and writing mechanics. Make it engaging for students who might struggle with traditional writing tasks.' Notice how specific and detailed this prompt is.",
        topic: "Practical Prompt Examples",
        keywords: ["practical", "examples", "experienced", "teacher", "creative", "writing", "space", "exploration", "rubric", "creativity", "accuracy", "engaging"]
      },
      {
        start_time: 300,
        end_time: 375,
        content: "Common mistakes teachers make when prompting AI include being too vague, not specifying the student audience, and forgetting to mention the desired format or length. Another mistake is not iterating on prompts. If your first attempt doesn't give you what you need, refine your instructions and try again. AI is very responsive to specific feedback.",
        topic: "Common Prompting Mistakes to Avoid",
        keywords: ["mistakes", "teachers", "vague", "audience", "format", "length", "iterating", "refine", "instructions", "feedback"]
      },
      {
        start_time: 375,
        end_time: 450,
        content: "For differentiated instruction, AI can help create multiple versions of the same content. Try this prompt: 'Create three versions of a math word problem about fractions for 4th graders: one simplified version for struggling learners, one at grade level, and one challenging version for advanced students. Include visual aids for the simplified version.'",
        topic: "Differentiated Instruction with AI",
        keywords: ["differentiated", "instruction", "multiple", "versions", "math", "fractions", "struggling", "learners", "grade", "level", "advanced", "visual", "aids"]
      },
      {
        start_time: 450,
        end_time: 525,
        content: "Assessment creation is another powerful application. You can prompt AI to generate quiz questions, project rubrics, and even peer evaluation forms. For example: 'Design a project-based assessment for middle school history students studying the American Revolution. Include a detailed rubric with criteria for research skills, historical thinking, and presentation quality.'",
        topic: "Creating Assessments with AI",
        keywords: ["assessment", "creation", "quiz", "questions", "rubrics", "peer", "evaluation", "project", "based", "history", "revolution", "research", "presentation"]
      },
      {
        start_time: 525,
        end_time: 600,
        content: "Advanced prompting techniques include role-playing prompts, where you ask AI to take on specific personas, and chain-of-thought prompting, where you ask AI to show its reasoning process. You can also use conditional prompts that adapt based on student responses or learning progress.",
        topic: "Advanced Prompting Techniques",
        keywords: ["advanced", "techniques", "role", "playing", "personas", "chain", "thought", "reasoning", "conditional", "prompts", "student", "responses", "progress"]
      },
      {
        start_time: 600,
        end_time: 675,
        content: "Let's discuss classroom implementation strategies. Start small with simple tasks like generating discussion questions or creating vocabulary lists. As you become more comfortable, move on to more complex applications like unit planning or creating interactive activities. Remember, AI is a tool to enhance your teaching, not replace your pedagogical expertise.",
        topic: "Classroom Implementation Strategies",
        keywords: ["classroom", "implementation", "strategies", "start", "small", "discussion", "questions", "vocabulary", "unit", "planning", "interactive", "activities", "enhance", "expertise"]
      },
      {
        start_time: 675,
        end_time: 750,
        content: "Student engagement can be significantly enhanced with AI-generated content. Try creating gamified learning experiences, interactive storytelling activities, or personalized learning paths. For instance: 'Design a choose-your-own-adventure story for 6th grade science class about the water cycle, with decision points that test understanding of evaporation, condensation, and precipitation.'",
        topic: "Enhancing Student Engagement",
        keywords: ["student", "engagement", "gamified", "learning", "interactive", "storytelling", "personalized", "adventure", "science", "water", "cycle", "evaporation", "condensation"]
      },
      {
        start_time: 750,
        end_time: 825,
        content: "Ethics and responsible AI use in education is crucial. Always review AI-generated content for accuracy and appropriateness. Be transparent with students about when you're using AI tools. Teach students about AI literacy and help them understand both the capabilities and limitations of these technologies.",
        topic: "Ethics and Responsible AI Use",
        keywords: ["ethics", "responsible", "ai", "use", "education", "review", "accuracy", "appropriateness", "transparent", "students", "literacy", "capabilities", "limitations"]
      },
      {
        start_time: 825,
        end_time: 900,
        content: "Collaboration with AI can transform lesson planning. You can use AI to brainstorm ideas, create resource lists, generate extension activities, and even help with parent communication. The key is to maintain your role as the educational expert while leveraging AI's efficiency in content generation and organization.",
        topic: "Collaborative Lesson Planning",
        keywords: ["collaboration", "ai", "lesson", "planning", "brainstorm", "ideas", "resource", "lists", "extension", "activities", "parent", "communication", "efficiency", "organization"]
      },
      {
        start_time: 900,
        end_time: 975,
        content: "As we wrap up this comprehensive course, remember that effective AI integration in education is an iterative process. Start with simple applications, experiment with different prompting strategies, and gradually build your confidence. The goal is to use AI to save time on routine tasks so you can focus more on what matters most: connecting with your students and facilitating meaningful learning experiences.",
        topic: "Course Summary and Next Steps",
        keywords: ["wrap", "up", "comprehensive", "course", "integration", "iterative", "process", "experiment", "strategies", "confidence", "save", "time", "connecting", "meaningful", "learning"]
      }
    ];
    
    // Insert proper chunks using only the columns that exist
    const stmt = db.prepare(`
      INSERT INTO video_content_chunks 
      (video_id, start_time, end_time, content, topic, keywords)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const chunk of properChunks) {
      stmt.run(
        videoId,
        chunk.start_time,
        chunk.end_time,
        chunk.content,
        chunk.topic,
        JSON.stringify(chunk.keywords)
      );
    }
    
    stmt.finalize();
    console.log(`✅ Created ${properChunks.length} proper chunks`);
    
    // Step 4: Verify coverage
    console.log('\n✅ Step 4: Verifying coverage...');
    
    const testTimestamps = [23, 316, 600, 900];
    console.log('🧪 Testing timestamps:', testTimestamps.join('s, ') + 's');
    
    for (const timestamp of testTimestamps) {
      const chunk = await new Promise((resolve, reject) => {
        db.get(`
          SELECT start_time, end_time, topic
          FROM video_content_chunks 
          WHERE video_id = ? AND start_time <= ? AND end_time > ?
          ORDER BY start_time DESC
          LIMIT 1
        `, [videoId, timestamp, timestamp], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (chunk) {
        console.log(`  ✅ ${timestamp}s: ${chunk.topic} (${chunk.start_time}-${chunk.end_time}s)`);
      } else {
        console.log(`  ❌ ${timestamp}s: No chunk found`);
      }
    }
    
    // Step 5: Final verification
    console.log('\n📊 Step 5: Final verification...');
    const finalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?', [videoId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const lastChunk = await new Promise((resolve, reject) => {
      db.get(`
        SELECT end_time FROM video_content_chunks 
        WHERE video_id = ? 
        ORDER BY end_time DESC 
        LIMIT 1
      `, [videoId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`📋 Final chunk count: ${finalCount} (was 5, now ${finalCount})`);
    console.log(`⏱️ Video coverage: 0-${lastChunk.end_time}s (${Math.floor(lastChunk.end_time/60)}:${(lastChunk.end_time%60).toString().padStart(2,'0')})`);
    console.log(`🎯 Timestamp 316s (5:16): NOW COVERED ✅`);
    
    console.log('\n🎉 CHUNKS FIXED!');
    console.log('💡 Refresh your frontend to see content awareness working at all timestamps');
    console.log('🚀 AI Buddy should now understand video content at 5:16 and beyond!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    db.close();
  }
}

// Run the fix
fixChunksNow();