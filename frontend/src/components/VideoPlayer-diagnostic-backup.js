// VideoPlayer.js - Diagnostic version with immediate polling
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
  const [pollingActive, setPollingActive] = useState(false);
  const playerRef = useRef(null);
  const pollingRef = useRef(null);

  // Log component mount
  useEffect(() => {
    console.log('🎬 VideoPlayer mounted', {
      youtubeVideoId,
      videoId,
      userId,
      hasToken: !!localStorage.getItem('authToken')
    });
    
    return () => {
      console.log('🎬 VideoPlayer unmounting');
    };
  }, []);

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

  // Force start polling - no checks, just start
  const forceStartPolling = useCallback(() => {
    console.log('🚨 FORCE START POLLING');
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    let tickCount = 0;
    pollingRef.current = setInterval(() => {
      tickCount++;
      console.log(`🕐 Polling tick #${tickCount}`);
      
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const state = playerRef.current.getPlayerState();
          
          console.log(`📊 Tick #${tickCount}: time=${time}, state=${state}`);
          
          setCurrentTime(time);
          setIsPlaying(state === 1);
          
          if (state === 1 && Math.floor(time) % 5 === 0) {
            updateContentContext(time);
          }
        } catch (error) {
          console.log(`❌ Tick #${tickCount} error:`, error.message);
        }
      } else {
        console.log(`⚠️ Tick #${tickCount}: No player ref`);
      }
    }, 1000);
    
    setPollingActive(true);
    console.log('✅ Polling interval created:', pollingRef.current);
  }, [updateContentContext]);

  const onPlayerReady = useCallback((event) => {
    console.log('🎬 YouTube player ready event fired');
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    
    // Try to get time immediately
    try {
      const time = event.target.getCurrentTime();
      console.log('🎯 Initial time:', time);
    } catch (e) {
      console.log('❌ Cannot get time yet');
    }
    
    // Force start polling after a short delay
    setTimeout(() => {
      console.log('⏰ Delayed polling start...');
      forceStartPolling();
    }, 1000);
  }, [forceStartPolling]);

  const onPlayerStateChange = useCallback((event) => {
    const playerState = event.data;
    console.log('🎵 State change:', playerState === 1 ? 'PLAYING' : playerState === 2 ? 'PAUSED' : 'OTHER');
    
    if (playerState === 2 || playerState === 0) {
      updateProgress();
    }
    
    // If playing and polling not active, start it
    if (playerState === 1 && !pollingActive) {
      console.log('▶️ Video playing, ensuring polling is active');
      forceStartPolling();
    }
  }, [updateProgress, pollingActive, forceStartPolling]);

  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) {
      console.log('⚠️ YouTube API not ready');
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
    console.log('🔄 YouTube API loading effect');
    
    if (!window.YT) {
      console.log('📥 Loading YouTube iframe API...');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready callback fired');
        setApiReady(true);
        initializePlayer();
      };
    } else {
      console.log('✅ YouTube API already loaded');
      setApiReady(true);
      initializePlayer();
    }

    return () => {
      console.log('🧹 Cleanup: clearing polling interval');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [initializePlayer]);

  // Debug: Log every render
  console.log('🔄 VideoPlayer render:', {
    currentTime,
    isPlaying,
    pollingActive,
    apiReady,
    hasPlayer: !!playerRef.current
  });

  // Aggressive fallback - try to start polling every 2 seconds
  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      if (!pollingActive && playerRef.current) {
        console.log('🚑 FALLBACK: Attempting to start polling...');
        forceStartPolling();
      }
    }, 2000);
    
    return () => clearInterval(fallbackInterval);
  }, [pollingActive, forceStartPolling]);

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
            {pollingActive && ' 🟢'}
          </span>
          {contentContext?.chunk?.topic && (
            <span className="current-topic">
              📍 {contentContext.chunk.topic}
            </span>
          )}
          {isLoading && <span className="saving">💾</span>}
        </div>
      </div>
      
      {/* Debug info */}
      <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
        Debug: Polling={pollingActive ? 'YES' : 'NO'}, 
        Player={playerRef.current ? 'YES' : 'NO'}, 
        Time={currentTime.toFixed(1)}s
      </div>
    </div>
  );
};

export default VideoPlayer;
