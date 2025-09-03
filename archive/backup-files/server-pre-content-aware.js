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

// === ENHANCED CHAT ROUTES ===

// UPDATED: Main chat endpoint with enhanced memory integration
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, moduleContext = 'basic_ai_literacy' } = req.body;
    const userId = req.user.userId;
    
    // UPDATED: Get user profile with parsed subjects for enhanced memory
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
    
    // UPDATED: Get conversation count for adaptive personality
    const conversationCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    });
    
    // UPDATED: Build enhanced memory context
    const memoryContext = await memoryService.buildMemoryContext(userId, message);
    
    // Get recent conversation history (keeping existing logic but with better error handling)
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
      .slice(-8); // UPDATED: Increased to 8 messages for better context
    
    // UPDATED: Build enhanced AI prompt with adaptive personality
    const systemPrompt = buildEnhancedSystemPrompt(
      userProfile, 
      moduleContext, 
      memoryContext, 
      conversationCount
    );
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    // Call OpenAI
    const aiResponse = await callOpenAI(messages);
    
    // UPDATED: Enhanced memory update with user profile context
    const memoryUpdates = await memoryService.updateFromConversation(
      userId, 
      message, 
      aiResponse, 
      moduleContext,
      userProfile // Pass user profile for enhanced context extraction
    );
    
    // Save conversation
    const conversationId = uuidv4();
    const conversationMessages = [
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ];
    
    db.run(
      'INSERT INTO conversations (id, user_id, session_id, messages, module_context) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, uuidv4(), JSON.stringify(conversationMessages), moduleContext]
    );
    
    // Update learning progress (enhanced with better error handling)
    let progressUpdate = { completion: 0, topic: 'general' };
    try {
      progressUpdate = calculateProgressUpdate(message, aiResponse, moduleContext);
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
      // Continue without progress update if there's an error
    }
    
    res.json({
      response: aiResponse,
      memoryUpdates,
      progressUpdate,
      conversationId
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
  
  // ENHANCED: Better progression detection
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
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
      sessionId
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
      response_time_ms: null, // Could add timing if needed
      message_length: userMessage.length,
      response_length: aiResponse.length,
      memory_update_count: (memoryUpdates || []).length
    };
    
    db.run(
      `INSERT INTO research_logs 
       (id, user_id, timestamp, user_message, ai_response, memory_updates, 
        progress_update, session_id, user_agent, message_length, response_length, memory_update_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, userId, timestamp, researchData.user_message, researchData.ai_response,
       researchData.memory_updates, researchData.progress_update, researchData.session_id,
       researchData.user_agent, researchData.message_length, researchData.response_length,
       researchData.memory_update_count],
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
  // Only allow access if user is Jennifer (could add admin flag to user table)
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
              AVG(memory_update_count) as avg_memory_updates
            FROM research_logs
            WHERE timestamp > datetime('now', '-30 days')`, (err, engagement) => {
      if (err) return res.status(500).json({ error: 'Analytics query failed' });
      
      analytics.engagement = engagement;
      
      // Memory system effectiveness
      db.all(`SELECT 
                user_id,
                COUNT(*) as interaction_count,
                SUM(memory_update_count) as total_memory_updates,
                AVG(memory_update_count) as avg_memory_per_interaction
              FROM research_logs 
              GROUP BY user_id
              ORDER BY interaction_count DESC`, (err, memoryStats) => {
        if (err) return res.status(500).json({ error: 'Memory analytics failed' });
        
        analytics.memory_effectiveness = memoryStats;
        
        // Learning progression patterns
        db.all(`SELECT 
                  DATE(timestamp) as date,
                  COUNT(*) as interactions_per_day,
                  AVG(message_length) as avg_message_complexity
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

// === NEW: ENHANCED DEBUG ENDPOINTS ===

// UPDATED: Enhanced memory debug endpoint
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
      recentEntities: entities.slice(0, 10), // First 10 for review
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
    memoryService: 'enhanced'
  });
});

// === CMS ROUTES ===

// Mount CMS routes
app.use('/api/cms', authenticateToken, cmsRouter);

// Enhanced debug endpoint for troubleshooting
app.get('/api/debug/conversations/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    'SELECT id, created_at, messages, module_context FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const debug = rows.map(row => ({
        id: row.id,
        created_at: row.created_at,
        module_context: row.module_context,
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
  console.log(`🔍 Debug endpoint: http://localhost:${PORT}/api/debug/memory/YOUR_USER_ID`);
  console.log(`📝 CMS endpoint: http://localhost:${PORT}/api/cms/courses`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not configured. Please add it to your .env file.');
  }
});

module.exports = app;