const express = require('express');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const Analytics = require('../models/Analytics');
const UserStats = require('../models/UserStats');
const RoomStats = require('../models/RoomStats');
const User = require('../models/User');
const LiveRoom = require('../models/LiveRoom');
const { Op } = require('sequelize');

const router = express.Router();

// 验证JWT中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 验证管理员权限中间件
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    next();
  });
};

// 记录统计数据
const recordAnalytics = async (type, userId = null, roomId = null, value = null, data = null) => {
  try {
    await Analytics.create({
      type,
      userId,
      roomId,
      value,
      data: data ? JSON.stringify(data) : null
    });
  } catch (error) {
    console.error('记录统计数据失败:', error);
  }
};

// 更新用户统计
const updateUserStats = async (userId, statField, increment = 1) => {
  try {
    const [userStats, created] = await UserStats.findOrCreate({
      where: { userId },
      defaults: { userId }
    });
    
    userStats[statField] += increment;
    userStats.lastActiveAt = new Date();
    await userStats.save();
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
};

// 更新房间统计
const updateRoomStats = async (roomId, statField, increment = 1) => {
  try {
    const [roomStats, created] = await RoomStats.findOrCreate({
      where: { roomId },
      defaults: { roomId }
    });
    
    roomStats[statField] += increment;
    await roomStats.save();
  } catch (error) {
    console.error('更新房间统计失败:', error);
  }
};

// 获取概览统计数据
router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 总用户数
    const totalUsers = await User.count();
    
    // 总房间数
    const totalRooms = await LiveRoom.count();
    
    // 今日新增用户
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });
    
    // 本周新增用户
    const newUsersWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: oneWeekAgo
        }
      }
    });
    
    // 活跃房间数
    const activeRooms = await LiveRoom.count({
      where: {
        isActive: true
      }
    });
    
    // 今日统计数据
    const todayStats = await Analytics.findAll({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      group: ['type']
    });
    
    // 构建响应数据
    const stats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek
      },
      rooms: {
        total: totalRooms,
        active: activeRooms
      },
      today: {}
    };
    
    // 处理今日统计数据
    todayStats.forEach(stat => {
      stats.today[stat.type] = parseInt(stat.get('count'));
    });
    
    res.json(stats);
  } catch (error) {
    console.error('获取概览统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户统计数据
router.get('/user-stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 验证权限
    if (parseInt(userId) !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: '无权限访问此用户数据' });
    }
    
    const userStats = await UserStats.findOne({
      where: { userId }
    });
    
    if (!userStats) {
      return res.status(404).json({ message: '用户统计数据不存在' });
    }
    
    res.json(userStats);
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取房间统计数据
router.get('/room-stats/:roomId', authenticateAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const roomStats = await RoomStats.findOne({
      where: { roomId },
      include: [{
        model: LiveRoom,
        attributes: ['title', 'userId']
      }]
    });
    
    if (!roomStats) {
      return res.status(404).json({ message: '房间统计数据不存在' });
    }
    
    res.json(roomStats);
  } catch (error) {
    console.error('获取房间统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取时间范围内的统计数据
router.get('/timeline', authenticateAdmin, async (req, res) => {
  try {
    const { start, end, type } = req.query;
    
    const whereClause = {};
    
    if (start && end) {
      whereClause.createdAt = {
        [Op.between]: [new Date(start), new Date(end)]
      };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const timelineData = await Analytics.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      group: ['date', 'type'],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    
    res.json(timelineData);
  } catch (error) {
    console.error('获取时间线统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门内容统计
router.get('/popular', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 获取热门房间（按观看人数）
    const popularRooms = await RoomStats.findAll({
      include: [{
        model: LiveRoom,
        attributes: ['title']
      }],
      order: [['totalViewers', 'DESC']],
      limit: parseInt(limit)
    });
    
    // 获取活跃用户（按总活动）
    const activeUsers = await UserStats.findAll({
      include: [{
        model: User,
        attributes: ['username']
      }],
      order: [
        ['totalStreamingMinutes', 'DESC'],
        ['totalViewingMinutes', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      popularRooms,
      activeUsers
    });
  } catch (error) {
    console.error('获取热门内容统计失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取收入统计
router.get('/revenue', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateGroup;
    switch (period) {
      case 'day':
        dateGroup = 'DATE(createdAt)';
        break;
      case 'week':
        dateGroup = 'YEARWEEK(createdAt)';
        break;
      case 'month':
      default:
        dateGroup = 'DATE_FORMAT(createdAt, \'%Y-%m\')';
    }
    
    // 获取收入统计数据
    const revenueData = await Analytics.findAll({
      where: {
        type: 'gift_sent'
      },
      attributes: [
        [sequelize.fn(dateGroup, sequelize.col('createdAt')), 'period'],
        [sequelize.fn('SUM', sequelize.col('value')), 'totalRevenue']
      ],
      group: [sequelize.fn(dateGroup, sequelize.col('createdAt'))],
      order: [[sequelize.fn(dateGroup, sequelize.col('createdAt')), 'ASC']]
    });
    
    // 获取总收入
    const totalRevenue = await Analytics.sum('value', {
      where: {
        type: 'gift_sent'
      }
    });
    
    res.json({
      revenueData,
      totalRevenue: totalRevenue || 0
    });
  } catch (error) {
    console.error('获取收入统计失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = {
  router,
  recordAnalytics,
  updateUserStats,
  updateRoomStats
};