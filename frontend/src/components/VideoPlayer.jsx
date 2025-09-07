import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import Hls from 'hls.js';
import io from 'socket.io-client';
import GiftAnimation from './GiftAnimation';
import DanmuSender from './DanmuSender';
import DanmuDisplay from './DanmuDisplay';
import './VideoPlayer.css';

const VideoPlayer = ({ room, user, onBack }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const socketRef = useRef(null);
  const [giftCallback, setGiftCallback] = useState(null);

  useEffect(() => {
    if (!room) return;

    // 初始化Socket连接
    const initSocket = () => {
      socketRef.current = io('http://localhost:3000');
      
      // 加入房间
      socketRef.current.emit('join-room', room.id, 'viewer');
      
      // 设置礼物接收回调
      setGiftCallback((callback) => {
        socketRef.current.on('receive-gift', (data) => {
          if (callback) callback(data);
        });
        return callback;
      });
    };

    // 初始化视频播放器
    const initPlayer = () => {
      const videoElement = videoRef.current;
      
      // 优先使用HTTP-FLV
      if (flvjs.isSupported()) {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: `http://localhost:8080/live/${room.streamKey}.flv`
        });
        
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvPlayer.play().catch(error => {
          console.error('播放失败:', error);
        });
        
        playerRef.current = flvPlayer;
      } 
      // fallback到HLS
      else if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(`http://localhost:8080/live/${room.streamKey}.m3u8`);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(error => {
            console.error('播放失败:', error);
          });
        });
        
        playerRef.current = hls;
      } 
      // 原生HLS支持
      else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = `http://localhost:8080/live/${room.streamKey}.m3u8`;
        videoElement.addEventListener('loadedmetadata', () => {
          videoElement.play().catch(error => {
            console.error('播放失败:', error);
          });
        });
      }
    };

    initSocket();
    initPlayer();

    return () => {
      // 清理Socket连接
      if (socketRef.current) {
        socketRef.current.emit('leave-room', room.id, 'viewer');
        socketRef.current.disconnect();
      }
      
      // 清理视频播放器
      if (playerRef.current) {
        if (playerRef.current.destroy) {
          playerRef.current.destroy();
        } else if (playerRef.current instanceof Hls) {
          playerRef.current.destroy();
        }
      }
    };
  }, [room]);

  const handleSendDanmu = (danmu) => {
    // 这里可以添加发送弹幕后的处理逻辑
    console.log('弹幕已发送:', danmu);
  };

  return (
    <div className="video-player-container">
      <div className="video-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>{room?.title}</h2>
      </div>
      <div className="video-wrapper">
        <video 
          ref={videoRef} 
          className="video-element"
          controls 
          autoPlay
          playsInline
        />
        {/* 弹幕显示 */}
        <DanmuDisplay roomId={room?.id} />
      </div>
      <div className="viewer-count">
        观看人数: {room?.viewerCount || 0}
      </div>
      
      {/* 礼物动画 */}
      <GiftAnimation onGiftReceived={giftCallback} />
      
      {/* 弹幕发送 */}
      {user && (
        <DanmuSender 
          room={room} 
          user={user} 
          onSendDanmu={handleSendDanmu} 
        />
      )}
    </div>
  );
};

export default VideoPlayer;