import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './ChatRoom.css';

const ChatRoom = ({ room, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 连接Socket.IO服务器
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // 加入房间
    newSocket.emit('join-room', room.id, user?.id || 'anonymous');

    // 监听聊天消息
    newSocket.on('chat-message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: data.username,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    // 监听礼物消息
    newSocket.on('receive-gift', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: data.username,
        message: `送出了 ${data.gift}`,
        isGift: true,
        timestamp: new Date()
      }]);
    });

    // 监听观众数量更新
    newSocket.on('viewer-count', (count) => {
      // 这里可以更新观众数量显示
    });

    // 获取用户余额
    fetchUserBalance();

    // 清理函数
    return () => {
      newSocket.emit('leave-room', room.id, user?.id || 'anonymous');
      newSocket.disconnect();
    };
  }, [room.id, user]);

  useEffect(() => {
    // 滚动到最新消息
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get('/api/gifts/balance');
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error('获取用户余额失败:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('chat-message', {
      roomId: room.id,
      message: newMessage,
      username: user?.username || '匿名用户'
    });

    setNewMessage('');
  };

  const sendGift = async (giftId, giftName) => {
    if (!socket) return;

    try {
      const response = await axios.post('/api/gifts/send', {
        receiverId: room.userId, // 主播ID
        giftId: giftId,
        roomId: room.id,
        quantity: 1
      });

      // 发送礼物消息到聊天室
      socket.emit('send-gift', {
        roomId: room.id,
        gift: giftName,
        username: user?.username || '匿名用户'
      });

      // 更新用户余额
      setUserBalance(response.data.balance);
      
      // 关闭礼物商店
      setShowGiftShop(false);
    } catch (error) {
      console.error('发送礼物失败:', error);
      alert('发送礼物失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h3>聊天室</h3>
        <div className="chat-header-actions">
          <span className="user-balance">余额: {userBalance} 金币</span>
          <button 
            className="gift-button"
            onClick={() => setShowGiftShop(true)}
          >
            送礼物
          </button>
        </div>
      </div>
      
      {showGiftShop && (
        <div className="gift-shop-modal">
          <div className="gift-shop-content">
            <div className="gift-shop-header">
              <h3>选择礼物</h3>
              <button 
                className="close-button"
                onClick={() => setShowGiftShop(false)}
              >
                ×
              </button>
            </div>
            <GiftSelection onSendGift={sendGift} />
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.isGift ? 'gift-message' : ''}`}
          >
            <span className="username">{msg.username}:</span>
            <span className="message-content">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入消息..."
          className="chat-input"
        />
        <button type="submit" className="send-button">发送</button>
      </form>
    </div>
  );
};

// 礼物选择组件
const GiftSelection = ({ onSendGift }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      const response = await axios.get('/api/gifts');
      setGifts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取礼物列表失败:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  if (loading) {
    return <div className="gift-loading">加载中...</div>;
  }

  return (
    <div className="gifts-selection-grid">
      {gifts.map(gift => (
        <div 
          key={gift.id} 
          className="gift-selection-item"
          onClick={() => onSendGift(gift.id, gift.name)}
        >
          <div className="gift-icon">
            {gift.icon ? (
              <img src={`/gifts/${gift.icon}`} alt={gift.name} />
            ) : (
              <div className="gift-placeholder">🎁</div>
            )}
          </div>
          <div className="gift-info">
            <h4>{gift.name}</h4>
            <p className="gift-price">{formatPrice(gift.price)} 金币</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatRoom;