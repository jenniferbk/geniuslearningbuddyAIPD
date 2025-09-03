// clear-and-fetch-real-transcript.js - Clear test data and fetch real YouTube transcript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const YouTubeTranscriptService = require('./backend/youtube-transcript-service');

async function clearAndFetchRealTranscript() {
  const videoId = 'p09yRj47kNM';
  const dbPath = path.join(__dirname, 'backend', 'learning_buddy.db');
  
  console.log('🧹 Clearing test data and fetching REAL transcript for:', videoId);
  console.log('📺 Video URL: https://www.youtube.com/watch?v=' + videoId);
  
  const db = new sqlite3.Database(dbPath);
  const transcriptService = new YouTubeTranscriptService();
  
  try {
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current database state...');
    const currentChunks = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?', [videoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0].count);
      });
    });
    
    console.log(`Found ${currentChunks} existing chunks (test data)`);
    
    // Step 2: Clear existing test data
    console.log('\n🗑️ Step 2: Clearing existing test data...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM video_content_chunks WHERE video_id = ?', [videoId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Test data cleared');
    
    // Step 3: Try to fetch REAL transcript using multiple methods
    console.log('\n🌐 Step 3: Attempting to fetch REAL transcript...');
    console.log('This will try multiple methods with timeout protection');
    
    let realTranscript = null;
    
    // Method 1: Try the improved service (which tries external API first)
    try {
      console.log('\n🔗 Method 1: Trying YouTube Transcript API...');
      realTranscript = await transcriptService.fetchTranscript(videoId);
      
      // Check if we got fallback data (indicates API failed)
      const isRealData = !realTranscript.some(chunk => 
        chunk.content.includes('placeholder') || 
        chunk.content.includes('Google\'s comprehensive AI course')
      );
      
      if (isRealData) {
        console.log('✅ SUCCESS! Got real transcript from API');
      } else {
        console.log('⚠️ Got fallback data - API likely failed, trying alternative methods...');
        realTranscript = null;
      }
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
    }
    
    // Method 2: Try youtube-transcript-api.herokuapp.com directly with different parameters
    if (!realTranscript) {
      console.log('\n🔗 Method 2: Trying direct API with alternative parameters...');
      try {
        const axios = require('axios');
        
        // Try different API endpoints/parameters
        const apiUrls = [
          `https://youtube-transcript-api.herokuapp.com/api/transcript?video_id=${videoId}`,
          `https://youtube-transcript-api.herokuapp.com/api/transcript?video_id=${videoId}&lang=en`,
          `https://youtubetranscript.com/?server_vid2=${videoId}`
        ];
        
        for (const url of apiUrls) {
          try {
            console.log(`   Trying: ${url.split('?')[0]}...`);
            const response = await axios.get(url, { 
              timeout: 20000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json'
              }
            });
            
            if (response.data && (response.data.transcript || response.data.data)) {
              const transcriptData = response.data.transcript || response.data.data;
              console.log(`✅ SUCCESS! Got ${transcriptData.length} segments from ${url.split('?')[0]}`);
              realTranscript = transcriptService.processTranscriptData(transcriptData);
              break;
            }
          } catch (apiError) {
            console.log(`   Failed: ${apiError.message}`);
          }
        }
      } catch (error) {
        console.log(`❌ Method 2 failed: ${error.message}`);
      }
    }
    
    // Method 3: Try youtube-dl or yt-dlp (if installed)
    if (!realTranscript) {
      console.log('\n🔗 Method 3: Trying youtube-dl/yt-dlp...');
      try {
        const { exec } = require('child_process');
        
        // Check if yt-dlp is available
        const checkYtDlp = () => new Promise((resolve) => {
          exec('yt-dlp --version', (error) => {
            resolve(!error);
          });
        });
        
        const hasYtDlp = await checkYtDlp();
        if (hasYtDlp) {
          console.log('   yt-dlp found, attempting transcript extraction...');
          
          const ytDlpCommand = `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --print "%(title)s" "https://www.youtube.com/watch?v=${videoId}"`;
          
          const result = await new Promise((resolve, reject) => {
            exec(ytDlpCommand, { timeout: 30000 }, (error, stdout, stderr) => {
              if (error) reject(error);
              else resolve({ stdout, stderr });
            });
          });
          
          console.log('✅ yt-dlp execution completed');
          // Would need to parse the subtitle files here
          
        } else {
          console.log('   yt-dlp not found - install with: brew install yt-dlp');
        }
      } catch (error) {
        console.log(`❌ Method 3 failed: ${error.message}`);
      }
    }
    
    // Step 4: Store the results
    console.log('\n💾 Step 4: Storing transcript data...');
    
    if (realTranscript && realTranscript.length > 0) {
      // Store real transcript
      const stmt = db.prepare(`
        INSERT INTO video_content_chunks 
        (video_id, start_time, end_time, content, topic, keywords, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const chunk of realTranscript) {
        stmt.run(
          videoId,
          chunk.start_time,
          chunk.end_time,
          chunk.content,
          chunk.topic,
          JSON.stringify(chunk.keywords),
          chunk.confidence || 0.8
        );
      }
      
      stmt.finalize();
      
      console.log(`✅ Stored ${realTranscript.length} REAL transcript chunks`);
      console.log('\n📊 Real transcript summary:');
      console.log(`   Total chunks: ${realTranscript.length}`);
      console.log(`   Duration: ${realTranscript[realTranscript.length - 1]?.end_time || 'unknown'} seconds`);
      console.log(`   Topics: ${[...new Set(realTranscript.map(c => c.topic))].length} unique topics`);
      
      // Show first real chunk
      if (realTranscript[0]) {
        console.log('\n📝 First real chunk:');
        console.log(`   Topic: ${realTranscript[0].topic}`);
        console.log(`   Content: ${realTranscript[0].content.substring(0, 150)}...`);
      }
      
    } else {
      console.log('⚠️ Could not fetch real transcript from any method');
      console.log('💡 Options:');
      console.log('   1. Check if the video has captions enabled');
      console.log('   2. Try manually downloading the transcript');
      console.log('   3. Use enhanced fallback data for development');
      console.log('   4. Install yt-dlp: brew install yt-dlp');
      
      // Store enhanced fallback as backup
      const enhancedFallback = transcriptService.getFallbackTranscript(videoId);
      const stmt = db.prepare(`
        INSERT INTO video_content_chunks 
        (video_id, start_time, end_time, content, topic, keywords, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const chunk of enhancedFallback) {
        stmt.run(
          videoId,
          chunk.start_time,
          chunk.end_time,
          chunk.content + ' [ENHANCED FALLBACK]',
          chunk.topic,
          JSON.stringify(chunk.keywords),
          chunk.confidence || 0.7
        );
      }
      
      stmt.finalize();
      console.log('📦 Stored enhanced fallback data as backup');
    }
    
    // Step 5: Verify the results
    console.log('\n✅ Step 5: Verification...');
    const finalCount = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM video_content_chunks WHERE video_id = ?', [videoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0].count);
      });
    });
    
    console.log(`📊 Final result: ${finalCount} chunks in database`);
    console.log('🎉 Process completed!');
    
    if (realTranscript) {
      console.log('\n🚀 Next steps:');
      console.log('   1. Start your backend: cd backend && npm run dev');
      console.log('   2. Test the content-aware chat with real transcript');
      console.log('   3. Verify video timer polling works with real timestamps');
    }
    
  } catch (error) {
    console.error('❌ Error during process:', error);
  } finally {
    db.close();
  }
}

// Run the process
clearAndFetchRealTranscript();