// MockVideoPlayer.js - Simulated video player for testing content-aware features
import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

const MockVideoPlayer = ({ 
  videoUrl, 
  videoId, 
  userId, 
  onContentContextChange,
  onProgressUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(240); // 4 minutes mock duration
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentContext, setContentContext] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef(null);

  // Simulate time updates when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 1000); // Update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Update content context when time changes
  useEffect(() => {
    updateContentContext(currentTime);
  }, [currentTime]);

  // Fetch RAG content for current timestamp
  const updateContentContext = async (timestamp) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/content/video-context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId,
          timestamp: Math.floor(timestamp),
          userId
        })
      });
      
      const context = await response.json();
      setContentContext(context);
      
      // Notify parent component about content context change
      if (onContentContextChange) {
        onContentContextChange(context);
      }
    } catch (error) {
      console.error('Error fetching content context:', error);
    }
  };

  // Handle play/pause events
  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause - update progress
      updateProgress();
    }
    setIsPlaying(!isPlaying);
  };

  // Update user progress in database
  const updateProgress = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/content/update-progress', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          contentId: videoId,
          contentType: 'video',
          currentPosition: currentTime,
          duration: duration,
          completed: currentTime >= duration * 0.95
        })
      });
      
      if (onProgressUpdate) {
        onProgressUpdate({
          currentTime: currentTime,
          duration: duration,
          progress: (currentTime / duration) * 100
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle seeking
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
    updateContentContext(newTime);
  };

  // Jump to specific timestamp (for AI suggestions)
  const jumpToTimestamp = (timestamp) => {
    setCurrentTime(timestamp);
    updateContentContext(timestamp);
  };

  // Expose jumpToTimestamp to parent component
  useEffect(() => {
    if (window.videoPlayerActions) {
      window.videoPlayerActions.jumpToTimestamp = jumpToTimestamp;
    }
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {/* Mock Video Display */}
        <div className="mock-video-display">
          <div className="mock-video-content">
            <div className="mock-video-title">
              🎬 AI Prompt Engineering Introduction
            </div>
            <div className="mock-video-status">
              {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
            </div>
            <div className="mock-video-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="mock-video-progress">
              <div 
                className="mock-progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            {contentContext && (
              <div className="mock-content-topic">
                📍 Current Topic: {contentContext.chunk?.topic || 'Loading...'}
              </div>
            )}
          </div>
        </div>
        
        {/* Custom Video Controls */}
        <div className="video-controls">
          <button 
            className="play-pause-btn"
            onClick={togglePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <div 
            className="progress-bar"
            onClick={handleSeek}
          >
            <div 
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          {isLoading && <div className="loading-indicator">💾</div>}
        </div>
      </div>
      
      {/* Content Context Display */}
      {contentContext && (
        <div className="content-context-debug">
          <h4>Current Content Context:</h4>
          <p><strong>Timestamp:</strong> {formatTime(contentContext.timestamp)}</p>
          <p><strong>Topic:</strong> {contentContext.chunk?.topic}</p>
          <p><strong>Content:</strong> {contentContext.chunk?.content?.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
};

export default MockVideoPlayer;