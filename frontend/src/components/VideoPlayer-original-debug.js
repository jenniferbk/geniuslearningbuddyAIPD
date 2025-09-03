// VideoPlayer.js - Clean version with fixed React hooks
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
  const intervalRef = useRef(null);

  // Update content context - THIS IS KEY!
  const updateContentContext = useCallback(async (timestamp) => {
    try {
      // Enhanced token debugging - FIXED: Look for 'token' not 'token'
      const token = localStorage.getItem('token') || localStorage.getItem('token');
      console.log('🔍 Token debugging:', {
        hasAuthToken: !!localStorage.getItem('token'),
        hasToken: !!localStorage.getItem('token'),
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        localStorageKeys: Object.keys(localStorage),
        currentURL: window.location.href
      });
      
      console.log('🔍 Attempting content context update:', {
        timestamp: Math.floor(timestamp),
        videoId: youtubeVideoId, // Use YouTube video ID, not content item ID
        originalVideoId: videoId, // Keep for reference
        userId: userId,
        hasToken: !!token
      });
      
      if (!token) {
        console.warn('⚠️ No authentication token found');
        console.log('📊 localStorage debug:', {
          allKeys: Object.keys(localStorage),
          allValues: Object.keys(localStorage).map(key => ({ [key]: localStorage.getItem(key)?.substring(0, 30) + '...' }))
        });
        return;
      }
      
      if (!userId) {
        console.warn('⚠️ No userId provided to VideoPlayer');
        return;
      }
      
      const response = await fetch('/api/content/video-context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: youtubeVideoId, // Send YouTube video ID to backend
          timestamp: Math.floor(timestamp),
          userId
        })
      });
      
      console.log('🌐 API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const context = await response.json();
        console.log('🎯 Content context received:', context);
        setContentContext(context);
        
        console.log('🎯 Content context updated:', {
          timestamp: Math.floor(timestamp),
          topic: context.chunk?.topic
        });
        
        if (onContentContextChange) {
          onContentContextChange(context);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Content context API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }
    } catch (error) {
      console.error('❌ Error fetching content context:', error);
    }
  }, [youtubeVideoId, userId, onContentContextChange]);

  const updateProgress = useCallback(async () => {
    if (!playerRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('token');
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
          contentId: youtubeVideoId, // Use YouTube video ID consistently
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

  // YouTube API method availability checker with exponential backoff
  const waitForPlayerMethods = useCallback((player, maxAttempts = 20) => {
    console.log('🔍 DEBUG: waitForPlayerMethods called with player:', typeof player);
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        const hasGetCurrentTime = player && typeof player.getCurrentTime === 'function';
        const hasGetPlayerState = player && typeof player.getPlayerState === 'function';
        const hasSeekTo = player && typeof player.seekTo === 'function';
        
        console.log(`🔍 Method check attempt ${attempts + 1}/${maxAttempts}:`, {
          hasGetCurrentTime,
          hasGetPlayerState,
          hasSeekTo,
          playerType: typeof player,
          playerMethods: player ? Object.getOwnPropertyNames(player).slice(0, 15) : []
        });
        
        if (hasGetCurrentTime && hasGetPlayerState && hasSeekTo) {
          console.log('✅ All YouTube player methods are now available!');
          resolve(player);
        } else if (attempts++ < maxAttempts) {
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
          const delay = Math.min(50 * Math.pow(2, attempts), 1000);
          console.log(`⏳ Methods not ready, retrying in ${delay}ms...`);
          setTimeout(check, delay);
        } else {
          console.error('❌ Player methods not available after maximum attempts');
          console.log('🗒️ Final player state:', {
            playerType: typeof player,
            allMethods: player ? Object.getOwnPropertyNames(player) : [],
            prototype: player ? Object.getOwnPropertyNames(Object.getPrototypeOf(player)) : []
          });
          reject(new Error('YouTube player methods not available'));
        }
      };
      check();
    });
  }, []);

  const startTimeTracking = useCallback(async () => {
    console.log('🔍 DEBUG: startTimeTracking called');
    
    if (intervalRef.current) {
      console.log('🔍 Clearing existing interval:', intervalRef.current);
      clearInterval(intervalRef.current);
    }
    
    const player = playerRef.current;
    if (!player) {
      console.warn('⚠️ No player available for time tracking');
      return;
    }

    console.log('🔍 Player object found:', {
      playerType: typeof player,
      hasGetCurrentTime: typeof player.getCurrentTime,
      hasGetPlayerState: typeof player.getPlayerState,
      hasSeekTo: typeof player.seekTo
    });

    try {
      console.log('⏱️ Waiting for YouTube player methods to be ready...');
      await waitForPlayerMethods(player);
      console.log('✅ Player methods validated, starting time tracking interval');
      
      intervalRef.current = setInterval(() => {
        console.log('🕒 INTERVAL TICK - Time tracking running');
        try {
          const time = player.getCurrentTime();
          const state = player.getPlayerState();
          
          console.log('📊 Player data:', {
            time: time,
            state: state,
            stateName: state === 1 ? 'PLAYING' : state === 2 ? 'PAUSED' : state === 0 ? 'ENDED' : 'OTHER',
            willUpdateContext: state === 1
          });
          
          setCurrentTime(time);
          setIsPlaying(state === 1); // 1 = playing
          
          // Update content context every second while playing
          if (state === 1) {
            console.log('✅ Video is playing, calling updateContentContext...');
            updateContentContext(time);
          }
        } catch (error) {
          console.error('❌ Error getting player time:', error);
          // Clear interval on persistent errors
          clearInterval(intervalRef.current);
        }
      }, 1000);
      
      console.log('✅ Interval started successfully. IntervalId:', intervalRef.current);
    } catch (error) {
      console.error('❌ Failed to initialize time tracking:', error);
    }
  }, [updateContentContext, waitForPlayerMethods]);

  const onPlayerReady = useCallback((event) => {
    console.log('🎬 YouTube player ready');
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);
    
    console.log('📺 Player ready event - target:', event.target);
    console.log('🗓️ Video duration:', videoDuration);
    
    // IMPORTANT: Store the validated player from the event
    playerRef.current = event.target;
    console.log('✅ Updated playerRef with validated player from event');
    
    // Test the player methods immediately
    console.log('🧪 IMMEDIATE TEST - Player methods available?', {
      hasGetCurrentTime: typeof event.target.getCurrentTime === 'function',
      hasGetPlayerState: typeof event.target.getPlayerState === 'function',
      hasSeekTo: typeof event.target.seekTo === 'function',
      currentTimeResult: (() => {
        try {
          return event.target.getCurrentTime();
        } catch (e) {
          return 'ERROR: ' + e.message;
        }
      })()
    });
    
    // Start time tracking with method validation - no arbitrary delay needed
    console.log('⏰ Starting time tracking with method validation...');
    startTimeTracking();
  }, [startTimeTracking]);

  const onPlayerStateChange = useCallback((event) => {
    const playerState = event.data;
    console.log('🎵 Video state changed:', {
      state: playerState,
      stateName: playerState === 1 ? 'PLAYING' : playerState === 2 ? 'PAUSED' : playerState === 0 ? 'ENDED' : 'OTHER'
    });
    
    if (playerState === 1) { // Playing
      setIsPlaying(true);
      console.log('▶️ Video is now PLAYING - content awareness should start!');
      
      // CRITICAL: Test player methods when video starts playing
      const player = playerRef.current;
      if (player) {
        console.log('🧪 PLAYING STATE TEST - Player methods:', {
          hasGetCurrentTime: typeof player.getCurrentTime === 'function',
          hasGetPlayerState: typeof player.getPlayerState === 'function',
          currentTimeImmediate: (() => {
            try {
              return player.getCurrentTime();
            } catch (e) {
              return 'ERROR: ' + e.message;
            }
          })()
        });
      }
      
      // If time tracking isn't running yet, try to start it
      // This handles cases where onPlayerReady didn't successfully start tracking
      if (!intervalRef.current && playerRef.current) {
        console.log('🔄 Time tracking not active, attempting to start on PLAYING state...');
        startTimeTracking();
      }
    } else if (playerState === 2) { // Paused
      setIsPlaying(false);
      console.log('⏸️ Video PAUSED');
      updateProgress();
    } else if (playerState === 0) { // Ended
      setIsPlaying(false);
      console.log('🏁 Video ENDED');
      updateProgress();
    }
  }, [updateProgress, startTimeTracking]);

  const initializePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) {
      console.log('⚠️ YouTube API not ready yet');
      return;
    }

    console.log('🎆 Initializing YouTube player...');
    
    const ytPlayer = new window.YT.Player('youtube-player', {
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
    
    console.log('📺 Created YouTube player object:', ytPlayer);
    console.log('⚠️ Player will be stored in onPlayerReady event for proper initialization');
  }, [youtubeVideoId, onPlayerReady, onPlayerStateChange]);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onload = () => setApiReady(true);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initializePlayer]);

  // Initialize player when API is ready
  useEffect(() => {
    if (apiReady && !playerRef.current) {
      initializePlayer();
    }
  }, [apiReady, initializePlayer]);

  // FALLBACK: Force time tracking after 3 seconds if it's not working
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!intervalRef.current && playerRef.current) {
        console.log('🚑 FALLBACK: Force starting time tracking after 3 seconds');
        // Try immediate access to methods
        const player = playerRef.current;
        try {
          const time = player.getCurrentTime();
          const state = player.getPlayerState();
          console.log('🚑 FALLBACK TEST:', { time, state });
          
          // If we can get time, start tracking
          if (typeof time === 'number') {
            startTimeTracking();
          } else {
            console.log('🚑 FALLBACK: getCurrentTime not working, trying alternative...');
            // Alternative: Use a simple interval that attempts to call the method
            intervalRef.current = setInterval(() => {
              try {
                const currentTime = player.getCurrentTime();
                const playerState = player.getPlayerState();
                
                console.log('🔄 ALTERNATIVE tracking:', { currentTime, playerState });
                
                if (typeof currentTime === 'number' && currentTime > 0) {
                  setCurrentTime(currentTime);
                  setIsPlaying(playerState === 1);
                  
                  if (playerState === 1) {
                    updateContentContext(currentTime);
                  }
                }
              } catch (error) {
                console.error('🚑 Alternative tracking error:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('🚑 FALLBACK error:', error);
        }
      }
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, [startTimeTracking, updateContentContext]);

  const jumpToTimestamp = useCallback(async (timestamp) => {
    const player = playerRef.current;
    if (!player) {
      console.warn('⚠️ No player available for timestamp jump');
      return;
    }

    try {
      // Ensure methods are available before seeking
      await waitForPlayerMethods(player);
      player.seekTo(timestamp, true);
      setCurrentTime(timestamp);
      updateContentContext(timestamp);
      console.log('✅ Successfully jumped to timestamp:', timestamp);
    } catch (error) {
      console.error('❌ Failed to jump to timestamp:', error);
    }
  }, [updateContentContext, waitForPlayerMethods]);

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
        {/* YouTube Player Container */}
        <div id="youtube-player"></div>
        
        {/* Compact Status Overlay */}
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
