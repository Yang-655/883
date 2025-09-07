import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ user, onBack }) => {
  const [overviewData, setOverviewData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [popularData, setPopularData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 获取概览数据
      const overviewResponse = await axios.get('/api/analytics/overview');
      setOverviewData(overviewResponse.data);
      
      // 获取时间线数据
      const endDate = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1d':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const timelineResponse = await axios.get(`/api/analytics/timeline?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      setTimelineData(timelineResponse.data);
      
      // 获取热门内容数据
      const popularResponse = await axios.get('/api/analytics/popular');
      setPopularData(popularResponse.data);
      
      // 获取收入数据
      const revenueResponse = await axios.get('/api/analytics/revenue');
      setRevenueData(revenueResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setLoading(false);
    }
  };

  // 格式化时间线数据用于图表
  const formatTimelineData = () => {
    if (!timelineData || timelineData.length === 0) return [];
    
    // 按日期分组数据
    const groupedData = {};
    
    timelineData.forEach(item => {
      const date = item.date;
      const type = item.type;
      const count = parseInt(item.count);
      
      if (!groupedData[date]) {
        groupedData[date] = { date };
      }
      
      groupedData[date][type] = count;
    });
    
    return Object.values(groupedData);
  };

  // 准备饼图数据
  const preparePieData = () => {
    if (!overviewData) return [];
    
    const data = [
      { name: '用户总数', value: overviewData.users?.total || 0 },
      { name: '房间总数', value: overviewData.rooms?.total || 0 },
      { name: '活跃房间', value: overviewData.rooms?.active || 0 }
    ];
    
    return data.filter(item => item.value > 0);
  };

  // 颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div className="analytics-dashboard loading">加载中...</div>;
  }

  if (!overviewData) {
    return (
      <div className="analytics-dashboard error">
        <p>无法加载统计数据</p>
        <button onClick={fetchAllData}>重试</button>
      </div>
    );
  }

  const timelineChartData = formatTimelineData();
  const pieChartData = preparePieData();

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>数据仪表板</h2>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1d">最近1天</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="overview-cards">
        <div className="card">
          <h3>用户统计</h3>
          <div className="card-content">
            <div className="stat-item">
              <span className="label">总用户数:</span>
              <span className="value">{overviewData.users?.total || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">今日新增:</span>
              <span className="value">{overviewData.users?.newToday || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">本周新增:</span>
              <span className="value">{overviewData.users?.newThisWeek || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>房间统计</h3>
          <div className="card-content">
            <div className="stat-item">
              <span className="label">总房间数:</span>
              <span className="value">{overviewData.rooms?.total || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">活跃房间:</span>
              <span className="value">{overviewData.rooms?.active || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>今日活动</h3>
          <div className="card-content">
            <div className="stat-item">
              <span className="label">新房间:</span>
              <span className="value">{overviewData.today?.room_created || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">开始直播:</span>
              <span className="value">{overviewData.today?.room_started || 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">发送弹幕:</span>
              <span className="value">{overviewData.today?.danmu_sent || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>活动趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="room_started" 
                name="开始直播" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="viewer_joined" 
                name="观众加入" 
                stroke="#82ca9d" 
              />
              <Line 
                type="monotone" 
                dataKey="chat_message" 
                name="聊天消息" 
                stroke="#ffc658" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>数据概览</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 热门内容 */}
      {popularData && (
        <div className="popular-content">
          <div className="section">
            <h3>热门房间</h3>
            <div className="popular-list">
              {popularData.popularRooms?.slice(0, 5).map((roomStat, index) => (
                <div key={roomStat.id} className="popular-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{roomStat.LiveRoom?.title || '未知房间'}</span>
                  <span className="value">{roomStat.totalViewers} 观众</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>活跃用户</h3>
            <div className="popular-list">
              {popularData.activeUsers?.slice(0, 5).map((userStat, index) => (
                <div key={userStat.id} className="popular-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{userStat.User?.username || '未知用户'}</span>
                  <span className="value">
                    {userStat.totalStreamingMinutes + userStat.totalViewingMinutes} 分钟
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 收入统计 */}
      {revenueData && (
        <div className="revenue-section">
          <h3>收入统计</h3>
          <div className="revenue-content">
            <div className="revenue-total">
              <h4>总收入: ¥{revenueData.totalRevenue || 0}</h4>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData.revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`¥${value}`, '收入']}
                    labelFormatter={(label) => `周期: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" name="收入" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;