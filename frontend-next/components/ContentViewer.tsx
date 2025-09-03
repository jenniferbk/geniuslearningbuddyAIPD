'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ContentViewerProps {
  lesson: {
    id: string;
    title: string;
    type: string;
    contentUrl: string;
    videoId?: string;
    description: string;
  };
  onProgressUpdate?: (progress: { timestamp?: number; page?: number; percentage?: number }) => void;
}

export default function ContentViewer({ lesson, onProgressUpdate }: ContentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lesson.type === 'reading') {
      loadMarkdownContent();
    }
  }, [lesson]);

  const loadMarkdownContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(lesson.contentUrl);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('Error loading content:', error);
      setContent('# Content Loading Error\n\nSorry, we couldn\'t load this content.');
    } finally {
      setLoading(false);
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const renderContent = () => {
    switch (lesson.type) {
      case 'video':
        const videoId = lesson.videoId || getYouTubeId(lesson.contentUrl);
        
        if (!videoId) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <p className="text-red-600">Invalid YouTube URL</p>
                <p className="text-sm text-gray-600 mt-2">{lesson.contentUrl}</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="w-full h-full bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-6xl" style={{ aspectRatio: '16/9' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
                title={lesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">PDF Viewer Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                PDF viewing functionality will be available in the next update.
              </p>
              <a 
                href={lesson.contentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            </div>
          </div>
        );

      case 'reading':
        return (
          <div className="w-full h-full overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto p-8">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading content...</div>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold mb-2">Interactive Content</h3>
              <p className="text-gray-600">
                Interactive activities will be available soon!
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Content type not supported
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-semibold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-600 mt-1">{lesson.description}</p>
        {lesson.type === 'video' && lesson.videoId && (
          <div className="mt-2">
            <p className="text-sm text-blue-600">
              💡 The AI buddy has the transcript of this video and can answer questions about specific parts!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Video ID: {lesson.videoId || getYouTubeId(lesson.contentUrl)}
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}