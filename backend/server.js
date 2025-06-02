require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// UPDATED: Import the semantic memory service for embeddings-based concept extraction
const SemanticMemoryService = require('./memory-service');
const { basicAILiteracyModule } = require('./learning-modules');
const { buildEnhancedSystemPrompt } = require('./enhanced-prompts');

// CMS Integration
const { router: cmsRouter, initializeCMS } = require('./cms-routes');

// NEW: Content-aware functionality
const videoContentRoutes = require('./video-content-routes');
const { 
  buildContentAwarePrompt, 
  processContentAwareResponse, 
  updateMemoryWithContentContext 
} = require('./content-aware-chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/api/cms/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database and services
const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);
// UPDATED: Use semantic memory service with sentence-transformers
const memoryService = new SemanticMemoryService(dbPath);

// Initialize CMS service
initializeCMS(db);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// OpenAI integration
async function callOpenAI(messages, model = 'gpt-4o-mini') {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error('AI service temporarily unavailable');
  }
}

// === AUTHENTICATION ROUTES ===

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, gradeLevel, subjects, techComfort } = req.body;
    
    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Create new user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      
      db.run(
        `INSERT INTO users (id, email, password_hash, name, grade_level, subjects, tech_comfort) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, passwordHash, name, gradeLevel || 'mixed', JSON.stringify(subjects || []), techComfort || 'medium'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          // Create initial learning progress
          db.run(
            `INSERT INTO learning_progress (id, user_id, module_id, completion_percentage, current_topic) 
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), userId, 'basic_ai_literacy', 0.0, 'what_is_ai'],
            (progressErr) => {
              if (progressErr) {
                console.error('Failed to create initial progress:', progressErr);
              }
            }
          );
          
          const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || 'your-secret-key');
          res.json({
            token,
            user: { id: userId, email, name, gradeLevel, subjects, techComfort }
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last active
      db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key');
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          gradeLevel: user.grade_level,
          subjects: JSON.parse(user.subjects || '[]'),
          techComfort: user.tech_comfort
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// === ENHANCED CONTENT-AWARE CHAT ROUTES ===

// UPDATED: Main chat endpoint with content awareness
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, moduleContext = 'basic_ai_literacy', contentContext } = req.body;
    const userId = req.user.userId;
    
    // Get user profile with parsed subjects for enhanced memory
    const userProfile = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else {
          // Parse subjects JSON safely for enhanced memory context
          const parsedProfile = {
            ...row,
            subjects: row.subjects ? JSON.parse(row.subjects) : []
          };
          resolve(parsedProfile);
        }
      });
    });
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get conversation count for adaptive personality
    const conversationCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
    
    // Build enhanced memory context
    const memoryContext = await memoryService.buildMemoryContext(userId, message);
    
    // Get recent conversation history
    const recentConversations = await memoryService.getRecentConversations(userId, 3);
    const conversationHistory = recentConversations
      .reverse()
      .flatMap(conv => {
        let messages;
        if (typeof conv.messages === 'string') {
          try {
            messages = JSON.parse(conv.messages);
          } catch (e) {
            console.warn('Failed to parse conversation messages:', e);
            messages = [];
          }
        } else {
          messages = conv.messages || [];
        }
        return Array.isArray(messages) ? messages : [];
      })
      .slice(-8);
    
    // NEW: Build content-aware prompt
    const basePrompt = buildEnhancedSystemPrompt(
      userProfile, 
      moduleContext, 
      memoryContext, 
      conversationCount
    );
    
    const enhancedContext = { systemPrompt: basePrompt };
    const contentAwarePrompt = buildContentAwarePrompt(message, enhancedContext, contentContext);
    
    const messages = [
      { role: 'system', content: contentAwarePrompt.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: contentAwarePrompt.userMessage }
    ];
    
    // Call OpenAI
    const aiResponse = await callOpenAI(messages);
    
    // NEW: Process content-aware response
    const processedResponse = processContentAwareResponse(
      { choices: [{ message: { content: aiResponse } }] }, 
      contentContext
    );
    
    // NEW: Enhanced memory update with content context
    const memoryUpdates = await updateMemoryWithContentContext(
      memoryService,
      userId, 
      message, 
      processedResponse.text, 
      contentContext,
      userProfile
    );
    
    // Save conversation with content context
    const conversationId = uuidv4();
    const conversationMessages = [
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: processedResponse.text, timestamp: new Date().toISOString() }
    ];
    
    // NEW: Include content context in conversation record
    db.run(
      `INSERT INTO conversations (id, user_id, session_id, messages, module_context, content_context) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        conversationId, 
        userId, 
        uuidv4(), 
        JSON.stringify(conversationMessages), 
        moduleContext,
        contentContext ? JSON.stringify(contentContext) : null
      ]
    );
    
    // Update learning progress
    let progressUpdate = { completion: 0, topic: 'general' };
    try {
      progressUpdate = calculateProgressUpdate(message, processedResponse.text, moduleContext);
      if (progressUpdate.completion > 0) {
        db.run(
          `UPDATE learning_progress 
           SET completion_percentage = MIN(completion_percentage + ?, 1.0), 
               last_interaction = CURRENT_TIMESTAMP,
               current_topic = ?
           WHERE user_id = ? AND module_id = ?`,
          [progressUpdate.completion, progressUpdate.topic, userId, moduleContext],
          (err) => {
            if (err) console.error('Error updating progress:', err);
          }
        );
      }
    } catch (progressError) {
      console.error('Error calculating progress update:', progressError);
    }
    
    // NEW: Return content-aware response
    res.json({
      response: processedResponse.text,
      memoryUpdates,
      progressUpdate,
      conversationId,
      contentAwareness: processedResponse.contentReference,
      suggestion: processedResponse.suggestion
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Enhanced progress calculation
function calculateProgressUpdate(userMessage, aiResponse, moduleContext) {
  const module = basicAILiteracyModule;
  let completion = 0;
  let topic = 'general';
  
  // Check if user is engaging with specific topics
  for (const topicData of module.topics) {
    const keyPoints = topicData.keyPoints || [];
    if (keyPoints.length === 0) continue;
    
    const messageContent = (userMessage + ' ' + aiResponse).toLowerCase();
    
    // Check if any key points are mentioned in the conversation
    const hasRelevantContent = keyPoints.some(point => {
      if (!point || typeof point !== 'string') return false;
      const pointWords = point.toLowerCase().split(' ').slice(0, 3).join(' ');
      return pointWords.length > 0 && messageContent.includes(pointWords);
    });
    
    if (hasRelevantContent) {
      topic = topicData.id;
      completion = 0.05; // 5% progress per meaningful interaction
      break;
    }
  }
  
  // Enhanced progression detection
  const lowerMessage = userMessage.toLowerCase();
  
  // Bonus for thoughtful questions or understanding
  if (userMessage.includes('?') && userMessage.length > 20) {
    completion += 0.02;
  }
  
  // Understanding indicators
  if (lowerMessage.includes('understand') || lowerMessage.includes('got it') || 
      lowerMessage.includes('makes sense') || lowerMessage.includes('i see')) {
    completion += 0.03;
  }
  
  // Application indicators
  if (lowerMessage.includes('try this') || lowerMessage.includes('use in my class') || 
      lowerMessage.includes('implement') || lowerMessage.includes('apply')) {
    completion += 0.04;
  }
  
  // Deep engagement indicators
  if (lowerMessage.length > 100 || 
      (lowerMessage.includes('example') && lowerMessage.includes('student')) ||
      lowerMessage.includes('what if')) {
    completion += 0.02;
  }
  
  return { completion: Math.min(completion, 0.12), topic }; // Max 12% per interaction
}

// === RESEARCH LOGGING ENDPOINTS ===

// Research interaction logging for Jennifer's doctoral work
app.post('/api/research/log-interaction', authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      userMessage,
      aiResponse,
      memoryUpdates,
      progressUpdate,
      timestamp,
      sessionId,
      contentContext
    } = req.body;
    
    // Validate that the logged user matches the authenticated user
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    
    // Create comprehensive research log entry
    const logId = uuidv4();
    const researchData = {
      user_message: userMessage,
      ai_response: aiResponse,
      memory_updates: JSON.stringify(memoryUpdates || []),
      progress_update: JSON.stringify(progressUpdate || {}),
      session_id: sessionId,
      user_agent: req.headers['user-agent'],
      response_time_ms: null,
      message_length: userMessage.length,
      response_length: aiResponse.length,
      memory_update_count: (memoryUpdates || []).length,
      content_context: contentContext ? JSON.stringify(contentContext) : null
    };
    
    db.run(
      `INSERT INTO research_logs 
       (id, user_id, timestamp, user_message, ai_response, memory_updates, 
        progress_update, session_id, user_agent, message_length, response_length, 
        memory_update_count, content_context) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, userId, timestamp, researchData.user_message, researchData.ai_response,
       researchData.memory_updates, researchData.progress_update, researchData.session_id,
       researchData.user_agent, researchData.message_length, researchData.response_length,
       researchData.memory_update_count, researchData.content_context],
      function(err) {
        if (err) {
          console.error('Research logging error:', err);
          return res.status(500).json({ error: 'Logging failed' });
        }
        res.json({ logged: true, id: logId });
      }
    );
    
  } catch (error) {
    console.error('Research logging error:', error);
    res.status(500).json({ error: 'Research logging failed' });
  }
});

// Research analytics endpoint for Jennifer's analysis
app.get('/api/research/analytics', authenticateToken, (req, res) => {
  // Only allow access if user is Jennifer
  db.get('SELECT email FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err || !user || !user.email.includes('jennifer')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Comprehensive research analytics
    const analytics = {};
    
    // User engagement metrics
    db.get(`SELECT 
              COUNT(DISTINCT user_id) as total_users,
              COUNT(*) as total_interactions,
              AVG(message_length) as avg_message_length,
              AVG(response_length) as avg_response_length,
              AVG(memory_update_count) as avg_memory_updates,
              SUM(CASE WHEN content_context IS NOT NULL THEN 1 ELSE 0 END) as content_aware_interactions
            FROM research_logs
            WHERE timestamp > datetime('now', '-30 days')`, (err, engagement) => {
      if (err) return res.status(500).json({ error: 'Analytics query failed' });
      
      analytics.engagement = engagement;
      
      // Memory system effectiveness
      db.all(`SELECT 
                user_id,
                COUNT(*) as interaction_count,
                SUM(memory_update_count) as total_memory_updates,
                AVG(memory_update_count) as avg_memory_per_interaction,
                SUM(CASE WHEN content_context IS NOT NULL THEN 1 ELSE 0 END) as content_interactions
              FROM research_logs 
              GROUP BY user_id
              ORDER BY interaction_count DESC`, (err, memoryStats) => {
        if (err) return res.status(500).json({ error: 'Memory analytics failed' });
        
        analytics.memory_effectiveness = memoryStats;
        
        // Learning progression patterns
        db.all(`SELECT 
                  DATE(timestamp) as date,
                  COUNT(*) as interactions_per_day,
                  AVG(message_length) as avg_message_complexity,
                  SUM(CASE WHEN content_context IS NOT NULL THEN 1 ELSE 0 END) as content_aware_per_day
                FROM research_logs 
                WHERE timestamp > datetime('now', '-14 days')
                GROUP BY DATE(timestamp)
                ORDER BY date`, (err, progression) => {
          if (err) return res.status(500).json({ error: 'Progression analytics failed' });
          
          analytics.learning_progression = progression;
          analytics.generated_at = new Date().toISOString();
          
          res.json(analytics);
        });
      });
    });
  });
});

// === PROGRESS & USER ROUTES ===

// Get user progress
app.get('/api/progress', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.get(
    'SELECT * FROM learning_progress WHERE user_id = ? AND module_id = ?',
    [userId, 'basic_ai_literacy'],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        // Create initial progress if doesn't exist
        const progressId = uuidv4();
        db.run(
          `INSERT INTO learning_progress (id, user_id, module_id, completion_percentage, current_topic) 
           VALUES (?, ?, ?, ?, ?)`,
          [progressId, userId, 'basic_ai_literacy', 0.0, 'what_is_ai'],
          function(insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: 'Failed to create progress' });
            }
            res.json({
              moduleId: 'basic_ai_literacy',
              completion: 0.0,
              currentTopic: 'what_is_ai',
              competencies: {},
              lastInteraction: new Date().toISOString()
            });
          }
        );
      } else {
        res.json({
          moduleId: row.module_id,
          completion: row.completion_percentage,
          currentTopic: row.current_topic,
          competencies: JSON.parse(row.competencies || '{}'),
          lastInteraction: row.last_interaction
        });
      }
    }
  );
});

// Get learning module info
app.get('/api/modules/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  
  if (moduleId === 'basic_ai_literacy') {
    res.json(basicAILiteracyModule);
  } else {
    res.status(404).json({ error: 'Module not found' });
  }
});

// Get conversation history
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await memoryService.getRecentConversations(userId, 10);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// === ENHANCED DEBUG ENDPOINTS ===

// NEW: Video content debug endpoint
app.get('/api/debug/video-content/:videoId', authenticateToken, async (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Check if table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='video_content_chunks'",
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
    
    if (!tableExists) {
      return res.json({ 
        error: 'video_content_chunks table does not exist',
        suggestion: 'Run the populate endpoint first'
      });
    }
    
    // Check chunks for this video
    const chunks = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM video_content_chunks WHERE video_id = ? ORDER BY start_time',
        [videoId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Test the exact query that getVideoContext uses
    const testTimestamp = 5;
    const testChunk = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM video_content_chunks 
         WHERE video_id = ? AND start_time <= ? AND end_time > ?
         ORDER BY start_time DESC
         LIMIT 1`,
        [videoId, testTimestamp, testTimestamp],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.json({
      videoId,
      tableExists,
      chunkCount: chunks.length,
      chunks: chunks.map(c => ({
        timeRange: `${c.start_time}-${c.end_time}s`,
        topic: c.topic,
        contentPreview: c.content.substring(0, 100) + '...'
      })),
      testQuery: {
        timestamp: testTimestamp,
        foundChunk: testChunk ? {
          timeRange: `${testChunk.start_time}-${testChunk.end_time}s`,
          topic: testChunk.topic
        } : null
      }
    });
    
  } catch (error) {
    console.error('Video content debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Populate video content endpoint
app.post('/api/debug/populate-video/:videoId', authenticateToken, async (req, res) => {
  const { videoId } = req.params;
  
  if (videoId !== 'p09yRj47kNM') {
    return res.status(400).json({ error: 'Only p09yRj47kNM is supported for now' });
  }
  
  try {
    // Sample video content chunks
    const sampleChunks = [
      {
        video_id: 'p09yRj47kNM',
        start_time: 0,
        end_time: 60,
        content: 'Welcome to Google\'s comprehensive AI Prompt Engineering course. In this introduction, we\'ll cover the fundamentals of creating effective prompts for AI systems like ChatGPT and Claude. Understanding prompt engineering is crucial for educators who want to integrate AI tools into their teaching practice.',
        topic: 'Introduction to AI Prompt Engineering',
        keywords: ['prompt engineering', 'AI fundamentals', 'ChatGPT', 'teaching', 'introduction']
      },
      {
        video_id: 'p09yRj47kNM',
        start_time: 60,
        end_time: 120,
        content: 'Effective prompts have several key characteristics: they are clear, specific, and provide context. For teachers, this means crafting prompts that help AI understand your educational goals, student level, and subject matter. Let\'s explore how to structure prompts for maximum effectiveness.',
        topic: 'Characteristics of Effective Prompts',
        keywords: ['prompt structure', 'clarity', 'specificity', 'context', 'educational goals']
      },
      {
        video_id: 'p09yRj47kNM',
        start_time: 120,
        end_time: 180,
        content: 'When writing prompts for educational content, consider your audience. Are you creating materials for elementary students or high schoolers? The AI needs this context to adjust vocabulary, complexity, and examples. Always specify the grade level and subject area in your prompts.',
        topic: 'Audience-Specific Prompt Writing',
        keywords: ['audience', 'grade level', 'vocabulary', 'complexity', 'subject area']
      },
      {
        video_id: 'p09yRj47kNM',
        start_time: 180,
        end_time: 240,
        content: 'Let\'s look at practical examples. Instead of asking "Create a lesson plan," try "Create a 45-minute lesson plan for 8th grade science students about photosynthesis, including a hands-on activity and assessment rubric." See how the specific details help the AI understand exactly what you need.',
        topic: 'Practical Prompt Examples',
        keywords: ['lesson plans', 'specific details', 'hands-on activities', 'assessment', 'examples']
      },
      {
        video_id: 'p09yRj47kNM',
        start_time: 240,
        end_time: 300,
        content: 'Common mistakes in prompt engineering include being too vague, not providing enough context, and forgetting to specify the format you want. For instance, if you want a rubric, ask for a rubric explicitly. If you want bullet points, mention that in your prompt.',
        topic: 'Common Prompt Engineering Mistakes',
        keywords: ['common mistakes', 'vague prompts', 'context', 'format specification', 'rubrics']
      },
      {
        video_id: 'p09yRj47kNM',
        start_time: 300,
        end_time: 360,
        content: 'Advanced prompt techniques include role-playing, where you ask the AI to take on a specific role like "Act as an experienced 5th grade teacher" or using step-by-step instructions. These techniques can dramatically improve the quality and relevance of AI responses.',
        topic: 'Advanced Prompt Techniques',
        keywords: ['role-playing', 'step-by-step', 'experienced teacher', 'advanced techniques', 'quality improvement']
      }
    ];
    
    // Create table if it doesn't exist
    await new Promise((resolve, reject) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS video_content_chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          content TEXT NOT NULL,
          topic TEXT,
          keywords TEXT,
          embedding TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Clear existing chunks for this video
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM video_content_chunks WHERE video_id = ?', [videoId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Insert sample chunks
    const stmt = db.prepare(`
      INSERT INTO video_content_chunks 
      (video_id, start_time, end_time, content, topic, keywords)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const chunk of sampleChunks) {
      await new Promise((resolve, reject) => {
        stmt.run(
          chunk.video_id,
          chunk.start_time,
          chunk.end_time,
          chunk.content,
          chunk.topic,
          JSON.stringify(chunk.keywords),
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    stmt.finalize();
    
    // Verify the data was inserted
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?', [videoId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    res.json({
      success: true,
      message: `Populated ${count} video content chunks for ${videoId}`,
      chunksCreated: count
    });
    
  } catch (error) {
    console.error('Error populating video data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced memory debug endpoint
app.get('/api/debug/memory/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const entities = await memoryService.getEntities(userId);
    const relations = await memoryService.getRelations(userId);
    const memoryContext = await memoryService.buildMemoryContext(userId);
    
    res.json({
      entityCount: entities.length,
      relationCount: relations.length,
      entityTypes: [...new Set(entities.map(e => e.entity_type))],
      relationTypes: [...new Set(relations.map(r => r.relation_type))],
      sampleContext: memoryContext.substring(0, 1000) + '...',
      recentEntities: entities.slice(0, 10),
      recentRelations: relations.slice(0, 10),
      memoryQuality: {
        avgObservationsPerEntity: entities.length > 0 ? 
          entities.reduce((sum, e) => sum + e.observations.length, 0) / entities.length : 0,
        entityTypeDistribution: entities.reduce((acc, e) => {
          acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
          return acc;
        }, {}),
        relationStrengthAvg: relations.length > 0 ?
          relations.reduce((sum, r) => sum + (r.strength || 0.5), 0) / relations.length : 0
      }
    });
  } catch (error) {
    console.error('Memory debug error:', error);
    res.status(500).json({ error: 'Failed to fetch memory debug info' });
  }
});

// === HEALTH CHECK ===

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    memoryService: 'enhanced',
    contentAware: true
  });
});

// === ROUTE MOUNTING ===

// Mount CMS routes
app.use('/api/cms', authenticateToken, cmsRouter);

// NEW: Mount video content routes
app.use('/api/content', authenticateToken, videoContentRoutes(db));

// TEMPORARY: Debug video content retrieval step-by-step
app.get('/api/debug/video-retrieval/:videoId/:timestamp/:userId', authenticateToken, (req, res) => {
  const { videoId, timestamp, userId } = req.params;
  
  console.log('🔍 DEBUG: Starting video retrieval debug...');
  console.log('📋 Parameters:', { videoId, timestamp, userId });
  
  // Step 1: Check if table exists
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='video_content_chunks'",
    (err, tableRow) => {
      if (err) {
        return res.json({ step: 'table_check', error: err.message });
      }
      
      console.log('✅ Table exists:', !!tableRow);
      
      if (!tableRow) {
        return res.json({ step: 'table_check', exists: false });
      }
      
      // Step 2: Run the exact query
      const query = `
        SELECT * FROM video_content_chunks 
        WHERE video_id = ? AND start_time <= ? AND end_time > ?
        ORDER BY start_time DESC
        LIMIT 1
      `;
      
      console.log('🔍 Query:', query);
      console.log('🔍 Params:', [videoId, timestamp, timestamp]);
      
      db.get(query, [videoId, timestamp, timestamp], (err, chunk) => {
        if (err) {
          return res.json({ step: 'query', error: err.message });
        }
        
        console.log('📊 Raw chunk result:', chunk);
        
        if (!chunk) {
          return res.json({ 
            step: 'query', 
            found: false, 
            query,
            params: [videoId, timestamp, timestamp]
          });
        }
        
        // Step 3: Check chunk properties
        const chunkAnalysis = {
          id: chunk.id,
          video_id: chunk.video_id,
          start_time: chunk.start_time,
          end_time: chunk.end_time,
          content_type: typeof chunk.content,
          content_length: chunk.content ? chunk.content.length : 0,
          content_preview: chunk.content ? chunk.content.substring(0, 100) : 'null',
          topic_type: typeof chunk.topic,
          topic_value: chunk.topic,
          keywords_type: typeof chunk.keywords,
          keywords_value: chunk.keywords
        };
        
        console.log('🔍 Chunk analysis:', chunkAnalysis);
        
        // Step 4: Test validation functions
        const validateString = (value, defaultValue = '') => {
          return (typeof value === 'string' && value.trim().length > 0) ? value.trim() : defaultValue;
        };
        
        const validateNumber = (value, defaultValue = 0) => {
          const parsed = Number(value);
          return (!isNaN(parsed) && isFinite(parsed)) ? parsed : defaultValue;
        };
        
        const validatedChunk = {
          start_time: validateNumber(chunk.start_time, 0),
          end_time: validateNumber(chunk.end_time, 60),
          content: validateString(chunk.content, 'Content not available'),
          topic: validateString(chunk.topic, 'Video Content'),
        };
        
        console.log('✅ Validated chunk:', validatedChunk);
        
        res.json({
          step: 'complete',
          success: true,
          rawChunk: chunk,
          chunkAnalysis,
          validatedChunk,
          queryMatched: true
        });
      });
    }
  );
});
app.get('/api/debug/conversations/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    'SELECT id, created_at, messages, module_context, content_context FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const debug = rows.map(row => ({
        id: row.id,
        created_at: row.created_at,
        module_context: row.module_context,
        content_context: row.content_context,
        messages_type: typeof row.messages,
        messages_length: row.messages ? row.messages.length : 0,
        messages_preview: row.messages ? row.messages.substring(0, 200) + '...' : 'null',
        parsed_message_count: (() => {
          try {
            const parsed = JSON.parse(row.messages || '[]');
            return Array.isArray(parsed) ? parsed.length : 0;
          } catch {
            return 0;
          }
        })()
      }));
      
      res.json({ conversations: debug });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Literacy Buddy backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧠 Enhanced Memory Service: Active`);
  console.log(`📚 Content Management System: Active`);
  console.log(`🎬 Content-Aware Video System: Active`);
  console.log(`🔍 Debug endpoint: http://localhost:${PORT}/api/debug/memory/YOUR_USER_ID`);
  console.log(`📝 CMS endpoint: http://localhost:${PORT}/api/cms/courses`);
  console.log(`🎥 Video content endpoint: http://localhost:${PORT}/api/content/video-context`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not configured. Please add it to your .env file.');
  }
});

module.exports = app;