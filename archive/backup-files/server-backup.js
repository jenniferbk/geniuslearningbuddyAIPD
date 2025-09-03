require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const MemoryService = require('./memory-service');
const { basicAILiteracyModule } = require('./learning-modules');

const app = express();
const PORT = process.env.PORT || 3001;

const { buildEnhancedSystemPrompt } = require('./enhanced-prompts');
// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and services
const dbPath = path.join(__dirname, 'learning_buddy.db');
const db = new sqlite3.Database(dbPath);
const memoryService = new MemoryService(dbPath);

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

// Build learning buddy system prompt
function buildSystemPrompt(userProfile, moduleContext, memoryContext) {
  const module = basicAILiteracyModule;
  
  return `You are an AI Learning Buddy helping K-12 teachers develop AI literacy. You are warm, encouraging, and adaptive to each teacher's needs.

TEACHER PROFILE:
- Name: ${userProfile.name}
- Grade Level: ${userProfile.grade_level}
- Subjects: ${userProfile.subjects}
- Tech Comfort: ${userProfile.tech_comfort}
- Learning Style: ${userProfile.learning_style}

CURRENT MODULE: ${module.name}
${module.description}

LEARNING OBJECTIVES:
${module.learningObjectives.map(obj => `- ${obj}`).join('\n')}

MEMORY CONTEXT:
${memoryContext}

YOUR ROLE:
- Guide through the learning module at an appropriate pace
- Adapt explanations to their grade level and tech comfort
- Reference previous conversations and progress
- Ask thoughtful questions to check understanding
- Provide relevant examples from their teaching context
- Encourage hands-on practice when appropriate
- Be supportive when they struggle, celebrate when they succeed

RESPONSE STYLE:
- Use a warm, conversational tone like a supportive colleague
- Ask one question at a time to avoid overwhelming
- Provide specific, actionable guidance
- Connect AI concepts to their actual teaching practice
- Encourage reflection and critical thinking

Remember: You're a persistent learning companion building understanding over time.`;
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

// === CHAT ROUTES ===

// Main chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, moduleContext = 'basic_ai_literacy' } = req.body;
    const userId = req.user.userId;
    
    // Get user profile
    const userProfile = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Build memory context
    const memoryContext = await memoryService.buildMemoryContext(userId, message);
    
    // Get recent conversation history
    const recentConversations = await memoryService.getRecentConversations(userId, 3);
    const conversationHistory = recentConversations
      .reverse()
      .flatMap(conv => {
        // Handle both cases: messages as string or already parsed object
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
      .slice(-6); // Last 6 messages
    
    // Build AI prompt
    const systemPrompt = buildSystemPrompt(userProfile, moduleContext, memoryContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    // Call OpenAI
    const aiResponse = await callOpenAI(messages);
    
    // Update memory
    const memoryUpdates = await memoryService.updateFromConversation(
      userId, 
      message, 
      aiResponse, 
      moduleContext
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
    
    // Update learning progress (simple heuristic)
    let progressUpdate = { completion: 0, topic: 'general' };
    try {
      progressUpdate = calculateProgressUpdate(message, aiResponse, moduleContext);
      if (progressUpdate.completion > 0) {
        db.run(
          `UPDATE learning_progress 
           SET completion_percentage = completion_percentage + ?, 
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

// Simple progress calculation
function calculateProgressUpdate(userMessage, aiResponse, moduleContext) {
  const module = basicAILiteracyModule;
  let completion = 0;
  let topic = 'general';
  
  // Check if user is engaging with specific topics
  for (const topicData of module.topics) {
    // Safely access keyPoints with fallback
    const keyPoints = topicData.keyPoints || [];
    if (keyPoints.length === 0) continue;
    
    const topicKeywords = keyPoints.join(' ').toLowerCase();
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
  
  // Bonus for thoughtful questions or understanding
  if (userMessage.includes('?') && userMessage.length > 20) {
    completion += 0.02;
  }
  
  if (userMessage.toLowerCase().includes('understand') || 
      userMessage.toLowerCase().includes('got it')) {
    completion += 0.03;
  }
  
  return { completion: Math.min(completion, 0.1), topic }; // Max 10% per interaction
}

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

// === HEALTH CHECK ===

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Debug endpoint for troubleshooting
app.get('/api/debug/conversations/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  if (userId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    'SELECT id, created_at, messages FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const debug = rows.map(row => ({
        id: row.id,
        created_at: row.created_at,
        messages_type: typeof row.messages,
        messages_length: row.messages ? row.messages.length : 0,
        messages_preview: row.messages ? row.messages.substring(0, 100) + '...' : 'null'
      }));
      
      res.json({ conversations: debug });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Literacy Buddy backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not configured. Please add it to your .env file.');
  }
});

module.exports = app;
