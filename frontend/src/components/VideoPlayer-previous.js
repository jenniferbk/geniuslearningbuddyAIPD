// VideoPlayer-fixed.js - Simplified and more robust YouTube player integration
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
  const [playerReady, setPlayerReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerElementRef = useRef(null);

  // Simple content context updater
  const updateContentContext = useCallback(async (timestamp) => {
    if (!userId || timestamp <= 0) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No auth token found');
        return;
      }
      
      console.log(`🔄 Fetching content for timestamp: ${Math.floor(timestamp)}s`);
      
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
        console.log('✅ Content context received:', {
          timestamp: Math.floor(timestamp),
          topic: context.chunk?.topic,
          content: context.chunk?.content?.substring(0, 50) + '...'
        });
        
        setContentContext(context);
        if (onContentContextChange) {
          onContentContextChange(context);
        }
      } else {
        console.error('❌ Content context API error:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching content context:', error);
    }
  }, [youtubeVideoId, userId, onContentContextChange]);

  // Robust player checker
  const checkPlayerHealth = useCallback(() => {
    const player = playerRef.current;
    if (!player) return { healthy: false, reason: 'No player object' };
    
    try {
      // Test essential methods
      const time = player.getCurrentTime();
      const state = player.getPlayerState();
      const dur = player.getDuration();
      
      // Check if methods return valid values
      const timeValid = typeof time === 'number' && !isNaN(time);
      const stateValid = typeof state === 'number' && state >= 0 && state <= 5;
      const durationValid = typeof dur === 'number' && dur > 0;
      
      const healthy = timeValid && stateValid;
      
      return {
        healthy,
        time: timeValid ? time : 'INVALID',
        state: stateValid ? state : 'INVALID',
        duration: durationValid ? dur : 'INVALID',
        reason: healthy ? 'All methods working' : 'Method calls failing'
      };
    } catch (error) {
      return { healthy: false, reason: `Error: ${error.message}` };
    }
  }, []);

  // Simple time tracking
  const startTimeTracking = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('🚀 Starting time tracking...');
    
    intervalRef.current = setInterval(() => {
      const health = checkPlayerHealth();
      
      setDebugInfo(`Health: ${health.healthy ? '✅' : '❌'} | ${health.reason} | Time: ${health.time} | State: ${health.state}`);
      
      if (health.healthy) {
        const time = health.time;
        const state = health.state;
        
        // Update React state
        setCurrentTime(time);
        setIsPlaying(state === 1);
        
        // Update content context when playing or paused with valid time
        if ((state === 1 || state === 2) && time > 0) {
          updateContentContext(time);
        }
        
        console.log(`🕒 Tracking: ${time.toFixed(1)}s | State: ${state === 1 ? 'PLAYING' : state === 2 ? 'PAUSED' : 'OTHER'}`);
      } else {
        console.warn('⚠️ Player unhealthy:', health.reason);
      }
    }, 1000);
    
    console.log('✅ Time tracking interval started');
  }, [checkPlayerHealth, updateContentContext]);

  // Player event handlers
  const onPlayerReady = useCallback((event) => {
    console.log('🎬 Player ready event fired');
    
    // Store player reference
    playerRef.current = event.target;
    
    // Get duration
    try {
      const videoDuration = event.target.getDuration();
      setDuration(videoDuration);
      console.log(`📏 Video duration: ${videoDuration}s`);
    } catch (error) {
      console.warn('⚠️ Could not get duration:', error);
    }
    
    // Wait a moment for player to fully initialize, then start tracking
    setTimeout(() => {
      setPlayerReady(true);
      startTimeTracking();
      console.log('🚀 Player ready, tracking started');
    }, 500);
  }, [startTimeTracking]);

  const onPlayerStateChange = useCallback((event) => {
    const state = event.data;
    const stateName = state === 1 ? 'PLAYING' : state === 2 ? 'PAUSED' : state === 0 ? 'ENDED' : `OTHER(${state})`;
    
    console.log(`🎵 State changed: ${stateName}`);
    
    setIsPlaying(state === 1);
    
    // Ensure tracking is active when playing
    if (state === 1 && !intervalRef.current) {
      console.log('▶️ Video playing, ensuring tracking is active...');
      startTimeTracking();
    }
  }, [startTimeTracking]);

  // Initialize YouTube player
  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) {
      console.log('⚠️ YouTube API not ready');
      return;
    }
    
    // Clean up existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.log('Note: Could not destroy existing player');
      }
      playerRef.current = null;
    }
    
    console.log('🎆 Creating YouTube player...');
    setDebugInfo('Creating YouTube player...');
    
    // Create player with minimal config
    const player = new window.YT.Player(playerElementRef.current, {
      height: '390',
      width: '640',
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        disablekb: 0,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (event) => {
          console.error('❌ YouTube player error:', event.data);
          setDebugInfo(`Player error: ${event.data}`);
        }
      }
    });
    
    console.log('📺 YouTube player created');
  }, [youtubeVideoId, onPlayerReady, onPlayerStateChange]);

  // Load YouTube API
  useEffect(() => {
    setDebugInfo('Loading YouTube API...');
    
    if (window.YT && window.YT.Player) {
      // API already loaded
      console.log('✅ YouTube API already available');
      initializePlayer();
    } else {
      // Load API
      console.log('📥 Loading YouTube API...');
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API loaded and ready');
        setDebugInfo('YouTube API ready, initializing player...');
        initializePlayer();
      };
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log('Note: Could not destroy player on unmount');
        }
      }
    };
  }, [initializePlayer]);

  // Manual controls for testing
  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  const handleSeek = (seconds) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      updateContentContext(seconds);
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {/* YouTube player container */}
        <div 
          ref={playerElementRef}
          id="youtube-player"
          style={{ width: '100%', height: '390px' }}
        />
        
        {/* Status overlay */}
        <div className="status-overlay">
          <div className="player-status">
            <span className={`play-indicator ${isPlaying ? 'playing' : 'paused'}`}>
              {isPlaying ? '▶️ Playing' : '⏸️ Paused'} {formatTime(currentTime)}
            </span>
            
            {contentContext?.chunk?.topic && (
              <span className="current-topic">
                📍 {contentContext.chunk.topic}
              </span>
            )}
          </div>
          
          <div className="debug-info">
            {debugInfo}
          </div>
        </div>
        
        {/* Manual controls for testing */}
        <div className="manual-controls">
          <button onClick={handlePlay}>▶️ Play</button>
          <button onClick={handlePause}>⏸️ Pause</button>
          <button onClick={() => handleSeek(0)}>⏮️ Start</button>
          <button onClick={() => handleSeek(currentTime + 30)}>⏭️ +30s</button>
          <button onClick={() => {
            const health = checkPlayerHealth();
            console.log('🔍 Player health check:', health);
            alert(`Player Health: ${health.healthy ? 'GOOD' : 'BAD'}\n${health.reason}\nTime: ${health.time}\nState: ${health.state}`);
          }}>
            🔍 Check Health
          </button>
        </div>
      </div>
      
      {/* Content context display */}
      {contentContext && (
        <div className="content-context">
          <h4>{contentContext.chunk?.topic}</h4>
          <p>{contentContext.chunk?.content?.substring(0, 200)}...</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;