'use client';

export default function TestVideo() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Player Test (Using YouTube Embed)</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test 1: Google AI Course</h2>
        <div style={{ width: '640px', height: '360px' }}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/p09yRj47kNM"
            title="Google AI Course"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Test 2: Another Video</h2>
        <div style={{ width: '640px', height: '360px' }}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Test Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        If you can see the YouTube videos above, the embed is working correctly.
        This uses native YouTube iframe embeds which are more reliable than react-player.
      </p>
    </div>
  );
}