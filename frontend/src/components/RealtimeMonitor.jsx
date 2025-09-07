import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';
import './RealtimeMonitor.css';

const RealtimeMonitor = ({ user, onBack }) => {
  const [realtimeData, setRealtimeData] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    viewers: 0,
    chats: 0,
    gifts: 0,
    activeRooms: 0
  });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const dataBufferRef = useRef([]);

  useEffect(() => {
    // 初始化Socket.IO连接
    socketRef.current = io('http://localhost:3000');
    
    // 连接成功
    socketRef.current.on('connect', () => {
      console.log('已连接到实时监控服务器');
    });
    
    // 监听实时统计数据
    socketRef.current.on('realtime-stats', (data) => {
      // 更新当前统计数据
      setCurrentStats(prev => ({
        viewers: data.viewers || prev.viewers,
        chats: data.chats || prev.chats,
        gifts: data.gifts || prev.gifts,
        activeRooms: data.activeRooms || prev.activeRooms
      }));
      
      // 添加到数据缓冲区
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        viewers: data.viewers || 0,
        chats: data.chats || 0,
        gifts: data.gifts || 0
      };
      
      dataBufferRef.current.push(newDataPoint);
      
      // 保持最近30个数据点
      if (dataBufferRef.current.length > 30) {
        dataBufferRef.current.shift();
      }
      
      // 更新图表数据
      setRealtimeData([...dataBufferRef.current]);
    });
    
    // 错误处理
    socketRef.current.on('connect_error', (error) => {
      console.error('实时监控连接错误:', error);
    });
    
    // 获取初始统计数据
    fetchInitialStats();
    
    // 清理函数
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchInitialStats = async () => {
    try {
      setLoading(true);
      // 获取初始统计数据
      const overviewResponse = await axios.get('/api/analytics/overview');
      const overview = overviewResponse.data;
      
      setCurrentStats({
        viewers: overview.rooms?.active || 0,
        chats: overview.today?.chat_message || 0,
        gifts: overview.today?.gift_sent || 0,
        activeRooms: overview.rooms?.active || 0
      });
      
      setLoading(false);
    } catch (error) {
      console.error('获取初始统计数据失败:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="realtime-monitor loading">加载中...</div>;
  }

  return (
    <div className="realtime-monitor">
      <div className="monitor-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>实时监控</h2>
        <div className="status-indicator">
          <span className={`status ${socketRef.current?.connected ? 'connected' : 'disconnected'}`}>
            {socketRef.current?.connected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      {/* 实时统计数据卡片 */}
      <div className="stats-cards">
        <div className="card">
          <h3>当前观众</h3>
          <div className="card-content">
            <span className="value">{currentStats.viewers}</span>
          </div>
        </div>

        <div className="card">
          <h3>聊天消息</h3>
          <div className="card-content">
            <span className="value">{currentStats.chats}</span>
          </div>
        </div>

        <div className="card">
          <h3>礼物发送</h3>
          <div className="card-content">
            <span className="value">{currentStats.gifts}</span>
          </div>
        </div>

        <div className="card">
          <h3>活跃房间</h3>
          <div className="card-content">
            <span className="value">{currentStats.activeRooms}</span>
          </div>
        </div>
      </div>

      {/* 实时图表 */}
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>实时观众趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="viewers" 
                name="观众数" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>实时活动统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="chats" name="聊天消息" fill="#82ca9d" />
              <Bar dataKey="gifts" name="礼物发送" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMonitor;