// test-youtube-transcript.js - Test the YouTube transcript service
const YouTubeTranscriptService = require('./backend/youtube-transcript-service');

async function testTranscriptService() {
  const service = new YouTubeTranscriptService();
  
  console.log('🧪 Testing YouTube Transcript Service\n');
  
  // Test video ID
  const videoId = 'p09yRj47kNM';
  console.log(`📺 Testing with video ID: ${videoId}`);
  
  try {
    // Fetch transcript
    console.log('\n🌐 Fetching transcript...');
    const chunks = await service.fetchTranscript(videoId);
    
    console.log(`\n✅ Successfully fetched ${chunks.length} chunks`);
    
    // Display first few chunks
    console.log('\n📝 First 3 chunks:');
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(`  Time: ${chunk.start_time}-${chunk.end_time}s`);
      console.log(`  Topic: ${chunk.topic}`);
      console.log(`  Keywords: ${chunk.keywords.join(', ')}`);
      console.log(`  Content: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Test topic extraction
    console.log('\n🏷️ Topics found:');
    const topics = [...new Set(chunks.map(c => c.topic))];
    topics.forEach(topic => console.log(`  - ${topic}`));
    
    // Test database formatting
    console.log('\n💾 Testing database format...');
    const dbFormat = service.formatForDatabase(videoId, chunks);
    console.log(`  Video ID: ${dbFormat.video_id}`);
    console.log(`  Chunk count: ${dbFormat.chunk_count}`);
    console.log(`  Total duration: ${dbFormat.total_duration}s`);
    console.log(`  Ready for database: ✅`);
    
  } catch (error) {
    console.error('\n❌ Error testing transcript service:', error);
  }
}

// Run the test
testTranscriptService();
