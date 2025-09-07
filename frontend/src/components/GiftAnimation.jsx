import React, { useState, useEffect } from 'react';
import './GiftAnimation.css';

const GiftAnimation = ({ onGiftReceived }) => {
  const [animations, setAnimations] = useState([]);

  // 监听礼物接收事件
  useEffect(() => {
    if (onGiftReceived) {
      const handleGiftReceived = (data) => {
        // 添加新的动画到队列
        const newAnimation = {
          id: Date.now() + Math.random(),
          gift: data.gift,
          username: data.username,
          type: getGiftType(data.gift)
        };
        
        setAnimations(prev => [...prev, newAnimation]);
        
        // 5秒后移除动画
        setTimeout(() => {
          setAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
        }, 5000);
      };
      
      onGiftReceived(handleGiftReceived);
      
      // 清理函数
      return () => {
        // 如果需要清理事件监听器，可以在这里处理
      };
    }
  }, [onGiftReceived]);

  // 根据礼物名称确定礼物类型和动画效果
  const getGiftType = (giftName) => {
    const giftTypes = {
      '小花': 'flower',
      '啤酒': 'beer',
      '火箭': 'rocket',
      '跑车': 'car',
      '游艇': 'yacht'
    };
    
    return giftTypes[giftName] || 'default';
  };

  return (
    <div className="gift-animations-container">
      {animations.map(animation => (
        <div 
          key={animation.id}
          className={`gift-animation ${animation.type}`}
        >
          <div className="gift-content">
            <div className="gift-icon">
              {getGiftIcon(animation.type)}
            </div>
            <div className="gift-info">
              <div className="username">{animation.username}</div>
              <div className="action">送出了</div>
              <div className="gift-name">{animation.gift}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 获取礼物图标
const getGiftIcon = (type) => {
  switch (type) {
    case 'flower':
      return <span className="emoji-icon">🌸</span>;
    case 'beer':
      return <span className="emoji-icon">🍺</span>;
    case 'rocket':
      return <span className="emoji-icon">🚀</span>;
    case 'car':
      return <span className="emoji-icon">🚗</span>;
    case 'yacht':
      return <span className="emoji-icon">🛥️</span>;
    default:
      return <span className="emoji-icon">🎁</span>;
  }
};

export default GiftAnimation;