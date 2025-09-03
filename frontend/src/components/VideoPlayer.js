// VideoPlayer-stable.js - Prevent parent re-renders from destroying player
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './VideoPlayer.css';

const VideoPlayer = memo(({ 
  youtubeVideoId = "p09yRj47kNM",
  videoId, 
  userId, 
  onContentContextChange,
  onProgressUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentContext, setContentContext] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting...');
  
  // Use refs to avoid re-renders
  const intervalRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const onContentContextChangeRef = useRef(onContentContextChange);

  // Update the callback ref when prop changes (but don't trigger re-render)
  useEffect(() => {
    onContentContextChangeRef.current = onContentContextChange;
  }, [onContentContextChange]);

  // STABLE content context updater - no parent re-renders
  const updateContentContext = useCallback(async (timestamp) => {
    // Extract user ID from token if not provided as prop
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          actualUserId = payload.userId;
        }
      } catch (e) {
        console.warn('Failed to extract user ID from token:', e);
      }
    }
    
    if (isUpdatingRef.current || !actualUserId || timestamp <= 0) return;
    
    // Only update every 5 seconds to reduce API calls
    if (Math.abs(timestamp - lastUpdateTimeRef.current) < 5) return;
    
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = timestamp;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      
      console.log(`🔄 STABLE content update for: ${Math.floor(timestamp)}s, userId: ${actualUserId}`);
      
      const response = await fetch('/api/content/video-context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: youtubeVideoId,
          timestamp: Math.floor(timestamp),
          userId: actualUserId
        })
      });
      
      if (response.ok) {
        const context = await response.json();
        console.log('✅ STABLE content context:', context.chunk?.topic);
        
        // Store context locally without triggering parent re-render
        setContentContext(context);
        
        // Call parent callback with a delay and using ref to avoid re-mount
        setTimeout(() => {
          if (onContentContextChangeRef.current) {
            console.log('🔄 Calling parent callback with context...');
            onContentContextChangeRef.current(context);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ STABLE content context error:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [youtubeVideoId]); // Extract userId from token, so no dependency needed

  // STABLE time tracking
  const startStableTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('🚀 Starting STABLE time tracking...');
    
    intervalRef.current = setInterval(() => {
      const player = window.ytPlayer;
      if (!player) {
        setDebugInfo('No player available');
        return;
      }
      
      try {
        const time = player.getCurrentTime();
        const state = player.getPlayerState();
        
        const stateName = {
          '-1': 'UNSTARTED',
          '0': 'ENDED',
          '1': 'PLAYING',
          '2': 'PAUSED', 
          '3': 'BUFFERING',
          '5': 'CUED'
        }[state] || 'UNKNOWN';
        
        setDebugInfo(`${time.toFixed(1)}s | ${stateName}`);
        
        // Only update React state if values actually changed
        const newTime = Number(time.toFixed(1));
        const newIsPlaying = state === 1;
        
        setCurrentTime(prevTime => {
          if (Math.abs(prevTime - newTime) > 0.5) {
            return newTime;
          }
          return prevTime;
        });
        
        setIsPlaying(prevPlaying => {
          if (prevPlaying !== newIsPlaying) {
            return newIsPlaying;
          }
          return prevPlaying;
        });
        
        // STABLE content context update - won't cause re-mount
        if (state === 1 && time > 0) {
          updateContentContext(time);
        }
        
        console.log(`⏱️ STABLE tracking: ${time.toFixed(1)}s | ${stateName}`);
        
      } catch (error) {
        setDebugInfo(`Tracking error: ${error.message}`);
        console.warn('STABLE tracking error:', error);
      }
    }, 3000); // Even longer interval for stability
    
    console.log('✅ STABLE time tracking started (3s interval)');
  }, [updateContentContext]);

  // Initialize YouTube player - STABLE VERSION
  useEffect(() => {
    console.log('🎬 Initializing STABLE YouTube player...');
    
    // Only initialize if we don't have a working player
    if (window.ytPlayer) {
      console.log('✅ Player already exists, starting tracking only');
      setTimeout(() => {
        startStableTimeTracking();
      }, 1000);
      return;
    }
    
    // Clean any remnants
    if (window.ytPlayerInterval) {
      clearInterval(window.ytPlayerInterval);
      window.ytPlayerInterval = null;
    }
    
    // Load YouTube API
    if (!window.YT) {
      setDebugInfo('Loading YouTube API...');
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready for STABLE player');
        createStablePlayer();
      };
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    } else {
      createStablePlayer();
    }
    
    function createStablePlayer() {
      console.log('🎆 Creating STABLE YouTube player...');
      
      try {
        window.ytPlayer = new window.YT.Player('youtube-player-stable', {
          height: '390',
          width: '640', 
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              console.log('🎬 STABLE player ready!');
              setDebugInfo('STABLE player ready!');
              
              // Start tracking after delay
              setTimeout(() => {
                startStableTimeTracking();
              }, 2000);
            },
            onStateChange: (event) => {
              const stateNames = {
                '-1': 'UNSTARTED',
                '0': 'ENDED',
                '1': 'PLAYING',
                '2': 'PAUSED', 
                '3': 'BUFFERING',
                '5': 'CUED'
              };
              const stateName = stateNames[event.data] || `UNKNOWN(${event.data})`;
              
              console.log(`🎵 STABLE player state: ${stateName}`);
              setIsPlaying(event.data === 1);
            },
            onError: (event) => {
              console.error('❌ STABLE player error:', event.data);
              setDebugInfo(`STABLE player error: ${event.data}`);
            }
          }
        });
        
        console.log('📺 STABLE player created');
        
      } catch (error) {
        console.error('❌ Failed to create STABLE player:', error);
        setDebugInfo(`STABLE creation failed: ${error.message}`);
      }
    }
    
    // MINIMAL cleanup - don't destroy player unless really necessary
    return () => {
      console.log('🧹 STABLE player cleanup (minimal)...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // DON'T destroy the player on every unmount - only on real cleanup
    };
  }, [youtubeVideoId, startStableTimeTracking]);

  // Manual controls
  const handlePlay = () => {
    console.log('🎮 STABLE PLAY clicked');
    if (window.ytPlayer) {
      try {
        window.ytPlayer.playVideo();
        console.log('✅ STABLE playVideo() called');
      } catch (error) {
        console.error('❌ STABLE playVideo() failed:', error);
      }
    }
  };

  const handlePause = () => {
    console.log('🎮 STABLE PAUSE clicked');
    if (window.ytPlayer) {
      window.ytPlayer.pauseVideo();
    }
  };

  const handleSeek = (seconds) => {
    console.log('🎮 STABLE SEEK to', seconds);
    if (window.ytPlayer) {
      window.ytPlayer.seekTo(seconds, true);
      // Update context for new timestamp
      setTimeout(() => updateContentContext(seconds), 500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {/* YouTube player */}
        <div id="youtube-player-stable" style={{ width: '100%', height: '390px' }} />
        
        {/* Status overlay */}
        <div className="status-overlay">
          <div className="player-status">
            <span className={`play-indicator ${isPlaying ? 'playing' : 'paused'}`}>
              {isPlaying ? '▶️' : '⏸️'} {formatTime(currentTime)}
            </span>
            
            {contentContext?.chunk?.topic && (
              <span className="current-topic">
                📍 {contentContext.chunk.topic}
              </span>
            )}
          </div>
          
          <div className="debug-info">
            STABLE: {debugInfo}
          </div>
        </div>
        
        {/* Controls */}
        <div className="manual-controls">
          <button onClick={handlePlay}>▶️ PLAY</button>
          <button onClick={handlePause}>⏸️ PAUSE</button>
          <button onClick={() => handleSeek(0)}>⏮️ Start</button>
          <button onClick={() => handleSeek(30)}>⏯️ 0:30</button>
          <button onClick={() => handleSeek(60)}>⏯️ 1:00</button>
          <button onClick={() => handleSeek(120)}>⏯️ 2:00</button>
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
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;