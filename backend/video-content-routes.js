// video-content-routes-fixed.js - Comprehensive fix for video content issues
const express = require('express');
const router = express.Router();
const YouTubeTranscriptService = require('./youtube-transcript-service');

class VideoContentService {
  constructor(db) {
    this.db = db;
    this.transcriptService = new YouTubeTranscriptService();
    this.initializeTables();
  }

  // Initialize video content tables
  initializeTables() {
    // Video content chunks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS video_content_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        start_time INTEGER NOT NULL DEFAULT 0,
        end_time INTEGER NOT NULL DEFAULT 60,
        content TEXT NOT NULL DEFAULT '',
        topic TEXT DEFAULT 'Video Content',
        keywords TEXT DEFAULT '[]',
        embedding TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES content_items(id)
      )
    `);

    // User video progress table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_video_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        current_position REAL NOT NULL,
        duration REAL NOT NULL,
        progress_percentage REAL NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, video_id)
      )
    `);

    // Video content context cache
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS video_context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        context_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, timestamp)
      )
    `);
    
    // YouTube video metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS youtube_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youtube_id TEXT UNIQUE NOT NULL,
        title TEXT,
        duration INTEGER,
        transcript_status TEXT DEFAULT 'pending',
        transcript_loaded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Fetch and store YouTube transcript
  async fetchAndStoreTranscript(youtubeVideoId) {
    try {
      console.log(`📺 Fetching transcript for YouTube video: ${youtubeVideoId}`);
      
      // Check if we already have this transcript
      const existing = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?',
          [youtubeVideoId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row?.count > 0);
          }
        );
      });

      if (existing) {
        console.log('✅ Transcript already exists in database');
        return { success: true, message: 'Transcript already loaded' };
      }

      // Fetch transcript using our service
      const chunks = await this.transcriptService.fetchTranscript(youtubeVideoId);
      
      // Store chunks in database with validation
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO video_content_chunks 
        (video_id, start_time, end_time, content, topic, keywords, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const chunk of chunks) {
        // Validate and sanitize chunk data
        const validatedChunk = {
          video_id: youtubeVideoId,
          start_time: this.validateNumber(chunk.start_time, 0),
          end_time: this.validateNumber(chunk.end_time, 60),
          content: this.validateString(chunk.content, 'Content not available'),
          topic: this.validateString(chunk.topic, 'Video Content'),
          keywords: this.validateArray(chunk.keywords),
          embedding: null
        };

        stmt.run(
          validatedChunk.video_id,
          validatedChunk.start_time,
          validatedChunk.end_time,
          validatedChunk.content,
          validatedChunk.topic,
          validatedChunk.keywords,
          validatedChunk.embedding
        );
      }

      stmt.finalize();

      // Update video metadata
      this.db.run(`
        INSERT OR REPLACE INTO youtube_videos 
        (youtube_id, transcript_status, transcript_loaded_at)
        VALUES (?, 'loaded', CURRENT_TIMESTAMP)
      `, [youtubeVideoId]);

      console.log(`✅ Stored ${chunks.length} transcript chunks`);
      return {
        success: true,
        message: `Loaded ${chunks.length} transcript chunks`,
        chunks: chunks.length
      };

    } catch (error) {
      console.error('❌ Error fetching transcript:', error);
      
      // Update status to error
      this.db.run(`
        INSERT OR REPLACE INTO youtube_videos 
        (youtube_id, transcript_status)
        VALUES (?, 'error')
      `, [youtubeVideoId]);
      
      throw error;
    }
  }

  // Validation helpers
  validateNumber(value, defaultValue = 0) {
    const parsed = Number(value);
    return (!isNaN(parsed) && isFinite(parsed)) ? parsed : defaultValue;
  }

  validateString(value, defaultValue = '') {
    return (typeof value === 'string' && value.trim().length > 0) ? value.trim() : defaultValue;
  }

  validateArray(value) {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? value : '[]';
      } catch (e) {
        return '[]';
      }
    }
    return '[]';
  }

  // FIXED: Get content context for specific timestamp with comprehensive error handling
  async getVideoContext(videoId, timestamp, userId) {
    try {
      console.log(`🔍 Getting video context for ${videoId} at ${timestamp}s for user ${userId}`);
      
      // Validate inputs
      if (!videoId || timestamp === undefined || !userId) {
        throw new Error('Missing required parameters: videoId, timestamp, or userId');
      }

      const safeTimestamp = this.validateNumber(timestamp, 0);
      
      // Find relevant chunk for timestamp with better error handling
      let chunk = null;
      try {
        const chunkStmt = this.db.prepare(`
          SELECT * FROM video_content_chunks 
          WHERE video_id = ? AND start_time <= ? AND end_time > ?
          ORDER BY start_time DESC
          LIMIT 1
        `);
        chunk = chunkStmt.get(videoId, safeTimestamp, safeTimestamp);
        chunkStmt.finalize();
      } catch (queryError) {
        console.error('❌ Error querying chunk:', queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }

      if (!chunk) {
        console.log(`⚠️ No chunk found for ${videoId} at ${safeTimestamp}s`);
        return this.createEmptyContext(videoId, safeTimestamp, userId);
      }
      
      // FIXED: Create safe chunk with validated properties
      const safeChunk = {
        id: chunk.id || 0,
        start_time: this.validateNumber(chunk.start_time, 0),
        end_time: this.validateNumber(chunk.end_time, 60),
        content: this.validateString(chunk.content, 'Content not available'),
        topic: this.validateString(chunk.topic, 'Video Content'),
        keywords: this.validateArray(chunk.keywords)
      };

      console.log(`✅ Found chunk: ${safeChunk.topic} (${safeChunk.start_time}s-${safeChunk.end_time}s)`);
      
      // FIXED: Safe parsing of keywords with error handling
      let keywords = [];
      try {
        if (safeChunk.keywords && safeChunk.keywords !== 'null' && safeChunk.keywords !== 'undefined') {
          const parsed = JSON.parse(safeChunk.keywords);
          keywords = Array.isArray(parsed) ? parsed : [];
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse chunk keywords:', parseError.message);
        keywords = [];
      }

      // FIXED: Get surrounding chunks with comprehensive null safety
      let surroundingChunks = [];
      try {
        const surroundingStmt = this.db.prepare(`
          SELECT * FROM video_content_chunks
          WHERE video_id = ? 
          AND start_time >= ? 
          AND start_time <= ?
          ORDER BY start_time
          LIMIT 3
        `);
        
        const rawSurrounding = surroundingStmt.all(
          videoId, 
          Math.max(0, safeChunk.start_time - 60), 
          safeChunk.end_time + 60
        );
        surroundingStmt.finalize();
        
        // CRITICAL FIX: Ensure we always have an array
        if (rawSurrounding === null || rawSurrounding === undefined) {
          surroundingChunks = [];
          console.log('⚠️ Database query returned null, using empty array');
        } else if (Array.isArray(rawSurrounding)) {
          // Filter out any null/invalid chunks and validate data
          surroundingChunks = rawSurrounding
            .filter(c => c && c.start_time !== null && c.end_time !== null)
            .map(c => ({
              startTime: this.validateNumber(c.start_time, 0),
              endTime: this.validateNumber(c.end_time, 60),
              topic: this.validateString(c.topic, 'Video Content')
            }));
          console.log(`📊 Found ${surroundingChunks.length} valid surrounding chunks`);
        } else {
          surroundingChunks = [];
          console.log('⚠️ Database query returned non-array, using empty array');
        }
      } catch (surroundingError) {
        console.warn('⚠️ Error getting surrounding chunks:', surroundingError.message);
        surroundingChunks = [];
      }

      // Get user's learning context with error handling
      const userContext = await this.getUserLearningContext(userId);

      // Build comprehensive context with all safety checks
      const context = {
        timestamp: safeTimestamp,
        videoId: videoId,
        chunk: {
          startTime: safeChunk.start_time,
          endTime: safeChunk.end_time,
          content: safeChunk.content,
          topic: safeChunk.topic,
          keywords: keywords
        },
        surroundingContext: surroundingChunks,
        userContext: userContext,
        rag_content: safeChunk.content,
        suggestions: this.generateTimestampSuggestions(
          { ...safeChunk, keywords }, 
          userContext
        )
      };

      return context;
      
    } catch (error) {
      console.error('❌ Error getting video context:', error);
      
      // Return a comprehensive safe fallback response
      return this.createErrorContext(videoId, timestamp, userId, error);
    }
  }

  // Helper: Create empty context for missing chunks
  createEmptyContext(videoId, timestamp, userId) {
    return {
      message: 'No content available for this timestamp',
      timestamp: timestamp,
      videoId: videoId,
      chunk: {
        startTime: timestamp,
        endTime: timestamp + 60,
        content: 'No content available for this section of the video',
        topic: 'Video Content',
        keywords: []
      },
      surroundingContext: [],
      userContext: {
        recentConcepts: [],
        strugglingWith: [],
        interestedIn: []
      },
      rag_content: 'No content available for this section of the video',
      suggestions: [{
        type: 'info',
        message: 'No specific content available for this timestamp. Try seeking to a different time.',
        action: 'seek_different_time'
      }]
    };
  }

  // Helper: Create error context for system failures
  createErrorContext(videoId, timestamp, userId, error) {
    return {
      message: 'Error retrieving content context',
      timestamp: timestamp,
      videoId: videoId,
      chunk: {
        startTime: this.validateNumber(timestamp, 0),
        endTime: this.validateNumber(timestamp, 0) + 60,
        content: 'Content temporarily unavailable due to system error',
        topic: 'System Error',
        keywords: []
      },
      surroundingContext: [],
      userContext: {
        recentConcepts: [],
        strugglingWith: [],
        interestedIn: []
      },
      rag_content: 'Content temporarily unavailable due to system error',
      suggestions: [{
        type: 'error',
        message: 'System error occurred. Please try again in a moment.',
        action: 'retry'
      }],
      error: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }

  // FIXED: Get user's learning context from semantic memory with comprehensive error handling
  async getUserLearningContext(userId) {
    try {
      // Check if entities table exists first
      const tableExists = await new Promise((resolve, reject) => {
        this.db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='entities'",
          (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
          }
        );
      });
      
      if (!tableExists) {
        console.log('📊 Entities table does not exist, returning empty context');
        return this.createDefaultUserContext();
      }
      
      // Try to get user entities with error handling
      let entities = [];
      try {
        const stmt = this.db.prepare(`
          SELECT * FROM entities 
          WHERE user_id = ? 
          ORDER BY updated_at DESC 
          LIMIT 10
        `);
        entities = stmt.all(userId) || [];
        stmt.finalize();
      } catch (entityError) {
        console.warn('⚠️ Error querying entities:', entityError.message);
        entities = [];
      }
      
      // Process entities safely
      const safeEntities = entities.filter(e => e && e.name && e.entity_type);
      
      return {
        recentConcepts: safeEntities.map(e => e.name).slice(0, 5),
        strugglingWith: safeEntities
          .filter(e => e.entity_type === 'confusion' || e.entity_type === 'challenge')
          .map(e => e.name),
        interestedIn: safeEntities
          .filter(e => e.entity_type === 'interest' || e.entity_type === 'goal')
          .map(e => e.name)
      };
    } catch (error) {
      console.log('📊 Error getting user context:', error.message);
      return this.createDefaultUserContext();
    }
  }

  // Helper: Create default user context
  createDefaultUserContext() {
    return {
      recentConcepts: [],
      strugglingWith: [],
      interestedIn: []
    };
  }

  // Generate timestamp-based suggestions with error handling
  generateTimestampSuggestions(chunk, userContext) {
    const suggestions = [];
    
    try {
      // Validate inputs
      if (!chunk || !userContext) {
        return suggestions;
      }

      const keywords = chunk.keywords || [];
      const strugglingWith = userContext.strugglingWith || [];
      const interestedIn = userContext.interestedIn || [];
      
      // Suggest related concepts if user struggled with similar topics
      if (strugglingWith.length > 0 && keywords.length > 0) {
        const relatedStruggles = strugglingWith.filter(concept => 
          keywords.some(keyword => 
            typeof concept === 'string' && typeof keyword === 'string' &&
            concept.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        
        if (relatedStruggles.length > 0) {
          suggestions.push({
            type: 'review',
            message: `I noticed you had questions about ${relatedStruggles[0]} before. Would you like me to explain how this relates?`,
            action: 'explain_connection'
          });
        }
      }

      // Suggest deeper exploration for interested topics
      if (interestedIn.length > 0 && keywords.length > 0) {
        const relatedInterests = interestedIn.filter(concept => 
          keywords.some(keyword => 
            typeof concept === 'string' && typeof keyword === 'string' &&
            concept.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        
        if (relatedInterests.length > 0) {
          suggestions.push({
            type: 'explore',
            message: `Since you're interested in ${relatedInterests[0]}, want to dive deeper into this section?`,
            action: 'deep_dive'
          });
        }
      }

      // Add topic-specific suggestions
      const topic = chunk.topic || '';
      if (topic.toLowerCase().includes('example')) {
        suggestions.push({
          type: 'practice',
          message: 'Would you like to create your own example based on this?',
          action: 'create_example'
        });
      }

      if (topic.toLowerCase().includes('advanced') || topic.toLowerCase().includes('technique')) {
        suggestions.push({
          type: 'clarify',
          message: 'This seems like an advanced topic. Would you like me to break it down further?',
          action: 'simplify_explanation'
        });
      }

    } catch (suggestionError) {
      console.warn('⚠️ Error generating suggestions:', suggestionError.message);
    }

    return suggestions;
  }

  // Update user progress with error handling
  async updateProgress(userId, videoId, currentPosition, duration, completed = false) {
    try {
      const progressPercentage = (currentPosition / duration) * 100;
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_video_progress 
        (user_id, video_id, current_position, duration, progress_percentage, completed, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(userId, videoId, currentPosition, duration, progressPercentage, completed);
      stmt.finalize();
      
      return {
        success: true,
        progress: progressPercentage,
        completed: completed
      };
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }

  // FIXED: Database repair utility
  async repairVideoChunks(videoId) {
    try {
      console.log(`🔧 Repairing video chunks for ${videoId}...`);
      
      // Get all chunks for this video
      const chunks = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM video_content_chunks WHERE video_id = ? ORDER BY start_time',
          [videoId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      let repairedCount = 0;
      const repairStmt = this.db.prepare(`
        UPDATE video_content_chunks 
        SET start_time = ?, end_time = ?, content = ?, topic = ?, keywords = ?
        WHERE id = ?
      `);

      for (const chunk of chunks) {
        const needsRepair = 
          chunk.start_time === null || chunk.start_time === undefined ||
          chunk.end_time === null || chunk.end_time === undefined ||
          !chunk.content || chunk.content.trim() === '' ||
          !chunk.topic || chunk.topic.trim() === '' ||
          !chunk.keywords || chunk.keywords === 'undefined' || chunk.keywords === 'null';

        if (needsRepair) {
          const repairedChunk = {
            start_time: this.validateNumber(chunk.start_time, repairedCount * 60),
            end_time: this.validateNumber(chunk.end_time, (repairedCount + 1) * 60),
            content: this.validateString(chunk.content, `Content for section ${repairedCount + 1}`),
            topic: this.validateString(chunk.topic, `Video Section ${repairedCount + 1}`),
            keywords: this.validateArray(chunk.keywords)
          };

          repairStmt.run(
            repairedChunk.start_time,
            repairedChunk.end_time,
            repairedChunk.content,
            repairedChunk.topic,
            repairedChunk.keywords,
            chunk.id
          );
          repairedCount++;
        }
      }

      repairStmt.finalize();
      console.log(`✅ Repaired ${repairedCount} chunks for ${videoId}`);
      
      return {
        success: true,
        repairedCount,
        totalChunks: chunks.length
      };
    } catch (error) {
      console.error('❌ Error repairing video chunks:', error);
      throw error;
    }
  }
}

// API Routes with comprehensive error handling
module.exports = (db) => {
  const videoService = new VideoContentService(db);

  // FIXED: Get video context for timestamp with better error handling
  router.post('/video-context', async (req, res) => {
    try {
      const { videoId, timestamp, userId } = req.body;
      
      if (!videoId || timestamp === undefined || !userId) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          required: ['videoId', 'timestamp', 'userId'],
          received: { videoId: !!videoId, timestamp: timestamp !== undefined, userId: !!userId }
        });
      }

      const context = await videoService.getVideoContext(videoId, timestamp, userId);
      res.json(context);
    } catch (error) {
      console.error('❌ API Error getting video context:', error);
      res.status(500).json({ 
        error: 'Failed to get video context',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Fetch YouTube transcript
  router.post('/fetch-transcript', async (req, res) => {
    try {
      const { youtubeVideoId } = req.body;
      
      if (!youtubeVideoId) {
        return res.status(400).json({ error: 'Missing YouTube video ID' });
      }

      const result = await videoService.fetchAndStoreTranscript(youtubeVideoId);
      res.json(result);
    } catch (error) {
      console.error('❌ Error fetching transcript:', error);
      res.status(500).json({ 
        error: 'Failed to fetch transcript',
        message: error.message 
      });
    }
  });

  // NEW: Repair video chunks endpoint
  router.post('/repair-chunks/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const result = await videoService.repairVideoChunks(videoId);
      res.json(result);
    } catch (error) {
      console.error('❌ Error repairing chunks:', error);
      res.status(500).json({ 
        error: 'Failed to repair chunks',
        message: error.message 
      });
    }
  });

  // Get transcript status
  router.get('/transcript-status/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      
      // Check if chunks exist
      const chunkCount = await new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?',
          [videoId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row?.count || 0);
          }
        );
      });

      // Get video metadata
      const videoMeta = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM youtube_videos WHERE youtube_id = ?',
          [videoId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      res.json({
        videoId,
        hasTranscript: chunkCount > 0,
        chunkCount,
        status: videoMeta?.transcript_status || 'unknown',
        loadedAt: videoMeta?.transcript_loaded_at
      });
    } catch (error) {
      console.error('❌ Error checking transcript status:', error);
      res.status(500).json({ error: 'Failed to check transcript status' });
    }
  });

  // Update user progress
  router.post('/update-progress', async (req, res) => {
    try {
      const { userId, contentId, currentPosition, duration, completed } = req.body;
      
      if (!userId || !contentId || currentPosition === undefined || !duration) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const result = await videoService.updateProgress(userId, contentId, currentPosition, duration, completed);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // Get user's video progress
  router.get('/progress/:userId/:videoId', async (req, res) => {
    try {
      const { userId, videoId } = req.params;
      
      const stmt = db.prepare(`
        SELECT * FROM user_video_progress 
        WHERE user_id = ? AND video_id = ?
      `);
      const progress = stmt.get(userId, videoId);
      stmt.finalize();
      
      res.json(progress || { progress_percentage: 0, current_position: 0 });
    } catch (error) {
      console.error('❌ Error getting progress:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  });

  return router;
};
