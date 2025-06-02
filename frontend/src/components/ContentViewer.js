// ContentViewer.js - Main content viewer component
import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import './ContentViewer.css';

const ContentViewer = ({ contentId, userId }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentContext, setContentContext] = useState(null);

  // Load content details
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cms/content/${contentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load content');
        }

        const contentData = await response.json();
        setContent(contentData);
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  // Handle content context changes from video player
  const handleContentContextChange = (context) => {
    setContentContext(context);
    
    // Update global content context for AI chat awareness
    if (window.setGlobalContentContext) {
      window.setGlobalContentContext(context);
    }
  };

  // Handle progress updates
  const handleProgressUpdate = (progressData) => {
    console.log('Content progress updated:', progressData);
    // Could trigger progress bar updates, analytics, etc.
  };

  if (loading) {
    return (
      <div className="content-viewer loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-viewer error">
        <div className="error-message">
          <h3>⚠️ Error Loading Content</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="content-viewer empty">
        <div className="empty-state">
          <h3>📚 No Content Selected</h3>
          <p>Select a course and lesson to begin learning with your AI buddy.</p>
        </div>
      </div>
    );
  }

  // Render different content types
  const renderContent = () => {
    switch (content.content_type) {
      case 'video':
        return (
          <VideoPlayer
            videoUrl={content.file_path}
            videoId={content.id}
            userId={userId}
            onContentContextChange={handleContentContextChange}
            onProgressUpdate={handleProgressUpdate}
          />
        );
      
      case 'pdf':
        return (
          <div className="pdf-viewer">
            <iframe
              src={content.file_path}
              title={content.title}
              width="100%"
              height="600px"
              style={{ border: 'none', borderRadius: '8px' }}
            />
            <div className="pdf-info">
              <h3>{content.title}</h3>
              <p>{content.description}</p>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="image-viewer">
            <img
              src={content.file_path}
              alt={content.title}
              className="content-image"
            />
            <div className="image-info">
              <h3>{content.title}</h3>
              <p>{content.description}</p>
            </div>
          </div>
        );
      
      case 'document':
        return (
          <div className="document-viewer">
            <div className="document-header">
              <h2>{content.title}</h2>
              <p className="document-description">{content.description}</p>
            </div>
            <div className="document-content">
              {content.text_content ? (
                <div 
                  className="text-content"
                  dangerouslySetInnerHTML={{ __html: content.text_content }}
                />
              ) : (
                <a 
                  href={content.file_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-link"
                >
                  📄 Open Document
                </a>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="unsupported-content">
            <h3>🤔 Unsupported Content Type</h3>
            <p>Content type "{content.content_type}" is not yet supported.</p>
            <a 
              href={content.file_path} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open in New Tab
            </a>
          </div>
        );
    }
  };

  return (
    <div className="content-viewer">
      {/* Content Context Bar */}
      {contentContext && (
        <div className="content-context-bar">
          <span className="context-icon">🎯</span>
          <span className="context-text">
            AI is watching: {contentContext.chunk?.topic || 'Content'} 
            {contentContext.timestamp && (
              <span className="timestamp">
                ({Math.floor(contentContext.timestamp / 60)}:{String(Math.floor(contentContext.timestamp % 60)).padStart(2, '0')})
              </span>
            )}
          </span>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="content-main">
        {renderContent()}
      </div>
      
      {/* Content Metadata */}
      <div className="content-metadata">
        <h3>{content.title}</h3>
        {content.description && (
          <p className="content-description">{content.description}</p>
        )}
        <div className="content-tags">
          <span className="tag type-tag">{content.content_type}</span>
          {content.lesson_id && (
            <span className="tag lesson-tag">Lesson {content.lesson_id}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;