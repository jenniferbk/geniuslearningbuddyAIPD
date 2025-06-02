// VideoPlayer-diagnostic.js - Ultra-minimal with complete logging to find interference
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  youtubeVideoId = "p09yRj47kNM",
  videoId, 
  userId, 
  onContentContextChange,
  onProgressUpdate 
}) => {
  const [debugLog, setDebugLog] = useState(['Starting diagnostic player...']);
  const logRef = useRef([]);
  
  // Enhanced logging function
  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(`🔍 DIAGNOSTIC: ${logMessage}`);
    
    logRef.current = [...logRef.current.slice(-20), logMessage]; // Keep last 20 logs
    setDebugLog([...logRef.current]);
  }, []);

  // Initialize YouTube player with ZERO automation
  useEffect(() => {
    addLog('🎬 Starting YouTube player initialization...');
    
    // Completely clean slate
    if (window.ytPlayer) {
      addLog('🗑️ Destroying existing player...');
      try {
        window.ytPlayer.destroy();
      } catch (e) {
        addLog(`⚠️ Could not destroy existing player: ${e.message}`);
      }
      window.ytPlayer = null;
    }

    // Clear any existing intervals or timeouts
    if (window.ytPlayerInterval) {
      clearInterval(window.ytPlayerInterval);
      window.ytPlayerInterval = null;
      addLog('🗑️ Cleared existing interval');
    }
    
    // Load YouTube API if needed
    if (!window.YT) {
      addLog('📥 Loading YouTube API...');
      
      window.onYouTubeIframeAPIReady = () => {
        addLog('✅ YouTube API ready, creating player...');
        createPlayer();
      };
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
        addLog('📄 YouTube API script added to page');
      }
    } else {
      addLog('✅ YouTube API already available, creating player...');
      createPlayer();
    }
    
    function createPlayer() {
      addLog('🎆 Creating YouTube player with minimal config...');
      
      try {
        // Create player with MINIMAL events
        window.ytPlayer = new window.YT.Player('youtube-player-diagnostic', {
          height: '390',
          width: '640', 
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 0,    // NO autoplay
            controls: 1,    // Show controls
            enablejsapi: 1  // Enable API
          },
          events: {
            onReady: (event) => {
              addLog('🎬 onReady event fired');
              
              // Test basic functionality
              try {
                const testTime = event.target.getCurrentTime();
                const testState = event.target.getPlayerState();
                addLog(`✅ Basic test: time=${testTime}, state=${testState}`);
                
                // Store duration
                const duration = event.target.getDuration();
                addLog(`📏 Video duration: ${duration}s`);
                
              } catch (error) {
                addLog(`❌ Basic test failed: ${error.message}`);
              }
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
              
              addLog(`🎵 STATE CHANGE: ${stateName} (${event.data})`);
              
              // Log current time when state changes
              if (window.ytPlayer) {
                try {
                  const currentTime = window.ytPlayer.getCurrentTime();
                  addLog(`⏰ Time at state change: ${currentTime.toFixed(1)}s`);
                } catch (e) {
                  addLog(`⚠️ Could not get time during state change: ${e.message}`);
                }
              }
            },
            onError: (event) => {
              addLog(`❌ YouTube error: ${event.data}`);
            }
          }
        });
        
        addLog('📺 Player object created and stored as window.ytPlayer');
        
        // Log the player object details
        setTimeout(() => {
          if (window.ytPlayer) {
            addLog(`🔍 Player object type: ${typeof window.ytPlayer}`);
            addLog(`🔍 Player methods available: ${Object.getOwnPropertyNames(window.ytPlayer).filter(name => typeof window.ytPlayer[name] === 'function').length}`);
          }
        }, 1000);
        
      } catch (error) {
        addLog(`❌ Failed to create player: ${error.message}`);
      }
    }
    
    // Cleanup function
    return () => {
      addLog('🧹 Component cleanup...');
      if (window.ytPlayerInterval) {
        clearInterval(window.ytPlayerInterval);
        window.ytPlayerInterval = null;
      }
      if (window.ytPlayer) {
        try {
          window.ytPlayer.destroy();
        } catch (e) {
          addLog(`⚠️ Cleanup destroy failed: ${e.message}`);
        }
        window.ytPlayer = null;
      }
    };
  }, [youtubeVideoId, addLog]);

  // Manual controls with detailed logging
  const handlePlay = () => {
    addLog('🎮 PLAY button clicked by user');
    
    if (!window.ytPlayer) {
      addLog('❌ No ytPlayer available');
      return;
    }
    
    try {
      addLog('🚀 Calling playVideo()...');
      window.ytPlayer.playVideo();
      addLog('✅ playVideo() call completed');
      
      // Log state immediately after
      setTimeout(() => {
        try {
          const time = window.ytPlayer.getCurrentTime();
          const state = window.ytPlayer.getPlayerState();
          addLog(`📊 Post-play state: time=${time.toFixed(1)}s, state=${state}`);
        } catch (e) {
          addLog(`⚠️ Could not get post-play state: ${e.message}`);
        }
      }, 100);
      
      // Log state after 1 second
      setTimeout(() => {
        try {
          const time = window.ytPlayer.getCurrentTime();
          const state = window.ytPlayer.getPlayerState();
          addLog(`📊 1-second later: time=${time.toFixed(1)}s, state=${state}`);
        } catch (e) {
          addLog(`⚠️ Could not get 1s-later state: ${e.message}`);
        }
      }, 1000);
      
    } catch (error) {
      addLog(`❌ playVideo() failed: ${error.message}`);
    }
  };

  const handlePause = () => {
    addLog('🎮 PAUSE button clicked by user');
    if (window.ytPlayer) {
      try {
        window.ytPlayer.pauseVideo();
        addLog('✅ pauseVideo() called');
      } catch (error) {
        addLog(`❌ pauseVideo() failed: ${error.message}`);
      }
    }
  };

  const handleSeek = (seconds) => {
    addLog(`🎮 SEEK button clicked: seeking to ${seconds}s`);
    if (window.ytPlayer) {
      try {
        window.ytPlayer.seekTo(seconds, true);
        addLog(`✅ seekTo(${seconds}) called`);
      } catch (error) {
        addLog(`❌ seekTo() failed: ${error.message}`);
      }
    }
  };

  const handleCurrentState = () => {
    addLog('🔍 Current state check requested by user');
    if (window.ytPlayer) {
      try {
        const time = window.ytPlayer.getCurrentTime();
        const state = window.ytPlayer.getPlayerState();
        const duration = window.ytPlayer.getDuration();
        addLog(`📊 CURRENT STATE: time=${time.toFixed(1)}s, state=${state}, duration=${duration}s`);
      } catch (error) {
        addLog(`❌ State check failed: ${error.message}`);
      }
    } else {
      addLog('❌ No ytPlayer available for state check');
    }
  };

  // NO automatic time tracking or content context updates
  // We want to see if the issue is caused by our automation

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {/* YouTube player div */}
        <div id="youtube-player-diagnostic" style={{ width: '100%', height: '390px', border: '2px solid #4CAF50' }} />
        
        {/* Simple controls */}
        <div className="manual-controls">
          <button onClick={handlePlay} style={{backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px', margin: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            ▶️ PLAY
          </button>
          <button onClick={handlePause} style={{backgroundColor: '#FF9800', color: 'white', padding: '8px 16px', margin: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            ⏸️ PAUSE
          </button>
          <button onClick={() => handleSeek(0)} style={{backgroundColor: '#2196F3', color: 'white', padding: '8px 16px', margin: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            ⏮️ 0:00
          </button>
          <button onClick={() => handleSeek(30)} style={{backgroundColor: '#2196F3', color: 'white', padding: '8px 16px', margin: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            ⏯️ 0:30
          </button>
          <button onClick={handleCurrentState} style={{backgroundColor: '#9C27B0', color: 'white', padding: '8px 16px', margin: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            🔍 CHECK STATE
          </button>
        </div>
      </div>
      
      {/* Live debug log */}
      <div style={{ 
        background: '#1a1a1a', 
        color: '#00ff00', 
        padding: '12px', 
        marginTop: '8px', 
        borderRadius: '4px', 
        fontFamily: 'Monaco, monospace', 
        fontSize: '11px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>🔍 DIAGNOSTIC LOG (Live Updates):</div>
        {debugLog.map((log, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;