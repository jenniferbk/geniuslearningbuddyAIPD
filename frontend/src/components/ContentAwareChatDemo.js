// ContentAwareChatDemo-stable.js - Prevent re-renders that destroy VideoPlayer
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import ChatInterface from './ChatInterface';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './ContentAwareChatDemo.css';

const ContentAwareChatDemo = () => {
  const { user } = useLearningBuddy();
  const [viewMode, setViewMode] = useState('demo');
  const [transcriptStatus, setTranscriptStatus] = useState('unknown');
  const [transcriptMessage, setTranscriptMessage] = useState('');
  
  // Use ref for content context to avoid re-renders
  const contentContextRef = useRef(null);
  const [contentContextDisplay, setContentContextDisplay] = useState(null);

  const sampleContent = {
    id: 'intro_to_prompting',
    title: 'AI Prompt Engineering for Teachers',
    description: 'Learn how to create effective prompts for ChatGPT and other AI tools in education',
    content_type: 'video',
    youtube_id: 'p09yRj47kNM',
    lesson_id: 'lesson_1'
  };

  // STABLE content context handler - doesn't cause re-renders
  const handleContentContextChange = useCallback((context) => {
    console.log('🎯 STABLE ContentAwareChatDemo received context:', context);
    
    // Store in ref to avoid re-renders
    contentContextRef.current = context;
    
    // Only update display state if topic actually changed
    setContentContextDisplay(prevDisplay => {
      if (prevDisplay?.chunk?.topic !== context?.chunk?.topic) {
        return context;
      }
      return prevDisplay;
    });
    
    // Set global context without causing re-render
    if (window.setGlobalContentContext) {
      window.setGlobalContentContext(context);
    }
  }, []);

  const handleProgressUpdate = useCallback((progressData) => {
    console.log('STABLE Content progress:', progressData);
  }, []);

  // Debug user and auth state
  useEffect(() => {
    console.log('🔍 STABLE ContentAwareChatDemo Debug:', {
      user: user,
      userId: user?.id,
      userType: typeof user,
      userKeys: user ? Object.keys(user) : [],
      hasToken: !!localStorage.getItem('token')
    });
  }, [user]);

  // Check transcript status on load
  useEffect(() => {
    checkTranscriptStatus();
  }, []);

  const checkTranscriptStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/content/transcript-status/${sampleContent.youtube_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 STABLE Transcript status:', data);
        
        if (data.hasTranscript && data.chunkCount > 0) {
          setTranscriptStatus('loaded');
          setTranscriptMessage(`${data.chunkCount} chunks loaded`);
        } else {
          setTranscriptStatus('empty');
          setTranscriptMessage('No transcript loaded');
        }
      } else {
        console.error('❌ Error checking transcript status:', response.status);
        setTranscriptStatus('error');
        setTranscriptMessage('Error checking status');
      }
    } catch (error) {
      console.error('Error checking transcript status:', error);
      setTranscriptStatus('error');
      setTranscriptMessage('Connection error');
    }
  };

  const fetchRealTranscript = async () => {
    setTranscriptStatus('fetching');
    setTranscriptMessage('Fetching YouTube transcript...');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content/fetch-transcript', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          youtubeVideoId: sampleContent.youtube_id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ STABLE Transcript fetched:', data);
        setTranscriptStatus('loaded');
        setTranscriptMessage(data.message || 'Transcript loaded successfully');
        
        setTimeout(checkTranscriptStatus, 1000);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching transcript:', errorData);
        setTranscriptStatus('error');
        setTranscriptMessage(errorData.message || 'Failed to fetch transcript');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscriptStatus('error');
      setTranscriptMessage('Network error');
    }
  };

  const populateTranscript = async () => {
    setTranscriptStatus('loading');
    setTranscriptMessage('Loading sample data...');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/debug/populate-video/${sampleContent.youtube_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ STABLE Transcript populated:', data);
        setTranscriptStatus('loaded');
        setTranscriptMessage(data.message || 'Sample data loaded');
        setTimeout(checkTranscriptStatus, 1000);
      } else {
        console.error('❌ Error populating transcript:', await response.text());
        setTranscriptStatus('error');
        setTranscriptMessage('Failed to load sample data');
      }
    } catch (error) {
      console.error('Error populating transcript:', error);
      setTranscriptStatus('error');
      setTranscriptMessage('Connection error');
    }
  };

  return (
    <div className="content-aware-demo">
      {/* Compact Header */}
      <div className="compact-header">
        <div className="course-info">
          <span className="course-title">{sampleContent.title}</span>
          {contentContextDisplay?.chunk?.topic && (
            <span className="current-section">• {contentContextDisplay.chunk.topic}</span>
          )}
          
          {/* Transcript Status Indicator */}
          <span className={`transcript-status transcript-${transcriptStatus}`}>
            {transcriptStatus === 'unknown' && '🔍 Checking...'}
            {transcriptStatus === 'empty' && '📝 No transcript'}
            {transcriptStatus === 'loading' && '⏳ Loading...'}
            {transcriptStatus === 'fetching' && '🌐 Fetching...'}
            {transcriptStatus === 'loaded' && '✅ Content ready'}
            {transcriptStatus === 'error' && '❌ Error'}
            {transcriptMessage && <span className="status-message"> - {transcriptMessage}</span>}
          </span>
        </div>
        
        <div className="view-controls">
          {/* Transcript Controls */}
          {transcriptStatus === 'empty' && (
            <>
              <button 
                className="populate-btn fetch-real"
                onClick={fetchRealTranscript}
                title="Fetch real YouTube transcript"
              >
                🌐 Fetch Transcript
              </button>
              <button 
                className="populate-btn"
                onClick={populateTranscript}
                title="Load sample transcript data"
              >
                📝 Use Sample
              </button>
            </>
          )}
          
          {transcriptStatus === 'error' && (
            <>
              <button 
                className="populate-btn retry"
                onClick={fetchRealTranscript}
                title="Try fetching transcript again"
              >
                🔄 Retry Fetch
              </button>
              <button 
                className="populate-btn"
                onClick={populateTranscript}
                title="Use sample data instead"
              >
                📝 Use Sample
              </button>
            </>
          )}
          
          {transcriptStatus === 'loaded' && (
            <button 
              className="populate-btn refresh"
              onClick={checkTranscriptStatus}
              title="Refresh transcript status"
            >
              🔄 Refresh
            </button>
          )}
          
          <div className="view-switcher">
            <button 
              className={`view-btn ${viewMode === 'demo' ? 'active' : ''}`}
              onClick={() => setViewMode('demo')}
            >
              Split
            </button>
            <button 
              className={`view-btn ${viewMode === 'content' ? 'active' : ''}`}
              onClick={() => setViewMode('content')}
            >
              Content
            </button>
            <button 
              className={`view-btn ${viewMode === 'chat' ? 'active' : ''}`}
              onClick={() => setViewMode('chat')}
            >
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`demo-layout ${viewMode}`}>
        {/* Content Side */}
        {(viewMode === 'demo' || viewMode === 'content') && (
          <div className="content-side">
            <VideoPlayer
              youtubeVideoId={sampleContent.youtube_id}
              videoId={sampleContent.id}
              userId={user?.id}
              onContentContextChange={handleContentContextChange}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        )}

        {/* Chat Side */}
        {(viewMode === 'demo' || viewMode === 'chat') && (
          <div className="chat-side">
            {/* Pass the current context from ref */}
            <ChatInterface contentContext={contentContextRef.current} />

            {/* Compact Sample Questions */}
            <div className="quick-questions">
              <div className="question-row">
                <button 
                  className="quick-question"
                  onClick={() => {
                    // Force refresh video context first
                    if (window.videoPlayerActions?.getCurrentContext) {
                      window.videoPlayerActions.getCurrentContext();
                    }
                    
                    const event = new CustomEvent('insertSampleQuestion', {
                      detail: "What's being discussed right now?"
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  What's happening now?
                </button>
                
                <button 
                  className="quick-question"
                  onClick={() => {
                    const event = new CustomEvent('insertSampleQuestion', {
                      detail: "How does this apply to my classroom?"
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  Apply to classroom
                </button>
                
                {contentContextDisplay?.chunk?.topic && (
                  <button 
                    className="quick-question"
                    onClick={() => {
                      const event = new CustomEvent('insertSampleQuestion', {
                        detail: `Can you explain more about ${contentContextDisplay.chunk.topic}?`
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    Explain: {contentContextDisplay.chunk.topic.substring(0, 20)}...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentAwareChatDemo;