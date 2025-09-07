const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const sequelize = require('../config/database');
const Recording = require('../models/Recording');
const User = require('../models/User');
const LiveRoom = require('../models/LiveRoom');
const { recordAnalytics, updateRoomStats } = require('./analytics');
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

// 获取用户的录制列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }
    
    const recordings = await Recording.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: LiveRoom,
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      recordings: recordings.rows,
      total: recordings.count,
      page: parseInt(page),
      totalPages: Math.ceil(recordings.count / parseInt(limit))
    });
  } catch (error) {
    console.error('获取录制列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取公开的录制列表
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const recordings = await Recording.findAndCountAll({
      where: { 
        isPublic: true,
        status: 'completed'
      },
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: LiveRoom,
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      recordings: recordings.rows,
      total: recordings.count,
      page: parseInt(page),
      totalPages: Math.ceil(recordings.count / parseInt(limit))
    });
  } catch (error) {
    console.error('获取公开录制列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个录制详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recording = await Recording.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: LiveRoom,
          attributes: ['title']
        }
      ]
    });
    
    if (!recording) {
      return res.status(404).json({ message: '录制不存在' });
    }
    
    // 如果不是公开录制，需要验证权限
    if (!recording.isPublic && recording.userId !== req.user?.userId) {
      return res.status(403).json({ message: '无权限访问此录制' });
    }
    
    // 增加观看次数
    recording.views += 1;
    await recording.save();
    
    res.json(recording);
  } catch (error) {
    console.error('获取录制详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新录制信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    const recording = await Recording.findByPk(id);
    
    if (!recording) {
      return res.status(404).json({ message: '录制不存在' });
    }
    
    // 验证权限
    if (recording.userId !== userId) {
      return res.status(403).json({ message: '无权限修改此录制' });
    }
    
    // 更新信息
    recording.title = title || recording.title;
    recording.description = description || recording.description;
    recording.isPublic = typeof isPublic !== 'undefined' ? isPublic : recording.isPublic;
    
    await recording.save();
    
    res.json({
      message: '录制信息更新成功',
      recording
    });
  } catch (error) {
    console.error('更新录制信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除录制
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const recording = await Recording.findByPk(id);
    
    if (!recording) {
      return res.status(404).json({ message: '录制不存在' });
    }
    
    // 验证权限
    if (recording.userId !== userId) {
      return res.status(403).json({ message: '无权限删除此录制' });
    }
    
    // 删除录制文件
    if (recording.filePath) {
      try {
        await fs.unlink(path.join(__dirname, '..', recording.filePath));
      } catch (error) {
        console.error('删除录制文件失败:', error);
      }
    }
    
    // 删除数据库记录
    await recording.destroy();
    
    // 记录统计
    await recordAnalytics('recording_deleted', userId, recording.roomId);
    
    res.json({ message: '录制删除成功' });
  } catch (error) {
    console.error('删除录制错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
