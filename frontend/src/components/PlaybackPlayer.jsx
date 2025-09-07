import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './PlaybackPlayer.css';

const PlaybackPlayer = ({ recordingId, onBack }) => {
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchRecording();
  }, [recordingId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [recording]);

  const fetchRecording = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/recordings/${recordingId}`);
      setRecording(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取录制信息失败:', error);
      setError('获取录制信息失败：' + (error.response?.data?.message || '未知错误'));
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('播放失败:', error);
      });
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.playback-player');
    if (!videoContainer) return;

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="playback-player loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="playback-player error">
        <div className="error-content">
          <h3>播放错误</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-button">返回</button>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="playback-player error">
        <div className="error-content">
          <h3>录制不存在</h3>
          <button onClick={onBack} className="back-button">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="playback-player">
      <div className="player-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>{recording.title}</h2>
      </div>
      
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          controls={false}
          poster={recording.thumbnail ? `/recordings/${recording.thumbnail}` : ''}
        >
          <source src={`/api/recordings/${recordingId}/play`} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>
        
        <div className="video-controls">
          <div className="progress-bar" onClick={handleSeek}>
            <div 
              className="progress-filled" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <div className="control-buttons">
            <button onClick={togglePlay} className="play-pause-button">
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
            
            <button onClick={toggleFullscreen} className="fullscreen-button">
              {isFullscreen ? '缩小' : '全屏'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="recording-info">
        <div className="info-row">
          <span className="label">描述:</span>
          <span className="value">{recording.description || '无描述'}</span>
        </div>
        <div className="info-row">
          <span className="label">观看次数:</span>
          <span className="value">{recording.views} 次</span>
        </div>
        <div className="info-row">
          <span className="label">上传时间:</span>
          <span className="value">{new Date(recording.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaybackPlayer;