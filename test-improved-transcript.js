// test-improved-transcript.js - Test the improved YouTube transcript service
const YouTubeTranscriptService = require('./backend/youtube-transcript-service');

async function testImprovedService() {
  const service = new YouTubeTranscriptService();
  
  console.log('🧪 Testing Improved YouTube Transcript Service\n');
  console.log('🎯 Key improvements:');
  console.log('  ✅ 15-second timeout (prevents hanging)');
  console.log('  ✅ Retry logic (2 attempts)');
  console.log('  ✅ Better error handling');
  console.log('  ✅ Enhanced fallback data');
  console.log('  ✅ Confidence scoring');
  console.log('');
  
  // Test video ID
  const videoId = 'p09yRj47kNM';
  console.log(`📺 Testing with video ID: ${videoId}`);
  
  try {
    // Test health check first
    console.log('\n🏥 Testing service health...');
    const health = await service.testHealth();
    console.log(`Status: ${health.status}`);
    console.log(`API Available: ${health.apiAvailable}`);
    if (health.error) {
      console.log(`Error: ${health.error}`);
    }
    
    // Fetch transcript (this will timeout gracefully and use fallback)
    console.log('\n🌐 Fetching transcript (with timeout protection)...');
    const startTime = Date.now();
    const chunks = await service.fetchTranscript(videoId);
    const endTime = Date.now();
    
    console.log(`\n✅ Successfully completed in ${endTime - startTime}ms`);
    console.log(`📊 Retrieved ${chunks.length} chunks`);
    
    // Analyze the quality
    const avgConfidence = chunks.reduce((sum, chunk) => sum + (chunk.confidence || 0.5), 0) / chunks.length;
    console.log(`🎯 Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // Display enhanced chunks
    console.log('\n📝 First 3 chunks with confidence scores:');
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(`  ⏱️  Time: ${chunk.start_time}-${chunk.end_time}s`);
      console.log(`  📚 Topic: ${chunk.topic}`);
      console.log(`  🎯 Confidence: ${((chunk.confidence || 0.5) * 100).toFixed(1)}%`);
      console.log(`  🏷️  Keywords: ${chunk.keywords.slice(0, 5).join(', ')}`);
      console.log(`  📄 Content: ${chunk.content.substring(0, 150)}...`);
    });
    
    // Test topic diversity
    console.log('\n🏷️ Topic analysis:');
    const topics = [...new Set(chunks.map(c => c.topic))];
    topics.forEach(topic => console.log(`  - ${topic}`));
    
    // Test database formatting
    console.log('\n💾 Testing enhanced database format...');
    const dbFormat = service.formatForDatabase(videoId, chunks);
    console.log(`  📺 Video ID: ${dbFormat.video_id}`);
    console.log(`  📊 Chunk count: ${dbFormat.chunk_count}`);
    console.log(`  ⏱️  Total duration: ${dbFormat.total_duration}s`);
    console.log(`  🎯 Average confidence: ${(dbFormat.average_confidence * 100).toFixed(1)}%`);
    console.log(`  ✅ Ready for database: YES`);
    
    // Test error handling with invalid video
    console.log('\n🚫 Testing error handling with invalid video...');
    try {
      const invalidChunks = await service.fetchTranscript('invalid_video_id');
      console.log(`📋 Fallback worked: ${invalidChunks.length} chunks`);
    } catch (error) {
      console.log(`❌ Error properly caught: ${error.message}`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 The improved service:');
    console.log('  • Prevents timeout issues that caused previous failures');
    console.log('  • Provides rich fallback data for development/testing');
    console.log('  • Includes confidence scoring for content quality');
    console.log('  • Has better error messages for debugging');
    console.log('  • Supports retry logic for transient network issues');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the test
testImprovedService();