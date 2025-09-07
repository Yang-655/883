const express = require('express');
const jwt = require('jsonwebtoken');
const LiveRoom = require('../models/LiveRoom');
const User = require('../models/User');
const { recordAnalytics, updateUserStats, updateRoomStats } = require('./analytics');
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

// 创建直播间
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // 生成流密钥
    const streamKey = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    
    // 创建直播间
    const room = await LiveRoom.create({
      title,
      description,
      streamKey,
      userId: req.user.userId
    });
    
    // 记录房间创建统计
    await recordAnalytics('room_created', req.user.userId, room.id);
    // 更新用户统计
    await updateUserStats(req.user.userId, 'totalRoomsCreated');
    
    res.status(201).json({
      message: '直播间创建成功',
      room
    });
  } catch (error) {
    console.error('创建直播间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有活跃直播间
router.get('/active', async (req, res) => {
  try {
    const rooms = await LiveRoom.findAll({
      where: {
        isActive: true
      },
      include: [{
        model: User,
        attributes: ['username', 'avatar']
      }]
    });
    
    res.json(rooms);
  } catch (error) {
    console.error('获取直播间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个直播间信息
router.get('/:id', async (req, res) => {
  try {
    const room = await LiveRoom.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['username', 'avatar']
      }]
    });
    
    if (!room) {
      return res.status(404).json({ message: '直播间不存在' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('获取直播间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 开始直播
router.put('/:id/start', authenticateToken, async (req, res) => {
  try {
    const room = await LiveRoom.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '直播间不存在' });
    }
    
    // 验证用户权限
    if (room.userId !== req.user.userId) {
      return res.status(403).json({ message: '无权限操作此直播间' });
    }
    
    // 更新直播间状态
    room.isActive = true;
    await room.save();
    
    // 记录直播开始统计
    await recordAnalytics('room_started', req.user.userId, room.id);
    // 更新房间统计
    await updateRoomStats(room.id, 'startedAt', Date.now());
    
    res.json({
      message: '直播开始',
      room
    });
  } catch (error) {
    console.error('开始直播错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 结束直播
router.put('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const room = await LiveRoom.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '直播间不存在' });
    }
    
    // 验证用户权限
    if (room.userId !== req.user.userId) {
      return res.status(403).json({ message: '无权限操作此直播间' });
    }
    
    // 更新直播间状态
    room.isActive = false;
    room.viewerCount = 0;
    await room.save();
    
    // 记录直播结束统计
    await recordAnalytics('room_stopped', req.user.userId, room.id);
    // 更新房间统计
    await updateRoomStats(room.id, 'endedAt', Date.now());
    
    res.json({
      message: '直播结束',
      room
    });
  } catch (error) {
    console.error('结束直播错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;