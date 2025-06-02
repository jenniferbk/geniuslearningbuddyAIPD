// video-content-routes.js - Updated with YouTube transcript fetching
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
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        content TEXT NOT NULL,
        topic TEXT,
        keywords TEXT,
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
            else resolve(row.count > 0);
          }
        );
      });

      if (existing) {
        console.log('✅ Transcript already exists in database');
        return { success: true, message: 'Transcript already loaded' };
      }

      // Fetch transcript using our service
      const chunks = await this.transcriptService.fetchTranscript(youtubeVideoId);
      
      // Store chunks in database
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO video_content_chunks 
        (video_id, start_time, end_time, content, topic, keywords, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const chunk of chunks) {
        stmt.run(
          youtubeVideoId,
          chunk.start_time,
          chunk.end_time,
          chunk.content,
          chunk.topic,
          JSON.stringify(chunk.keywords),
          null // Embedding placeholder
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

  // Get content context for specific timestamp (crash-safe version)
  async getVideoContext(videoId, timestamp, userId) {
    try {
      console.log(`🔍 Getting video context for ${videoId} at ${timestamp}s for user ${userId}`);
      
      // Find relevant chunk for timestamp
      const chunkStmt = this.db.prepare(`
        SELECT * FROM video_content_chunks 
        WHERE video_id = ? AND start_time <= ? AND end_time > ?
        ORDER BY start_time DESC
        LIMIT 1
      `);
      const chunk = chunkStmt.get(videoId, timestamp, timestamp);

      if (!chunk) {
        console.log(`⚠️ No chunk found for ${videoId} at ${timestamp}s`);
        return { 
          message: 'No content available for this timestamp',
          timestamp: timestamp,
          videoId: videoId
        };
      }
      
      console.log(`✅ Found chunk:`, {
        topic: chunk.topic || 'Unknown Topic',
        start_time: chunk.start_time || 0,
        end_time: chunk.end_time || 60,
        content_length: chunk.content?.length || 0
      });
      
      // Ensure chunk has valid properties with defaults
      const safeChunk = {
        start_time: chunk.start_time || 0,
        end_time: chunk.end_time || 60,
        content: chunk.content || 'Content not available',
        topic: chunk.topic || 'Video Content',
        keywords: chunk.keywords || '[]'
      };

      // Safe JSON parsing for keywords
      let keywords = [];
      try {
        if (safeChunk.keywords && safeChunk.keywords !== 'undefined' && safeChunk.keywords !== 'null') {
          keywords = JSON.parse(safeChunk.keywords);
        }
      } catch (parseError) {
        console.warn('Failed to parse chunk keywords:', parseError);
        keywords = [];
      }

      // Get surrounding chunks for better context (with null safety)
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
        
        // Ensure we have an array
        surroundingChunks = Array.isArray(rawSurrounding) ? rawSurrounding : [];
        console.log(`📊 Found ${surroundingChunks.length} surrounding chunks`);
      } catch (surroundingError) {
        console.warn('⚠️ Error getting surrounding chunks:', surroundingError.message);
        surroundingChunks = [];
      }

      // Get user's learning context
      const userContext = await this.getUserLearningContext(userId);

      // Build comprehensive context with null safety
      const context = {
        timestamp: timestamp,
        videoId: videoId,
        chunk: {
          startTime: safeChunk.start_time,
          endTime: safeChunk.end_time,
          content: safeChunk.content,
          topic: safeChunk.topic,
          keywords: keywords
        },
        surroundingContext: surroundingChunks
          .filter(c => c && c.start_time !== null && c.end_time !== null) // Filter out null chunks
          .map(c => ({
            startTime: c.start_time,
            endTime: c.end_time,
            topic: c.topic
          })),
        userContext: userContext,
        rag_content: safeChunk.content,
        suggestions: this.generateTimestampSuggestions({ ...safeChunk, keywords }, userContext)
      };

      return context;
    } catch (error) {
      console.error('❌ Error getting video context:', error);
      
      // Return a safe fallback response instead of crashing
      return {
        message: 'Error retrieving content context',
        timestamp: timestamp,
        videoId: videoId,
        chunk: {
          startTime: timestamp,
          endTime: timestamp + 60,
          content: 'Content temporarily unavailable',
          topic: 'Video Content',
          keywords: []
        },
        surroundingContext: [],
        userContext: {
          recentConcepts: [],
          strugglingWith: [],
          interestedIn: []
        },
        rag_content: 'Content temporarily unavailable',
        suggestions: [],
        error: error.message
      };
    }
  }

  // Get user's learning context from semantic memory (safe version)
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
        return {
          recentConcepts: [],
          strugglingWith: [],
          interestedIn: []
        };
      }
      
      const stmt = this.db.prepare(`
        SELECT * FROM entities 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 10
      `);
      const entities = stmt.all(userId);
      
      return {
        recentConcepts: entities.map(e => e.name).slice(0, 5),
        strugglingWith: entities.filter(e => e.entity_type === 'confusion').map(e => e.name),
        interestedIn: entities.filter(e => e.entity_type === 'interest').map(e => e.name)
      };
    } catch (error) {
      console.log('📊 No user context available:', error.message);
      return {
        recentConcepts: [],
        strugglingWith: [],
        interestedIn: []
      };
    }
  }

  // Generate timestamp-based suggestions
  generateTimestampSuggestions(chunk, userContext) {
    const suggestions = [];
    
    // Suggest related concepts if user struggled with similar topics
    if (userContext.strugglingWith && chunk.keywords) {
      const relatedStruggles = userContext.strugglingWith.filter(concept => 
        chunk.keywords.some(keyword => concept.toLowerCase().includes(keyword.toLowerCase()))
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
    if (userContext.interestedIn && chunk.keywords) {
      const relatedInterests = userContext.interestedIn.filter(concept => 
        chunk.keywords.some(keyword => concept.toLowerCase().includes(keyword.toLowerCase()))
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
    if (chunk.topic && chunk.topic.toLowerCase().includes('example')) {
      suggestions.push({
        type: 'practice',
        message: 'Would you like to create your own example based on this?',
        action: 'create_example'
      });
    }

    return suggestions;
  }

  // Update user progress
  async updateProgress(userId, videoId, currentPosition, duration, completed = false) {
    try {
      const progressPercentage = (currentPosition / duration) * 100;
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_video_progress 
        (user_id, video_id, current_position, duration, progress_percentage, completed, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(userId, videoId, currentPosition, duration, progressPercentage, completed);
      
      return {
        success: true,
        progress: progressPercentage,
        completed: completed
      };
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }
}

// API Routes
module.exports = (db) => {
  const videoService = new VideoContentService(db);

  // Get video context for timestamp
  router.post('/video-context', async (req, res) => {
    try {
      const { videoId, timestamp, userId } = req.body;
      
      if (!videoId || timestamp === undefined || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const context = await videoService.getVideoContext(videoId, timestamp, userId);
      res.json(context);
    } catch (error) {
      console.error('Error getting video context:', error);
      res.status(500).json({ error: 'Failed to get video context' });
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
      console.error('Error fetching transcript:', error);
      res.status(500).json({ 
        error: 'Failed to fetch transcript',
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
            else resolve(row.count);
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
      console.error('Error checking transcript status:', error);
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
      console.error('Error updating progress:', error);
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
      
      res.json(progress || { progress_percentage: 0, current_position: 0 });
    } catch (error) {
      console.error('Error getting progress:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  });

  return router;
};
