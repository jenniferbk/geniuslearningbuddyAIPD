// VideoPlayer.js - Fixed version with proper interval handling
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
  const trackingActiveRef = useRef(false); // Track if interval is active

  // Update content context
  const updateContentContext = useCallback(async (timestamp) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('🔍 Token debugging:', {
        hasAuthToken: !!localStorage.getItem('authToken'),
        hasToken: !!localStorage.getItem('token'),
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        localStorageKeys: Object.keys(localStorage),
        currentURL: window.location.href
      });
      
      console.log('🔍 Attempting content context update:', {
        timestamp: Math.floor(timestamp),
        videoId: youtubeVideoId,
        originalVideoId: videoId,
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
          videoId: youtubeVideoId,
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

  // Fixed time tracking function
  const startTimeTracking = useCallback(() => {
    console.log('🔍 DEBUG: startTimeTracking called');
    
    // Clear any existing interval
    if (intervalRef.current) {
      console.log('🔍 Clearing existing interval:', intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      trackingActiveRef.current = false;
    }
    
    const player = playerRef.current;
    if (!player) {
      console.warn('⚠️ No player available for time tracking');
      return;
    }

    // Check if methods exist
    const hasGetCurrentTime = typeof player.getCurrentTime === 'function';
    const hasGetPlayerState = typeof player.getPlayerState === 'function';
    
    console.log('🔍 Player method check:', {
      hasGetCurrentTime,
      hasGetPlayerState,
      playerType: typeof player
    });

    if (!hasGetCurrentTime || !hasGetPlayerState) {
      console.error('❌ Player methods not available');
      return;
    }

    // Test the methods immediately
    try {
      const testTime = player.getCurrentTime();
      const testState = player.getPlayerState();
      console.log('✅ Method test successful:', { testTime, testState });
    } catch (error) {
      console.error('❌ Method test failed:', error);
      return;
    }

    // Create a simple interval that directly polls the player
    console.log('🚀 Creating time tracking interval...');
    
    const trackingFunction = () => {
      try {
        if (!playerRef.current) {
          console.warn('⚠️ Player lost during interval');
          clearInterval(intervalRef.current);
          trackingActiveRef.current = false;
          return;
        }

        const time = playerRef.current.getCurrentTime();
        const state = playerRef.current.getPlayerState();
        
        console.log('🕒 INTERVAL TICK - Time tracking data:', {
          time: time,
          state: state,
          stateName: state === 1 ? 'PLAYING' : state === 2 ? 'PAUSED' : state === 0 ? 'ENDED' : 'OTHER',
          trackingActive: trackingActiveRef.current
        });
        
        // Update React state
        setCurrentTime(prevTime => {
          console.log(`⏱️ Updating time: ${prevTime} -> ${time}`);
          return time;
        });
        
        setIsPlaying(state === 1);
        
        // Update content context for both playing AND paused states
        if ((state === 1 || state === 2) && time > 0) {
          console.log(`✅ Video is ${state === 1 ? 'playing' : 'paused'}, updating content context...`);
          updateContentContext(time);
        }
      } catch (error) {
        console.error('❌ Error in tracking interval:', error);
        // Don't clear interval on error, try again next tick
      }
    };

    // Run once immediately
    trackingFunction();
    
    // Set up the interval
    intervalRef.current = setInterval(trackingFunction, 1000);
    trackingActiveRef.current = true;
    
    console.log('✅ Time tracking interval created:', {
      intervalId: intervalRef.current,
      isActive: trackingActiveRef.current
    });
  }, [updateContentContext]);

  const onPlayerReady = useCallback((event) => {
    console.log('🎬 YouTube player ready');
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);
    
    // Store the player reference
    playerRef.current = event.target;
    console.log('✅ Player stored in ref');
    
    // Test methods immediately
    try {
      const time = event.target.getCurrentTime();
      const state = event.target.getPlayerState();
      console.log('🧪 Player ready test:', { time, state });
    } catch (error) {
      console.error('❌ Player ready test failed:', error);
    }
    
    // Start tracking with a small delay to ensure player is fully initialized
    setTimeout(() => {
      console.log('⏰ Starting time tracking after player ready...');
      startTimeTracking();
    }, 100);
  }, [startTimeTracking]);

  const onPlayerStateChange = useCallback((event) => {
    const playerState = event.data;
    console.log('🎵 Video state changed:', {
      state: playerState,
      stateName: playerState === 1 ? 'PLAYING' : playerState === 2 ? 'PAUSED' : playerState === 0 ? 'ENDED' : 'OTHER',
      trackingActive: trackingActiveRef.current
    });
    
    if (playerState === 1) { // Playing
      setIsPlaying(true);
      console.log('▶️ Video is now PLAYING');
      
      // Ensure tracking is running when video plays
      if (!trackingActiveRef.current && playerRef.current) {
        console.log('🔄 Starting tracking on PLAYING state...');
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
    
    console.log('📺 Created YouTube player object');
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
        trackingActiveRef.current = false;
      }
    };
  }, [initializePlayer]);

  // Initialize player when API is ready
  useEffect(() => {
    if (apiReady && !playerRef.current) {
      initializePlayer();
    }
  }, [apiReady, initializePlayer]);

  // Aggressive fallback - try every second until tracking works
  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      if (!trackingActiveRef.current && playerRef.current) {
        console.log('🚑 FALLBACK: Attempting to start tracking...');
        
        try {
          const time = playerRef.current.getCurrentTime();
          const state = playerRef.current.getPlayerState();
          
          if (typeof time === 'number' && typeof state === 'number') {
            console.log('🚑 FALLBACK: Player methods work, starting tracking');
            startTimeTracking();
            clearInterval(fallbackInterval);
          }
        } catch (error) {
          console.log('🚑 FALLBACK: Not ready yet');
        }
      } else if (trackingActiveRef.current) {
        // Tracking is active, stop fallback
        clearInterval(fallbackInterval);
      }
    }, 1000);
    
    // Clean up after 10 seconds
    setTimeout(() => clearInterval(fallbackInterval), 10000);
    
    return () => clearInterval(fallbackInterval);
  }, [startTimeTracking]);

  const jumpToTimestamp = useCallback((timestamp) => {
    const player = playerRef.current;
    if (!player) {
      console.warn('⚠️ No player available for timestamp jump');
      return;
    }

    try {
      player.seekTo(timestamp, true);
      setCurrentTime(timestamp);
      updateContentContext(timestamp);
      console.log('✅ Successfully jumped to timestamp:', timestamp);
    } catch (error) {
      console.error('❌ Failed to jump to timestamp:', error);
    }
  }, [updateContentContext]);

  useEffect(() => {
    window.videoPlayerActions = { 
      jumpToTimestamp,
      getCurrentContext: () => {
        if (playerRef.current) {
          const time = playerRef.current.getCurrentTime();
          console.log('🎯 Manual context request for timestamp:', time);
          updateContentContext(time);
          return { timestamp: time, context: contentContext };
        }
        return null;
      }
    };
  }, [jumpToTimestamp, updateContentContext, contentContext]);

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
