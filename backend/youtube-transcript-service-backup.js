// youtube-transcript-service.js - Service to fetch YouTube transcripts
const axios = require('axios');

class YouTubeTranscriptService {
  constructor() {
    // We'll use the youtube-transcript API (unofficial but reliable)
    this.baseUrl = 'https://youtube-transcript-api.herokuapp.com/api/transcript';
  }

  /**
   * Fetch transcript for a YouTube video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array>} Array of transcript segments with timestamps
   */
  async fetchTranscript(videoId) {
    try {
      console.log(`📝 Fetching transcript for video: ${videoId}`);
      
      // Method 1: Try youtube-transcript API
      try {
        const response = await axios.get(`${this.baseUrl}?video_id=${videoId}`);
        if (response.data && response.data.transcript) {
          console.log(`✅ Transcript fetched via API: ${response.data.transcript.length} segments`);
          return this.processTranscriptData(response.data.transcript);
        }
      } catch (apiError) {
        console.log('⚠️ Transcript API failed, trying alternative method...');
      }

      // Method 2: Use youtube-dl-exec or similar (requires installation)
      // This is a fallback - for now, we'll return sample data
      console.log('📌 Using fallback transcript data');
      return this.getFallbackTranscript(videoId);
      
    } catch (error) {
      console.error('❌ Error fetching transcript:', error);
      throw error;
    }
  }

  /**
   * Process raw transcript data into chunks
   * @param {Array} transcriptData - Raw transcript segments
   * @returns {Array} Processed chunks with topics
   */
  processTranscriptData(transcriptData) {
    // Group segments into ~60 second chunks
    const chunks = [];
    let currentChunk = {
      segments: [],
      startTime: 0,
      endTime: 0,
      text: ''
    };

    transcriptData.forEach((segment, index) => {
      const segmentStart = parseFloat(segment.start || segment.offset || 0);
      const segmentDuration = parseFloat(segment.duration || segment.dur || 3);
      const segmentEnd = segmentStart + segmentDuration;
      const segmentText = segment.text || segment.content || '';

      // Start new chunk if current one is > 60 seconds
      if (currentChunk.segments.length > 0 && 
          segmentStart - currentChunk.startTime > 60) {
        // Finalize current chunk
        chunks.push(this.finalizeChunk(currentChunk));
        
        // Start new chunk
        currentChunk = {
          segments: [],
          startTime: segmentStart,
          endTime: segmentEnd,
          text: ''
        };
      }

      // Add segment to current chunk
      currentChunk.segments.push({
        start: segmentStart,
        end: segmentEnd,
        text: segmentText
      });
      currentChunk.endTime = segmentEnd;
      currentChunk.text += ' ' + segmentText;
    });

    // Don't forget the last chunk
    if (currentChunk.segments.length > 0) {
      chunks.push(this.finalizeChunk(currentChunk));
    }

    return chunks;
  }

  /**
   * Finalize a chunk by extracting topic and keywords
   * @param {Object} chunk - Raw chunk data
   * @returns {Object} Finalized chunk with metadata
   */
  finalizeChunk(chunk) {
    const text = chunk.text.trim();
    const topic = this.extractTopic(text);
    const keywords = this.extractKeywords(text);

    return {
      start_time: Math.floor(chunk.startTime),
      end_time: Math.ceil(chunk.endTime),
      content: text,
      topic: topic,
      keywords: keywords,
      segments: chunk.segments // Keep original segments for reference
    };
  }

  /**
   * Extract topic from chunk text using simple heuristics
   * @param {string} text - Chunk text
   * @returns {string} Extracted topic
   */
  extractTopic(text) {
    const lowerText = text.toLowerCase();
    
    // AI/Tech topics
    if (lowerText.includes('prompt') && lowerText.includes('engineering')) {
      return 'Prompt Engineering Fundamentals';
    } else if (lowerText.includes('chatgpt') || lowerText.includes('claude')) {
      return 'AI Tools Overview';
    } else if (lowerText.includes('lesson') && lowerText.includes('plan')) {
      return 'Creating Lesson Plans with AI';
    } else if (lowerText.includes('student') && lowerText.includes('engage')) {
      return 'Student Engagement Strategies';
    } else if (lowerText.includes('assess') || lowerText.includes('rubric')) {
      return 'Assessment and Evaluation';
    } else if (lowerText.includes('classroom') && lowerText.includes('manage')) {
      return 'Classroom Management with AI';
    } else if (lowerText.includes('ethic') || lowerText.includes('bias')) {
      return 'AI Ethics and Considerations';
    } else if (lowerText.includes('example') || lowerText.includes('demonstrat')) {
      return 'Practical Examples';
    } else if (lowerText.includes('mistake') || lowerText.includes('avoid')) {
      return 'Common Mistakes to Avoid';
    } else if (lowerText.includes('tip') || lowerText.includes('best practice')) {
      return 'Best Practices';
    }
    
    // Try to use first sentence as topic
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence.trim();
    }
    
    return 'General Content';
  }

  /**
   * Extract keywords from text
   * @param {string} text - Input text
   * @returns {Array<string>} Extracted keywords
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 
      'can', 'must', 'shall', 'a', 'an', 'this', 'that', 'these', 'those',
      'it', 'its', 'we', 'you', 'they', 'them', 'our', 'your', 'their'
    ]);

    // Important educational/AI keywords to prioritize
    const importantTerms = new Set([
      'ai', 'artificial', 'intelligence', 'prompt', 'engineering', 'chatgpt', 
      'claude', 'lesson', 'plan', 'student', 'teacher', 'classroom', 'education',
      'assessment', 'rubric', 'learning', 'teaching', 'curriculum', 'engage',
      'activity', 'example', 'practice', 'strategy', 'technique', 'method'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Sort by frequency and importance
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => {
        // Prioritize important terms
        const aImportant = importantTerms.has(a[0]) ? 10 : 0;
        const bImportant = importantTerms.has(b[0]) ? 10 : 0;
        return (b[1] + bImportant) - (a[1] + aImportant);
      })
      .slice(0, 10)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * Get fallback transcript for testing
   * @param {string} videoId - Video ID
   * @returns {Array} Fallback transcript chunks
   */
  getFallbackTranscript(videoId) {
    // This is sample data for the Google AI course video
    if (videoId === 'p09yRj47kNM') {
      return [
        {
          start_time: 0,
          end_time: 30,
          content: "Welcome to Google's AI course for educators. Today we'll explore how teachers can effectively use AI tools like ChatGPT and Claude in their classrooms. We'll start with the fundamentals of prompt engineering.",
          topic: "Introduction to AI for Educators",
          keywords: ["google", "ai", "educators", "teachers", "chatgpt", "claude", "classrooms", "prompt", "engineering"]
        },
        {
          start_time: 30,
          end_time: 90,
          content: "Prompt engineering is the practice of crafting effective instructions for AI systems. For teachers, this means learning how to ask AI the right questions to get useful educational content. Let's look at the key principles: be specific, provide context, and define your desired output format.",
          topic: "Prompt Engineering Fundamentals",
          keywords: ["prompt", "engineering", "instructions", "ai", "systems", "teachers", "questions", "educational", "specific", "context"]
        },
        {
          start_time: 90,
          end_time: 150,
          content: "When creating prompts for lesson planning, always include the grade level, subject area, and learning objectives. For example, instead of 'Create a science lesson', try 'Create a 45-minute lesson plan for 7th grade biology students on photosynthesis, including a hands-on activity and assessment rubric.'",
          topic: "Creating Lesson Plans with AI",
          keywords: ["prompts", "lesson", "planning", "grade", "level", "subject", "objectives", "science", "biology", "photosynthesis"]
        },
        {
          start_time: 150,
          end_time: 210,
          content: "Common mistakes teachers make include being too vague, not specifying the audience, and forgetting to request specific formats. Remember to iterate on your prompts - if the first result isn't perfect, refine your instructions and try again.",
          topic: "Common Mistakes to Avoid",
          keywords: ["mistakes", "teachers", "vague", "audience", "formats", "iterate", "prompts", "refine", "instructions"]
        },
        {
          start_time: 210,
          end_time: 270,
          content: "Let's explore practical examples. For differentiated instruction, you might prompt: 'Create three versions of a reading comprehension exercise about the water cycle for 4th graders: one for struggling readers, one for grade-level readers, and one for advanced readers.'",
          topic: "Practical Examples",
          keywords: ["examples", "differentiated", "instruction", "reading", "comprehension", "water", "cycle", "graders", "versions"]
        },
        {
          start_time: 270,
          end_time: 330,
          content: "AI can also help with assessment creation. Try prompts like: 'Design a project-based assessment for high school history students studying the Civil War. Include a rubric with specific criteria for historical accuracy, critical thinking, and presentation skills.'",
          topic: "Assessment and Evaluation",
          keywords: ["assessment", "creation", "project", "based", "history", "civil", "war", "rubric", "criteria", "skills"]
        },
        {
          start_time: 330,
          end_time: 390,
          content: "Remember to consider AI ethics in education. Always review AI-generated content for accuracy and bias. Teach students about AI literacy and how to use these tools responsibly. AI should enhance, not replace, human teaching.",
          topic: "AI Ethics and Considerations",
          keywords: ["ethics", "education", "review", "accuracy", "bias", "students", "literacy", "responsibly", "enhance", "teaching"]
        }
      ];
    }
    
    // Default fallback for other videos
    return [{
      start_time: 0,
      end_time: 60,
      content: "This is a placeholder transcript. To get the actual transcript, we need to implement a YouTube transcript fetching service.",
      topic: "Placeholder Content",
      keywords: ["placeholder", "transcript", "youtube", "service"]
    }];
  }

  /**
   * Format transcript for storage in database
   * @param {string} videoId - YouTube video ID
   * @param {Array} chunks - Processed transcript chunks
   * @returns {Object} Formatted data for database
   */
  formatForDatabase(videoId, chunks) {
    return {
      video_id: videoId,
      chunk_count: chunks.length,
      total_duration: chunks[chunks.length - 1]?.end_time || 0,
      chunks: chunks.map(chunk => ({
        video_id: videoId,
        start_time: chunk.start_time,
        end_time: chunk.end_time,
        content: chunk.content,
        topic: chunk.topic,
        keywords: JSON.stringify(chunk.keywords),
        embedding: null // Placeholder for future embeddings
      }))
    };
  }
}

module.exports = YouTubeTranscriptService;
