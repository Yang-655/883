import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomList.css';

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveRooms();
    // 每10秒刷新一次直播间列表
    const interval = setInterval(fetchActiveRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveRooms = async () => {
    try {
      const response = await axios.get('/api/rooms/active');
      setRooms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取直播间列表失败:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="room-list">
      <h2>正在直播</h2>
      {rooms.length === 0 ? (
        <div className="no-rooms">暂无正在直播的房间</div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div 
              key={room.id} 
              className="room-card"
              onClick={() => onSelectRoom(room)}
            >
              <div className="room-thumbnail">
                <div className="live-badge">直播中</div>
              </div>
              <div className="room-info">
                <h3>{room.title}</h3>
                <p className="streamer-name">主播: {room.User?.username}</p>
                <div className="room-stats">
                  <span>观众: {room.viewerCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;