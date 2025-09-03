export default function SimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p>If you can see this, Next.js is working.</p>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">YouTube Video Test</h2>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/p09yRj47kNM"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}