import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './StreamerPage.css';

const StreamerPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    fetchUserRooms();
  }, []);

  const fetchUserRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('获取直播间列表失败:', error);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/rooms', { title, description });
      setRooms([...rooms, response.data.room]);
      setShowCreateForm(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('创建直播间失败:', error);
    }
  };

  const startStream = async (roomId) => {
    try {
      // 启动直播间
      await axios.put(`/api/rooms/${roomId}/start`);
      
      // 获取推流地址
      const response = await axios.get(`/api/streams/${roomId}/stream-url`);
      setStreamUrl(response.data.rtmpUrl);
      setCurrentRoom(roomId);
      
      // 更新房间列表
      fetchUserRooms();
    } catch (error) {
      console.error('开始直播失败:', error);
    }
  };

  const stopStream = async (roomId) => {
    try {
      await axios.put(`/api/rooms/${roomId}/stop`);
      setCurrentRoom(null);
      setStreamUrl('');
      
      // 更新房间列表
      fetchUserRooms();
    } catch (error) {
      console.error('停止直播失败:', error);
    }
  };

  return (
    <div className="streamer-page">
      <div className="streamer-header">
        <h2>主播控制台</h2>
        <button 
          className="create-room-btn"
          onClick={() => setShowCreateForm(true)}
        >
          创建直播间
        </button>
      </div>

      {showCreateForm && (
        <div className="create-room-form">
          <h3>创建新直播间</h3>
          <form onSubmit={createRoom}>
            <div className="form-group">
              <label>直播标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>直播描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateForm(false)}>
                取消
              </button>
              <button type="submit">创建</button>
            </div>
          </form>
        </div>
      )}

      {streamUrl && (
        <div className="stream-info">
          <h3>推流信息</h3>
          <p>请在推流软件中使用以下地址推流:</p>
          <div className="stream-url">
            {streamUrl}
          </div>
          <button 
            className="stop-stream-btn"
            onClick={() => stopStream(currentRoom)}
          >
            结束直播
          </button>
        </div>
      )}

      <div className="rooms-list">
        <h3>我的直播间</h3>
        {rooms.length === 0 ? (
          <p>您还没有创建直播间</p>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <h4>{room.title}</h4>
                <p>{room.description}</p>
                <div className="room-status">
                  状态: {room.isActive ? '直播中' : '未开始'}
                </div>
                {!room.isActive ? (
                  <button 
                    className="start-stream-btn"
                    onClick={() => startStream(room.id)}
                  >
                    开始直播
                  </button>
                ) : (
                  <button 
                    className="stop-stream-btn"
                    onClick={() => stopStream(room.id)}
                  >
                    结束直播
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamerPage;