// VideoPlayer.js - Simplified direct polling version
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  youtubeVideoId = "p09yRj47kNM",
  videoId, 
  userId, 
  onContentContextChange,
  onProgressUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentContext, setContentContext] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const playerRef = useRef(null);
  const pollingRef = useRef(null);

  // Update content context
  const updateContentContext = useCallback(async (timestamp) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token || !userId) {
        console.warn('⚠️ Missing auth token or userId');
        return;
      }
      
      const response = await fetch('/api/content/video-context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: youtubeVideoId,
          timestamp: Math.floor(timestamp),
          userId
        })
      });
      
      if (response.ok) {
        const context = await response.json();
        console.log('🎯 Content context updated:', {
          timestamp: Math.floor(timestamp),
          topic: context.chunk?.topic
        });
        setContentContext(context);
        
        if (onContentContextChange) {
          onContentContextChange(context);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching content context:', error);
    }
  }, [youtubeVideoId, userId, onContentContextChange]);

  const updateProgress = useCallback(async () => {
    if (!playerRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const currentPos = playerRef.current.getCurrentTime();
      const videoDuration = playerRef.current.getDuration();
      
      await fetch('/api/content/update-progress', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          contentId: youtubeVideoId,
          contentType: 'video',
          currentPosition: currentPos,
          duration: videoDuration,
          completed: currentPos >= videoDuration * 0.95
        })
      });
      
      if (onProgressUpdate) {
        onProgressUpdate({
          currentTime: currentPos,
          duration: videoDuration,
          progress: (currentPos / videoDuration) * 100
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, userId, youtubeVideoId, onProgressUpdate]);

  // Simple polling function
  const startPolling = useCallback(() => {
    console.log('🚀 Starting simple polling...');
    
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // Poll every 500ms for more responsive updates
    pollingRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const state = playerRef.current.getPlayerState();
          
          // Only log every 2 seconds to reduce noise
          if (Math.floor(time) % 2 === 0 && Math.floor(time) !== Math.floor(currentTime)) {
            console.log('📊 Polling update:', {
              time: time.toFixed(1),
              state: state,
              playing: state === 1
            });
          }
          
          setCurrentTime(time);
          setIsPlaying(state === 1);
          
          // Update content context when playing
          if (state === 1 && Math.floor(time) !== Math.floor(currentTime)) {
            updateContentContext(time);
          }
        } catch (error) {
          // Silently continue - player might not be ready
        }
      }
    }, 500);
    
    console.log('✅ Polling started');
  }, [currentTime, updateContentContext]);

  const onPlayerReady = useCallback((event) => {
    console.log('🎬 YouTube player ready');
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    
    // Start polling immediately
    startPolling();
  }, [startPolling]);

  const onPlayerStateChange = useCallback((event) => {
    const playerState = event.data;
    console.log('🎵 State change:', playerState === 1 ? 'PLAYING' : playerState === 2 ? 'PAUSED' : 'OTHER');
    
    if (playerState === 2 || playerState === 0) {
      updateProgress();
    }
  }, [updateProgress]);

  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) {
      return;
    }

    console.log('🎆 Creating YouTube player...');
    
    new window.YT.Player('youtube-player', {
      height: '350',
      width: '100%',
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  }, [youtubeVideoId, onPlayerReady, onPlayerStateChange]);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
        initializePlayer();
      };
    } else {
      setApiReady(true);
      initializePlayer();
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [initializePlayer]);

  const jumpToTimestamp = useCallback((timestamp) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp, true);
      setCurrentTime(timestamp);
      updateContentContext(timestamp);
    }
  }, [updateContentContext]);

  useEffect(() => {
    window.videoPlayerActions = { jumpToTimestamp };
  }, [jumpToTimestamp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <div id="youtube-player"></div>
        
        <div className="status-overlay">
          <span className="play-status">
            {isPlaying ? '▶️ Playing' : '⏸️ Paused'} 
            {formatTime(currentTime)}
          </span>
          {contentContext?.chunk?.topic && (
            <span className="current-topic">
              📍 {contentContext.chunk.topic}
            </span>
          )}
          {isLoading && <span className="saving">💾</span>}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
