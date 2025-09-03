// VideoPlayer-working.js - Add back features without interference
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentContext, setContentContext] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting...');
  
  // Use refs to avoid re-renders that could interfere with player
  const intervalRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // SAFE content context updater - no interference with player
  const updateContentContext = useCallback(async (timestamp) => {
    // Prevent concurrent updates
    if (isUpdatingRef.current || !userId || timestamp <= 0) return;
    
    // Only update every 5 seconds to reduce API calls
    if (Math.abs(timestamp - lastUpdateTimeRef.current) < 5) return;
    
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = timestamp;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      
      console.log(`🔄 Safe content update for: ${Math.floor(timestamp)}s`);
      
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
        console.log('✅ Safe content context:', context.chunk?.topic);
        
        // Use callback to avoid state update interference
        setTimeout(() => {
          setContentContext(context);
          if (onContentContextChange) {
            onContentContextChange(context);
          }
        }, 0);
      }
    } catch (error) {
      console.error('❌ Safe content context error:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [youtubeVideoId, userId, onContentContextChange]);

  // SAFE time tracking - no player interference
  const startSafeTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('🚀 Starting SAFE time tracking...');
    
    intervalRef.current = setInterval(() => {
      // Access player safely
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
        
        // Update UI state without causing re-renders that interfere with player
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
        
        // Safe content context update
        if (state === 1 && time > 0) { // Only when playing with valid time
          updateContentContext(time);
        }
        
        console.log(`⏱️ Safe tracking: ${time.toFixed(1)}s | ${stateName}`);
        
      } catch (error) {
        setDebugInfo(`Tracking error: ${error.message}`);
        console.warn('Safe tracking error:', error);
      }
    }, 2000); // Longer interval to reduce interference
    
    console.log('✅ Safe time tracking started (2s interval)');
  }, [updateContentContext]);

  // Initialize YouTube player - SAME AS WORKING DIAGNOSTIC VERSION
  useEffect(() => {
    console.log('🎬 Initializing working YouTube player...');
    
    // Clean slate
    if (window.ytPlayer) {
      try {
        window.ytPlayer.destroy();
      } catch (e) {}
      window.ytPlayer = null;
    }

    if (window.ytPlayerInterval) {
      clearInterval(window.ytPlayerInterval);
      window.ytPlayerInterval = null;
    }
    
    // Load YouTube API
    if (!window.YT) {
      setDebugInfo('Loading YouTube API...');
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready');
        createWorkingPlayer();
      };
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    } else {
      createWorkingPlayer();
    }
    
    function createWorkingPlayer() {
      console.log('🎆 Creating working YouTube player...');
      
      try {
        window.ytPlayer = new window.YT.Player('youtube-player-working', {
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
              console.log('🎬 Working player ready!');
              setDebugInfo('Player ready!');
              
              // Start safe tracking after delay
              setTimeout(() => {
                startSafeTimeTracking();
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
              
              console.log(`🎵 Working player state: ${stateName}`);
              
              // Safe state updates
              setIsPlaying(event.data === 1);
              
              // Log current time safely
              if (window.ytPlayer) {
                try {
                  const currentTime = window.ytPlayer.getCurrentTime();
                  console.log(`⏰ Time at state ${stateName}: ${currentTime.toFixed(1)}s`);
                } catch (e) {
                  console.log('Could not get time during state change');
                }
              }
            },
            onError: (event) => {
              console.error('❌ Working player error:', event.data);
              setDebugInfo(`Player error: ${event.data}`);
            }
          }
        });
        
        console.log('📺 Working player created');
        
      } catch (error) {
        console.error('❌ Failed to create working player:', error);
        setDebugInfo(`Creation failed: ${error.message}`);
      }
    }
    
    // Cleanup
    return () => {
      console.log('🧹 Working player cleanup...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (window.ytPlayer) {
        try {
          window.ytPlayer.destroy();
        } catch (e) {}
        window.ytPlayer = null;
      }
    };
  }, [youtubeVideoId, startSafeTimeTracking]);

  // Manual controls - SAME AS WORKING VERSION
  const handlePlay = () => {
    console.log('🎮 PLAY clicked on working version');
    if (window.ytPlayer) {
      try {
        window.ytPlayer.playVideo();
        console.log('✅ Working playVideo() called');
      } catch (error) {
        console.error('❌ Working playVideo() failed:', error);
      }
    }
  };

  const handlePause = () => {
    console.log('🎮 PAUSE clicked on working version');
    if (window.ytPlayer) {
      window.ytPlayer.pauseVideo();
    }
  };

  const handleSeek = (seconds) => {
    console.log('🎮 SEEK to', seconds);
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
        <div id="youtube-player-working" style={{ width: '100%', height: '390px' }} />
        
        {/* Status overlay - non-interfering */}
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
            {debugInfo}
          </div>
        </div>
        
        {/* Working controls */}
        <div className="manual-controls">
          <button onClick={handlePlay}>▶️ PLAY</button>
          <button onClick={handlePause}>⏸️ PAUSE</button>
          <button onClick={() => handleSeek(0)}>⏮️ Start</button>
          <button onClick={() => handleSeek(30)}>⏯️ 0:30</button>
          <button onClick={() => handleSeek(60)}>⏯️ 1:00</button>
          <button onClick={() => handleSeek(120)}>⏯️ 2:00</button>
        </div>
      </div>
      
      {/* Content context display - safe */}
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