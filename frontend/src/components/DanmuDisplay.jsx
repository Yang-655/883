import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './DanmuDisplay.css';

const DanmuDisplay = ({ roomId }) => {
  const [danmus, setDanmus] = useState([]);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const danmuIdCounter = useRef(0);

  useEffect(() => {
    if (!roomId) return;

    // 初始化Socket连接
    socketRef.current = io('http://localhost:3000');
    
    // 加入房间
    socketRef.current.emit('join-room', roomId, 'viewer');
    
    // 监听新弹幕
    socketRef.current.on('new-danmu', (danmu) => {
      addDanmuToDisplay(danmu);
    });
    
    // 监听删除弹幕
    socketRef.current.on('delete-danmu', (data) => {
      removeDanmuFromDisplay(data.id);
    });
    
    // 清理函数
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', roomId, 'viewer');
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // 添加弹幕到显示区域
  const addDanmuToDisplay = (danmu) => {
    const danmuId = `danmu-${Date.now()}-${danmuIdCounter.current++}`;
    
    // 创建弹幕对象
    const danmuObj = {
      id: danmuId,
      ...danmu
    };
    
    // 添加到状态中
    setDanmus(prev => [...prev, danmuObj]);
    
    // 5秒后自动移除
    setTimeout(() => {
      removeDanmuFromDisplay(danmuId);
    }, 5000);
  };

  // 从显示区域移除弹幕
  const removeDanmuFromDisplay = (id) => {
    setDanmus(prev => prev.filter(danmu => danmu.id !== id));
  };

  // 获取弹幕样式
  const getDanmuStyle = (danmu) => {
    const baseStyle = {
      color: danmu.color,
      fontSize: `${danmu.fontSize}px`,
      fontFamily: danmu.fontFamily,
      backgroundColor: danmu.backgroundColor !== 'transparent' ? danmu.backgroundColor : 'rgba(0, 0, 0, 0.7)',
      border: danmu.borderColor !== 'transparent' ? `2px solid ${danmu.borderColor}` : 'none',
      padding: '4px 12px',
      borderRadius: '20px'
    };

    // 根据大小调整
    switch (danmu.size) {
      case 'small':
        baseStyle.fontSize = `${danmu.fontSize * 0.8}px`;
        break;
      case 'large':
        baseStyle.fontSize = `${danmu.fontSize * 1.2}px`;
        break;
      default:
        break;
    }

    // 根据位置调整
    switch (danmu.position) {
      case 'top':
        return {
          ...baseStyle,
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'none'
        };
      case 'bottom':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'none'
        };
      case 'scroll':
      default:
        return {
          ...baseStyle,
          position: 'absolute',
          top: `${getRandomTopPosition()}%`,
          whiteSpace: 'nowrap',
          animation: `danmuScroll 8s linear forwards`
        };
    }
  };

  // 获取随机顶部位置（用于滚动弹幕）
  const getRandomTopPosition = () => {
    return 10 + Math.random() * 70; // 10% 到 80% 之间
  };

  // 获取弹幕类名
  const getDanmuClassName = (danmu) => {
    let className = 'danmu-item';
    
    if (danmu.isVip) {
      className += ' vip-danmu';
    }
    
    if (danmu.position === 'top' || danmu.position === 'bottom') {
      className += ' fixed-danmu';
    }
    
    return className;
  };

  return (
    <div ref={containerRef} className="danmu-container">
      {danmus.map(danmu => (
        <div
          key={danmu.id}
          className={getDanmuClassName(danmu)}
          style={getDanmuStyle(danmu)}
        >
          {danmu.isVip && <span className="vip-badge">VIP</span>}
          <span className="username">{danmu.username}:</span>
          <span className="content">{danmu.content}</span>
        </div>
      ))}
    </div>
  );
};

export default DanmuDisplay;