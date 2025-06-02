// youtube-transcript-service-real.js - Enhanced service focused on getting REAL transcripts
const axios = require('axios');

class YouTubeTranscriptService {
  constructor() {
    // Multiple API endpoints to try
    this.apiEndpoints = [
      'https://youtube-transcript-api.herokuapp.com/api/transcript',
      'https://youtubetranscript.com/api/transcript',
      'https://yt-transcript-api.herokuapp.com/transcript'
    ];
    this.timeout = 20000; // 20 second timeout
    this.retryAttempts = 3;
  }

  /**
   * Fetch REAL transcript for a YouTube video using multiple methods
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array>} Array of transcript segments with timestamps
   */
  async fetchTranscript(videoId) {
    console.log(`📝 Fetching REAL transcript for video: ${videoId}`);
    console.log(`🔗 Video URL: https://www.youtube.com/watch?v=${videoId}`);
    
    // Method 1: Try multiple transcript APIs
    const realTranscript = await this.tryTranscriptAPIs(videoId);
    if (realTranscript) {
      return realTranscript;
    }
    
    // Method 2: Try browser automation approach
    const browserTranscript = await this.tryBrowserMethod(videoId);
    if (browserTranscript) {
      return browserTranscript;
    }
    
    // Method 3: Try yt-dlp command line
    const ytDlpTranscript = await this.tryYtDlp(videoId);
    if (ytDlpTranscript) {
      return ytDlpTranscript;
    }
    
    // Method 4: Try unofficial APIs
    const unofficialTranscript = await this.tryUnofficialAPIs(videoId);
    if (unofficialTranscript) {
      return unofficialTranscript;
    }
    
    console.log('⚠️ All methods failed - using enhanced fallback');
    return this.getFallbackTranscript(videoId);
  }

  /**
   * Try multiple transcript APIs
   */
  async tryTranscriptAPIs(videoId) {
    console.log('\n🌐 Method 1: Trying transcript APIs...');
    
    for (let endpoint of this.apiEndpoints) {
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          console.log(`  🔄 ${endpoint} (attempt ${attempt}/${this.retryAttempts})`);
          
          const apiUrl = `${endpoint}?video_id=${videoId}`;
          const response = await axios.get(apiUrl, {
            timeout: this.timeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://www.youtube.com/',
              'Origin': 'https://www.youtube.com'
            }
          });
          
          if (response.data && this.isRealTranscriptData(response.data)) {
            const transcriptData = response.data.transcript || response.data.data || response.data;
            console.log(`  ✅ SUCCESS! Got ${transcriptData.length} segments from ${endpoint}`);
            return this.processTranscriptData(transcriptData);
          } else {
            console.log(`  ⚠️ Invalid response structure from ${endpoint}`);
          }
          
        } catch (error) {
          console.log(`  ❌ ${endpoint} attempt ${attempt} failed: ${this.getErrorMessage(error)}`);
          if (attempt < this.retryAttempts) {
            await this.sleep(1000 * attempt);
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Try browser automation method (for future implementation)
   */
  async tryBrowserMethod(videoId) {
    console.log('\n🌐 Method 2: Browser automation method...');
    console.log('  💡 Not implemented yet - would require puppeteer/playwright');
    // Could implement puppeteer to scrape captions directly from YouTube
    return null;
  }

  /**
   * Try yt-dlp command line tool
   */
  async tryYtDlp(videoId) {
    console.log('\n🌐 Method 3: Trying yt-dlp...');
    
    try {
      const { exec } = require('child_process');
      
      // Check if yt-dlp is available
      const hasYtDlp = await new Promise((resolve) => {
        exec('yt-dlp --version', (error) => {
          resolve(!error);
        });
      });
      
      if (!hasYtDlp) {
        console.log('  ⚠️ yt-dlp not found. Install with: brew install yt-dlp');
        return null;
      }
      
      console.log('  🔧 yt-dlp found, extracting transcript...');
      
      // Get video info first
      const infoCommand = `yt-dlp --dump-json "https://www.youtube.com/watch?v=${videoId}"`;
      const videoInfo = await new Promise((resolve, reject) => {
        exec(infoCommand, { timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            try {
              const info = JSON.parse(stdout);
              resolve(info);
            } catch (parseError) {
              reject(parseError);
            }
          }
        });
      });
      
      console.log(`  📺 Video: "${videoInfo.title}" (${videoInfo.duration}s)`);
      
      // Extract subtitle files
      const subsCommand = `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "transcript_%(id)s.%(ext)s" "https://www.youtube.com/watch?v=${videoId}"`;
      
      await new Promise((resolve, reject) => {
        exec(subsCommand, { timeout: 60000 }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
      
      // Parse subtitle files (would need to implement VTT/SRT parsing)
      console.log('  📄 Subtitle files downloaded (parsing not implemented yet)');
      return null;
      
    } catch (error) {
      console.log(`  ❌ yt-dlp method failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try unofficial APIs and scrapers
   */
  async tryUnofficialAPIs(videoId) {
    console.log('\n🌐 Method 4: Trying unofficial APIs...');
    
    const unofficialEndpoints = [
      {
        url: `https://www.googleapis.com/youtube/v3/captions`,
        params: { part: 'snippet', videoId: videoId },
        headers: {} // Would need API key
      },
      {
        url: `https://youtube.googleapis.com/youtube/v3/captions`,
        params: { part: 'snippet', videoId: videoId },
        headers: {} // Would need API key
      }
    ];
    
    // These would require YouTube API keys
    console.log('  ⚠️ YouTube Data API requires API key (not implemented)');
    
    // Try some open source transcript extractors
    try {
      // Alternative approach: Parse video page directly
      console.log('  🔄 Trying direct page parsing...');
      
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await axios.get(videoPageUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      // Look for transcript data in the page
      const pageContent = response.data;
      
      // Search for caption data patterns
      const captionPatterns = [
        /"captions":({.*?})/,
        /"playerCaptionsTracklistRenderer":({.*?})/,
        /"captionTracks":(\[.*?\])/
      ];
      
      for (const pattern of captionPatterns) {
        const match = pageContent.match(pattern);
        if (match) {
          console.log('  🎯 Found caption data pattern');
          // Would need to parse and extract actual transcript
          // This is complex due to YouTube's obfuscated JSON structure
          break;
        }
      }
      
      console.log('  ⚠️ Page parsing method needs more implementation');
      
    } catch (error) {
      console.log(`  ❌ Unofficial API method failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Check if response contains real transcript data (not fallback)
   */
  isRealTranscriptData(data) {
    if (!data) return false;
    
    const transcriptArray = data.transcript || data.data || data;
    if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
      return false;
    }
    
    // Check if it's our fallback data
    const firstSegment = transcriptArray[0];
    const content = firstSegment.text || firstSegment.content || '';
    
    // Look for fallback indicators
    const fallbackIndicators = [
      'placeholder',
      'Google\'s comprehensive AI course',
      'Welcome to Google\'s AI course for educators',
      'fallback transcript'
    ];
    
    const isFallback = fallbackIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    return !isFallback;
  }

  /**
   * Process real transcript data with enhanced metadata
   */
  processTranscriptData(transcriptData) {
    console.log(`🔄 Processing ${transcriptData.length} real transcript segments...`);
    
    // Handle different transcript formats
    const normalizedSegments = transcriptData.map(segment => ({
      start: this.parseTime(segment.start || segment.offset || segment.startTime),
      duration: this.parseTime(segment.duration || segment.dur || 3),
      text: segment.text || segment.content || ''
    }));
    
    // Group into meaningful chunks (60-90 seconds each)
    const chunks = [];
    let currentChunk = {
      segments: [],
      startTime: 0,
      endTime: 0,
      text: ''
    };
    
    normalizedSegments.forEach((segment, index) => {
      const segmentEnd = segment.start + segment.duration;
      
      // Start new chunk if current one is too long or we have too many segments
      if (currentChunk.segments.length > 0 && 
          (segment.start - currentChunk.startTime > 75 || currentChunk.segments.length > 25)) {
        chunks.push(this.finalizeChunk(currentChunk, true)); // Mark as real data
        currentChunk = { segments: [], startTime: segment.start, endTime: segmentEnd, text: '' };
      }
      
      if (currentChunk.segments.length === 0) {
        currentChunk.startTime = segment.start;
      }
      
      currentChunk.segments.push(segment);
      currentChunk.endTime = segmentEnd;
      currentChunk.text += ' ' + segment.text;
    });
    
    // Add final chunk
    if (currentChunk.segments.length > 0) {
      chunks.push(this.finalizeChunk(currentChunk, true));
    }
    
    console.log(`✅ Created ${chunks.length} real content chunks`);
    return chunks;
  }

  /**
   * Finalize chunk with real data indicators
   */
  finalizeChunk(chunk, isRealData = false) {
    const text = chunk.text.trim();
    const topic = this.extractTopic(text);
    const keywords = this.extractKeywords(text);
    
    return {
      start_time: Math.floor(chunk.startTime),
      end_time: Math.ceil(chunk.endTime),
      content: text,
      topic: topic,
      keywords: keywords,
      confidence: isRealData ? 0.95 : 0.7, // Higher confidence for real data
      isRealData: isRealData,
      segments: chunk.segments
    };
  }

  // ... (keep all the existing helper methods from the previous version)
  parseTime(timeValue) {
    if (typeof timeValue === 'number') return timeValue;
    const parsed = parseFloat(timeValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  getErrorMessage(error) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout - API took too long to respond';
    } else if (error.code === 'ENOTFOUND') {
      return 'Network error - Cannot reach API server';
    } else if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else {
      return error.message || 'Unknown error';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractTopic(text) {
    // Enhanced topic extraction for real content
    const lowerText = text.toLowerCase();
    
    // Look for real educational patterns
    if (lowerText.includes('welcome') || lowerText.includes('introduction')) {
      return 'Introduction';
    } else if (lowerText.includes('prompt') && lowerText.includes('engineering')) {
      return 'Prompt Engineering';
    } else if (lowerText.includes('lesson') || lowerText.includes('curriculum')) {
      return 'Lesson Planning';
    } else if (lowerText.includes('student') && lowerText.includes('engagement')) {
      return 'Student Engagement';
    } else if (lowerText.includes('assessment') || lowerText.includes('evaluation')) {
      return 'Assessment';
    } else if (lowerText.includes('ethics') || lowerText.includes('responsible')) {
      return 'AI Ethics';
    } else if (lowerText.includes('example') || lowerText.includes('practice')) {
      return 'Practical Examples';
    } else if (lowerText.includes('mistake') || lowerText.includes('avoid')) {
      return 'Common Mistakes';
    } else if (lowerText.includes('advanced') || lowerText.includes('technique')) {
      return 'Advanced Techniques';
    }
    
    // Extract from sentence structure
    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        if (trimmed.toLowerCase().includes('we\'ll') || 
            trimmed.toLowerCase().includes('let\'s') ||
            trimmed.toLowerCase().includes('now')) {
          return trimmed;
        }
      }
    }
    
    return 'Content Segment';
  }

  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 
      'can', 'must', 'shall', 'a', 'an', 'this', 'that', 'these', 'those'
    ]);

    const importantTerms = new Set([
      'ai', 'artificial', 'intelligence', 'prompt', 'engineering', 'chatgpt', 
      'claude', 'lesson', 'plan', 'student', 'teacher', 'classroom', 'education',
      'assessment', 'learning', 'teaching', 'curriculum', 'strategy'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort((a, b) => {
        const aImportant = importantTerms.has(a[0]) ? 15 : 0;
        const bImportant = importantTerms.has(b[0]) ? 15 : 0;
        return (b[1] + bImportant) - (a[1] + aImportant);
      })
      .slice(0, 10)
      .map(([word]) => word);
  }

  getFallbackTranscript(videoId) {
    console.log(`📌 Using enhanced fallback for ${videoId} (marked as non-real data)`);
    
    // Same enhanced fallback as before, but marked as fallback
    const fallbackChunks = [
      {
        start_time: 0,
        end_time: 45,
        content: "Welcome to Google's comprehensive AI course for educators. Today we'll explore how teachers can effectively integrate AI tools like ChatGPT and Claude into their classrooms. We'll start with the fundamentals of prompt engineering and work our way up to advanced applications.",
        topic: "Introduction to AI for Educators",
        keywords: ["google", "ai", "educators", "teachers", "chatgpt", "claude", "classrooms", "prompt", "engineering"],
        confidence: 0.7,
        isRealData: false
      }
      // ... rest of fallback data
    ];
    
    return fallbackChunks;
  }

  formatForDatabase(videoId, chunks) {
    const realChunks = chunks.filter(c => c.isRealData);
    const fallbackChunks = chunks.filter(c => !c.isRealData);
    
    return {
      video_id: videoId,
      chunk_count: chunks.length,
      real_chunk_count: realChunks.length,
      fallback_chunk_count: fallbackChunks.length,
      total_duration: chunks[chunks.length - 1]?.end_time || 0,
      average_confidence: chunks.reduce((sum, chunk) => sum + (chunk.confidence || 0.5), 0) / chunks.length,
      data_source: realChunks.length > 0 ? 'real_transcript' : 'enhanced_fallback',
      chunks: chunks.map(chunk => ({
        video_id: videoId,
        start_time: chunk.start_time,
        end_time: chunk.end_time,
        content: chunk.content,
        topic: chunk.topic,
        keywords: JSON.stringify(chunk.keywords),
        confidence: chunk.confidence || 0.7,
        is_real_data: chunk.isRealData || false,
        embedding: null
      }))
    };
  }
}

module.exports = YouTubeTranscriptService;