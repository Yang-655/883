const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const sequelize = require('./config/database');
const User = require('./models/User');
const LiveRoom = require('./models/LiveRoom');
const Gift = require('./models/Gift');
const UserCurrency = require('./models/UserCurrency');
const GiftTransaction = require('./models/GiftTransaction');
const Danmu = require('./models/Danmu');
const Recording = require('./models/Recording');
const Analytics = require('./models/Analytics');
const UserStats = require('./models/UserStats');
const RoomStats = require('./models/RoomStats');
const { Op } = require('sequelize');
require('dotenv').config();

// 路由
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const streamRoutes = require('./routes/streams');
const giftRoutes = require('./routes/gifts');
const danmuRoutes = require('./routes/danmus');
const recordingRoutes = require('./routes/recordings');
const { router: analyticsRoutes, recordAnalytics, updateUserStats, updateRoomStats } = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 使io对象可以在路由中访问
app.set('io', io);

// 使统计函数可以在其他模块中访问
app.set('recordAnalytics', recordAnalytics);
app.set('updateUserStats', updateUserStats);
app.set('updateRoomStats', updateRoomStats);

// 中间件
app.use(cors());
app.use(express.json());

// 数据库同步
sequelize.sync()
  .then(() => {
    console.log('数据库同步成功');
  })
  .catch((error) => {
    console.error('数据库同步失败:', error);
  });

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/danmus', danmuRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/analytics', analyticsRoutes);

// 简单的路由
app.get('/', (req, res) => {
  res.json({ message: '直播服务器运行中...' });
});

// 定期发送实时统计数据
setInterval(async () => {
  try {
    // 获取当前活跃房间数
    const activeRooms = await LiveRoom.count({ where: { isActive: true } });
    
    // 获取最近1分钟的统计数据
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const viewerCount = await Analytics.count({
      where: {
        type: 'viewer_joined',
        createdAt: { [Op.gte]: oneMinuteAgo }
      }
    });
    
    const chatCount = await Analytics.count({
      where: {
        type: 'chat_message',
        createdAt: { [Op.gte]: oneMinuteAgo }
      }
    });
    
    const giftCount = await Analytics.count({
      where: {
        type: 'gift_sent',
        createdAt: { [Op.gte]: oneMinuteAgo }
      }
    });
    
    // 向所有连接的客户端发送实时统计数据
    io.emit('realtime-stats', {
      viewers: viewerCount,
      chats: chatCount,
      gifts: giftCount,
      activeRooms: activeRooms,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('发送实时统计数据失败:', error);
  }
}, 5000); // 每5秒发送一次

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 用户加入直播间
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    // 更新观众数量
    LiveRoom.findByPk(roomId)
      .then(room => {
        if (room) {
          room.viewerCount += 1;
          room.save();
          io.to(roomId).emit('viewer-count', room.viewerCount);
          
          // 记录观众加入统计
          recordAnalytics('viewer_joined', userId, roomId);
          // 更新用户统计
          updateUserStats(userId, 'totalViewingMinutes');
          // 更新房间统计
          updateRoomStats(roomId, 'totalViewers');
        }
      });
    socket.to(roomId).emit('user-joined', userId);
    console.log(`用户 ${userId} 加入房间 ${roomId}`);
  });
  
  // 用户离开直播间
  socket.on('leave-room', (roomId, userId) => {
    socket.leave(roomId);
    // 更新观众数量
    LiveRoom.findByPk(roomId)
      .then(room => {
        if (room && room.viewerCount > 0) {
          room.viewerCount -= 1;
          room.save();
          io.to(roomId).emit('viewer-count', room.viewerCount);
          
          // 记录观众离开统计
          recordAnalytics('viewer_left', userId, roomId);
        }
      });
    socket.to(roomId).emit('user-left', userId);
    console.log(`用户 ${userId} 离开房间 ${roomId}`);
  });
  
  // 处理聊天消息
  socket.on('chat-message', async (data) => {
    const { roomId, message, username } = data;
    io.to(roomId).emit('chat-message', { message, username });
    
    // 记录聊天消息统计
    await recordAnalytics('chat_message', null, roomId);
    // 更新房间统计
    await updateRoomStats(roomId, 'totalChatMessages');
  });
  
  // 处理礼物发送
  socket.on('send-gift', async (data) => {
    const { roomId, gift, username } = data;
    io.to(roomId).emit('receive-gift', { gift, username });
    
    // 记录礼物发送统计
    await recordAnalytics('gift_sent', null, roomId);
    // 更新房间统计
    await updateRoomStats(roomId, 'totalGifts');
  });
  
  // 用户断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});