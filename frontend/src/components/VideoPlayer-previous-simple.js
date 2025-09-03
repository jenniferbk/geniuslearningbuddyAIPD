// VideoPlayer-simple.js - Back to basics YouTube player that actually works
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
  
  // Don't use refs - store player globally for debugging
  const intervalRef = useRef(null);

  // Simple content context updater
  const updateContentContext = useCallback(async (timestamp) => {
    if (!userId || timestamp <= 0) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      
      console.log(`🔄 Fetching content for: ${Math.floor(timestamp)}s`);
      
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
        console.log('✅ Content context:', context.chunk?.topic);
        setContentContext(context);
        if (onContentContextChange) {
          onContentContextChange(context);
        }
      }
    } catch (error) {
      console.error('❌ Content context error:', error);
    }
  }, [youtubeVideoId, userId, onContentContextChange]);

  // Simple time tracking that just polls the global player
  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('🚀 Starting simple time tracking...');
    
    intervalRef.current = setInterval(() => {
      // Access the player directly from global window
      const player = window.ytPlayer;
      
      if (!player) {
        setDebugInfo('❌ No global player found');
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
        
        setDebugInfo(`Time: ${time.toFixed(1)}s | State: ${stateName} | Valid: ${typeof time === 'number' && typeof state === 'number'}`);
        
        if (typeof time === 'number' && !isNaN(time)) {
          setCurrentTime(time);
          setIsPlaying(state === 1);
          
          // Update content context
          if (time > 0) {
            updateContentContext(time);
          }
        }
        
        console.log(`⏱️ ${time.toFixed(1)}s | ${stateName}`);
        
      } catch (error) {
        setDebugInfo(`❌ Player error: ${error.message}`);
        console.error('Player access error:', error);
      }
    }, 1000);
  }, [updateContentContext]);

  // Initialize YouTube player - SUPER SIMPLE
  useEffect(() => {
    console.log('🎬 Initializing YouTube player...');
    
    // Clear any existing player
    if (window.ytPlayer) {
      try {
        window.ytPlayer.destroy();
      } catch (e) {}
      window.ytPlayer = null;
    }
    
    // Load YouTube API if needed
    if (!window.YT) {
      setDebugInfo('Loading YouTube API...');
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready');
        createPlayer();
      };
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    } else {
      createPlayer();
    }
    
    function createPlayer() {
      setDebugInfo('Creating player...');
      console.log('🎆 Creating YouTube player...');
      
      // Create player and store globally for easy access
      window.ytPlayer = new window.YT.Player('youtube-player-simple', {
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
            console.log('🎬 Player ready!');
            setDebugInfo('Player ready!');
            
            // Test the player immediately
            try {
              const testTime = event.target.getCurrentTime();
              const testState = event.target.getPlayerState();
              console.log('✅ Player test successful:', { testTime, testState });
              
              // Start tracking after short delay
              setTimeout(startTimeTracking, 1000);
              
            } catch (error) {
              console.error('❌ Player test failed:', error);
              setDebugInfo(`Player test failed: ${error.message}`);
            }
          },
          onStateChange: (event) => {
            const stateName = {
              '-1': 'UNSTARTED',
              '0': 'ENDED',
              '1': 'PLAYING',
              '2': 'PAUSED', 
              '3': 'BUFFERING',
              '5': 'CUED'
            }[event.data] || 'UNKNOWN';
            
            console.log(`🎵 State: ${stateName} (${event.data})`);
            setIsPlaying(event.data === 1);
          },
          onError: (event) => {
            console.error('❌ YouTube error:', event.data);
            setDebugInfo(`YouTube error: ${event.data}`);
          }
        }
      });
      
      console.log('📺 Player created and stored as window.ytPlayer');
    }
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (window.ytPlayer) {
        try {
          window.ytPlayer.destroy();
        } catch (e) {}
        window.ytPlayer = null;
      }
    };
  }, [youtubeVideoId, startTimeTracking]);

  // Simple manual controls that directly access global player
  const handlePlay = () => {
    console.log('🎮 PLAY clicked');
    if (window.ytPlayer) {
      try {
        window.ytPlayer.playVideo();
        console.log('✅ playVideo() called successfully');
      } catch (error) {
        console.error('❌ playVideo() failed:', error);
      }
    } else {
      console.error('❌ No ytPlayer found');
    }
  };

  const handlePause = () => {
    console.log('🎮 PAUSE clicked');
    if (window.ytPlayer) {
      window.ytPlayer.pauseVideo();
    }
  };

  const handleSeek = (seconds) => {
    console.log('🎮 SEEK to', seconds);
    if (window.ytPlayer) {
      window.ytPlayer.seekTo(seconds, true);
    }
  };

  const handleDebug = () => {
    if (window.ytPlayer) {
      try {
        const time = window.ytPlayer.getCurrentTime();
        const state = window.ytPlayer.getPlayerState();
        const duration = window.ytPlayer.getDuration();
        
        const info = `PLAYER DEBUG:
Time: ${time}
State: ${state}
Duration: ${duration}
Type: ${typeof window.ytPlayer}
Methods: ${Object.getOwnPropertyNames(window.ytPlayer).slice(0, 10).join(', ')}...`;
        
        console.log('🔍 DEBUG INFO:', { time, state, duration, player: window.ytPlayer });
        alert(info);
      } catch (error) {
        alert(`Debug failed: ${error.message}`);
      }
    } else {
      alert('No ytPlayer found in window object');
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
        {/* Simple YouTube player div */}
        <div id="youtube-player-simple" style={{ width: '100%', height: '390px' }} />
        
        {/* Status display */}
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
          <div className="debug-info" style={{ fontSize: '10px', marginTop: '4px' }}>
            {debugInfo}
          </div>
        </div>
        
        {/* Simple controls */}
        <div className="manual-controls">
          <button onClick={handlePlay}>▶️ PLAY</button>
          <button onClick={handlePause}>⏸️ PAUSE</button>
          <button onClick={() => handleSeek(0)}>⏮️ 0:00</button>
          <button onClick={() => handleSeek(30)}>⏯️ 0:30</button>
          <button onClick={() => handleSeek(60)}>⏯️ 1:00</button>
          <button onClick={handleDebug}>🔍 DEBUG</button>
          <button onClick={() => {
            console.log('🧪 Testing global player access...');
            console.log('window.ytPlayer:', window.ytPlayer);
            if (window.ytPlayer) {
              console.log('Methods available:', Object.getOwnPropertyNames(window.ytPlayer).filter(name => typeof window.ytPlayer[name] === 'function'));
            }
          }}>
            🧪 TEST
          </button>
        </div>
      </div>
      
      {/* Content display */}
      {contentContext && (
        <div className="content-context">
          <h4>{contentContext.chunk?.topic}</h4>
          <p>{contentContext.chunk?.content?.substring(0, 150)}...</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;