// test-youtube-embeddable.js - Quick test to check if video can be embedded
// Run this in your browser console to test video embedding

function testYouTubeVideo(videoId) {
  console.log(`🧪 Testing YouTube video embedding: ${videoId}`);
  
  // Test 1: Try to load video info via oEmbed API
  fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    .then(response => {
      if (response.ok) {
        console.log('✅ oEmbed API: Video is embeddable');
        return response.json();
      } else {
        console.log('❌ oEmbed API: Video may not be embeddable');
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(data => {
      console.log('📺 Video info:', {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url
      });
    })
    .catch(error => {
      console.log('⚠️ oEmbed test failed:', error.message);
    });
  
  // Test 2: Check if video loads in iframe
  console.log('🔍 Testing iframe embed...');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
  iframe.width = '100';
  iframe.height = '100';
  iframe.style.position = 'fixed';
  iframe.style.top = '10px';
  iframe.style.right = '10px';
  iframe.style.zIndex = '9999';
  iframe.style.border = '2px solid red';
  
  iframe.onload = () => {
    console.log('✅ Iframe: Video iframe loaded successfully');
    setTimeout(() => {
      iframe.remove();
      console.log('🗑️ Test iframe removed');
    }, 3000);
  };
  
  iframe.onerror = () => {
    console.log('❌ Iframe: Failed to load video iframe');
    iframe.remove();
  };
  
  document.body.appendChild(iframe);
  
  // Test 3: Check for common embedding issues
  console.log('🔍 Common embedding issues to check:');
  console.log('• Video age restrictions (requires sign-in)');
  console.log('• Geographic restrictions');
  console.log('• Copyright restrictions');
  console.log('• Private/unlisted videos');
  console.log('• Channel embedding disabled');
  
  return `Testing complete. Check console for results.`;
}

// Test the current video
console.log(testYouTubeVideo('p09yRj47kNM'));

// Alternative test videos that should definitely work
console.log('🎯 Backup test with known working video...');
console.log(testYouTubeVideo('dQw4w9WgXcQ')); // Rick Roll - definitely embeddable
