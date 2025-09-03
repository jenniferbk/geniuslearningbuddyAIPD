// VideoPlayer-robust.js - YouTube embedding fix for autoplay and state issues
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
  const [lastStateChange, setLastStateChange] = useState(Date.now());
  
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerElementRef = useRef(null);
  const forcePlayRef = useRef(false);

  // Enhanced content context updater
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

  // Enhanced player health checker
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
      const stateValid = typeof state === 'number' && state >= -1 && state <= 5;
      const durationValid = typeof dur === 'number' && dur > 0;
      
      const healthy = timeValid && stateValid;
      
      // Enhanced state names
      const getStateName = (state) => {
        switch(state) {
          case -1: return 'UNSTARTED';
          case 0: return 'ENDED';
          case 1: return 'PLAYING';
          case 2: return 'PAUSED';
          case 3: return 'BUFFERING';
          case 5: return 'CUED';
          default: return `UNKNOWN(${state})`;
        }
      };
      
      return {
        healthy,
        time: timeValid ? time : 'INVALID',
        state: stateValid ? state : 'INVALID',
        stateName: stateValid ? getStateName(state) : 'INVALID',
        duration: durationValid ? dur : 'INVALID',
        reason: healthy ? 'All methods working' : 'Method calls failing'
      };
    } catch (error) {
      return { healthy: false, reason: `Error: ${error.message}` };
    }
  }, []);

  // Force play with user interaction
  const forcePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    
    try {
      console.log('🚀 FORCE PLAY triggered');
      forcePlayRef.current = true;
      
      // Multiple play attempts
      player.playVideo();
      
      // Backup play attempt after short delay
      setTimeout(() => {
        if (playerRef.current && forcePlayRef.current) {
          console.log('🔄 Backup play attempt');
          playerRef.current.playVideo();
        }
      }, 100);
      
      // Final attempt
      setTimeout(() => {
        if (playerRef.current && forcePlayRef.current) {
          const health = checkPlayerHealth();
          console.log('🔍 Final play check:', health);
          if (health.state === 5 || health.state === 2) { // CUED or PAUSED
            console.log('🎯 Video still not playing, final attempt');
            playerRef.current.playVideo();
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Force play failed:', error);
    }
  }, [checkPlayerHealth]);

  // Enhanced time tracking with state management
  const startTimeTracking = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('🚀 Starting enhanced time tracking...');
    
    intervalRef.current = setInterval(() => {
      const health = checkPlayerHealth();
      
      setDebugInfo(`Health: ${health.healthy ? '✅' : '❌'} | ${health.reason} | Time: ${health.time} | State: ${health.stateName || health.state}`);
      
      if (health.healthy) {
        const time = health.time;
        const state = health.state;
        const stateName = health.stateName;
        
        // Update React state
        setCurrentTime(time);
        
        // Handle different states
        if (state === 1) { // PLAYING
          setIsPlaying(true);
          forcePlayRef.current = false; // Clear force play flag
          
          // Update content context when playing with valid time
          if (time > 0) {
            updateContentContext(time);
          }
        } else if (state === 2) { // PAUSED
          setIsPlaying(false);
          // Still update content context for paused state if time is valid
          if (time > 0) {
            updateContentContext(time);
          }
        } else if (state === 5) { // CUED
          setIsPlaying(false);
          // Video is loaded but not playing - this is the issue!
          console.log('⚠️ Video is CUED but not playing');
        } else if (state === 3) { // BUFFERING
          // Keep current playing state during buffering
        } else {
          setIsPlaying(false);
        }
        
        console.log(`🕒 Tracking: ${time.toFixed(1)}s | State: ${stateName} | Playing: ${state === 1}`);
      } else {
        console.warn('⚠️ Player unhealthy:', health.reason);
      }
    }, 1000);
    
    console.log('✅ Enhanced time tracking interval started');
  }, [checkPlayerHealth, updateContentContext]);

  // Enhanced player event handlers
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
    
    // Wait a moment for player to fully initialize
    setTimeout(() => {
      setPlayerReady(true);
      startTimeTracking();
      console.log('🚀 Player ready, tracking started');
      
      // Initial health check
      const health = checkPlayerHealth();
      console.log('🔍 Initial health check:', health);
    }, 500);
  }, [startTimeTracking, checkPlayerHealth]);

  const onPlayerStateChange = useCallback((event) => {
    const state = event.data;
    const stateName = {
      '-1': 'UNSTARTED',
      '0': 'ENDED', 
      '1': 'PLAYING',
      '2': 'PAUSED',
      '3': 'BUFFERING',
      '5': 'CUED'
    }[state] || `UNKNOWN(${state})`;
    
    console.log(`🎵 State changed: ${stateName} (${state})`);
    setLastStateChange(Date.now());
    
    if (state === 1) { // PLAYING
      setIsPlaying(true);
      forcePlayRef.current = false;
      console.log('▶️ Video is now PLAYING');
    } else if (state === 2) { // PAUSED
      setIsPlaying(false);
      console.log('⏸️ Video PAUSED');
    } else if (state === 0) { // ENDED
      setIsPlaying(false);
      console.log('🏁 Video ENDED');
    } else if (state === 5) { // CUED
      setIsPlaying(false);
      console.log('📼 Video CUED (loaded but not playing)');
      
      // If we recently tried to play, try again
      if (forcePlayRef.current) {
        console.log('🔄 Video cued but we want to play - retrying...');
        setTimeout(() => {
          if (playerRef.current && forcePlayRef.current) {
            playerRef.current.playVideo();
          }
        }, 200);
      }
    } else if (state === 3) { // BUFFERING
      console.log('⏳ Video BUFFERING');
    }
  }, []);

  // Initialize YouTube player with better config
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
    
    console.log('🎆 Creating YouTube player with enhanced config...');
    setDebugInfo('Creating YouTube player...');
    
    // Enhanced player configuration
    const player = new window.YT.Player(playerElementRef.current, {
      height: '390',
      width: '640',
      videoId: youtubeVideoId,
      playerVars: {
        // Enhanced parameters for better control
        autoplay: 0,          // Don't autoplay
        controls: 1,          // Show controls
        disablekb: 0,         // Enable keyboard
        enablejsapi: 1,       // Enable JS API
        modestbranding: 1,    // Modest branding
        playsinline: 1,       // Play inline on mobile
        rel: 0,               // No related videos
        start: 0,             // Start from beginning
        fs: 1,                // Allow fullscreen
        cc_load_policy: 0,    // Don't show captions by default
        iv_load_policy: 3,    // Hide annotations
        origin: window.location.origin  // Set origin for security
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (event) => {
          console.error('❌ YouTube player error:', event.data);
          const errorMessages = {
            2: 'Invalid video ID',
            5: 'HTML5 player error', 
            100: 'Video not found',
            101: 'Video not allowed in embedded players',
            150: 'Video not allowed in embedded players'
          };
          const errorMsg = errorMessages[event.data] || `Unknown error: ${event.data}`;
          setDebugInfo(`Player error: ${errorMsg}`);
        }
      }
    });
    
    console.log('📺 YouTube player created with enhanced config');
  }, [youtubeVideoId, onPlayerReady, onPlayerStateChange]);

  // Load YouTube API
  useEffect(() => {
    setDebugInfo('Loading YouTube API...');
    
    if (window.YT && window.YT.Player) {
      console.log('✅ YouTube API already available');
      initializePlayer();
    } else {
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

  // Enhanced manual controls
  const handlePlay = () => {
    console.log('🎮 Manual PLAY button clicked');
    forcePlay();
  };

  const handlePause = () => {
    console.log('🎮 Manual PAUSE button clicked');
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      forcePlayRef.current = false;
    }
  };

  const handleSeek = (seconds) => {
    console.log('🎮 Manual SEEK to', seconds);
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      updateContentContext(seconds);
      // If we seek while playing, ensure we stay playing
      setTimeout(() => {
        if (playerRef.current && isPlaying) {
          playerRef.current.playVideo();
        }
      }, 100);
    }
  };

  const handleHealthCheck = () => {
    const health = checkPlayerHealth();
    console.log('🔍 Manual health check:', health);
    
    const message = `Player Health: ${health.healthy ? 'GOOD' : 'BAD'}
${health.reason}
Time: ${health.time}
State: ${health.state} (${health.stateName || 'Unknown'})
Duration: ${health.duration}

${health.state === 5 ? 'NOTE: State 5 (CUED) means video is loaded but not playing.\nThis is likely due to YouTube autoplay restrictions.' : ''}`;
    
    alert(message);
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
        
        {/* Enhanced status overlay */}
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
        
        {/* Enhanced manual controls */}
        <div className="manual-controls">
          <button onClick={handlePlay}>🚀 Force Play</button>
          <button onClick={handlePause}>⏸️ Pause</button>
          <button onClick={() => handleSeek(0)}>⏮️ Start</button>
          <button onClick={() => handleSeek(currentTime + 30)}>⏭️ +30s</button>
          <button onClick={() => handleSeek(60)}>⏯️ Go to 1:00</button>
          <button onClick={handleHealthCheck}>🔍 Health Check</button>
          <button onClick={() => {
            const player = playerRef.current;
            if (player) {
              console.log('🔧 Manual seek and play test');
              player.seekTo(5, true);
              setTimeout(() => player.playVideo(), 200);
            }
          }}>
            🧪 Test Seek+Play
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