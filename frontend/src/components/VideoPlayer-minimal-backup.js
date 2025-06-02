// VideoPlayer.js - Ultra-minimal working version
import React, { useState, useRef, useEffect } from 'react';
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
  const playerRef = useRef(null);

  // Initialize YouTube player
  useEffect(() => {
    // Create player when API is ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const player = new window.YT.Player('youtube-player', {
          height: '350',
          width: '100%',
          videoId: youtubeVideoId,
          events: {
            onReady: (event) => {
              console.log('Player ready!');
              playerRef.current = event.target;
              
              // Start simple interval immediately
              setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                  try {
                    const time = playerRef.current.getCurrentTime();
                    const state = playerRef.current.getPlayerState();
                    setCurrentTime(time);
                    setIsPlaying(state === 1);
                    
                    // Update content context
                    if (state === 1 && onContentContextChange) {
                      const context = {
                        timestamp: time,
                        videoId: youtubeVideoId,
                        chunk: { topic: `Time: ${Math.floor(time)}s` }
                      };
                      onContentContextChange(context);
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }
              }, 500);
            }
          }
        });
      }
    };

    // Load YouTube API if needed
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, [youtubeVideoId, onContentContextChange]);

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
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
