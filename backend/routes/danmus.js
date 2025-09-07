const express = require('express');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const Danmu = require('../models/Danmu');
const User = require('../models/User');
const LiveRoom = require('../models/LiveRoom');
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

// 发送弹幕
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, roomId, color, size, position, fontSize, fontFamily, backgroundColor, borderColor } = req.body;
    
    // 验证参数
    if (!content || !roomId) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 限制弹幕长度
    if (content.length > 500) {
      return res.status(400).json({ message: '弹幕内容过长' });
    }
    
    // 检查房间是否存在且正在直播
    const room = await LiveRoom.findByPk(roomId);
    if (!room || !room.isActive) {
      return res.status(400).json({ message: '直播间不存在或未开始直播' });
    }
    
    // 检查用户是否为主播或VIP用户
    const user = await User.findByPk(userId);
    const isVip = user.isVip || userId === room.userId;
    
    // 创建弹幕
    const danmu = await Danmu.create({
      content,
      userId,
      roomId,
      color: color || '#ffffff',
      size: size || 'medium',
      position: position || 'scroll',
      fontSize: fontSize || 16,
      fontFamily: fontFamily || 'Arial',
      backgroundColor: backgroundColor || 'transparent',
      borderColor: borderColor || 'transparent',
      isVip
    });
    
    // 关联用户信息
    danmu.User = user;
    
    // 通过Socket.IO广播弹幕到直播间
    req.app.get('io').to(roomId).emit('new-danmu', {
      id: danmu.id,
      content: danmu.content,
      userId: danmu.userId,
      username: user.username,
      color: danmu.color,
      size: danmu.size,
      position: danmu.position,
      fontSize: danmu.fontSize,
      fontFamily: danmu.fontFamily,
      backgroundColor: danmu.backgroundColor,
      borderColor: danmu.borderColor,
      isVip: danmu.isVip,
      createdAt: danmu.createdAt
    });
    
    res.status(201).json({
      message: '弹幕发送成功',
      danmu
    });
  } catch (error) {
    console.error('发送弹幕错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取历史弹幕
router.get('/history/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // 检查房间是否存在
    const room = await LiveRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: '直播间不存在' });
    }
    
    const danmus = await Danmu.findAndCountAll({
      where: { roomId },
      include: [
        {
          model: User,
          attributes: ['username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(danmus);
  } catch (error) {
    console.error('获取弹幕历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取热门弹幕（按时间段统计）
router.get('/popular/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { hours = 1 } = req.query;
    
    // 计算时间范围
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // 查询热门弹幕
    const popularDanmus = await Danmu.findAll({
      where: {
        roomId,
        createdAt: {
          [sequelize.Op.gte]: since
        }
      },
      attributes: [
        'content',
        [sequelize.fn('COUNT', sequelize.col('content')), 'count']
      ],
      group: ['content'],
      order: [[sequelize.fn('COUNT', sequelize.col('content')), 'DESC']],
      limit: 10
    });
    
    res.json(popularDanmus);
  } catch (error) {
    console.error('获取热门弹幕错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除弹幕（仅限主播或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    // 查找弹幕
    const danmu = await Danmu.findByPk(id, {
      include: [LiveRoom]
    });
    
    if (!danmu) {
      return res.status(404).json({ message: '弹幕不存在' });
    }
    
    // 检查权限（仅主播或管理员可删除）
    const room = danmu.LiveRoom;
    if (userId !== room.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: '无权限删除此弹幕' });
    }
    
    // 删除弹幕
    await danmu.destroy();
    
    // 通知直播间删除弹幕
    req.app.get('io').to(room.id).emit('delete-danmu', { id });
    
    res.json({ message: '弹幕删除成功' });
  } catch (error) {
    console.error('删除弹幕错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 屏蔽用户（仅限主播）
router.post('/block-user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId, roomId, duration } = req.body; // duration in minutes
    
    // 检查参数
    if (!targetUserId || !roomId) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 检查房间是否存在且用户为主播
    const room = await LiveRoom.findByPk(roomId);
    if (!room || userId !== room.userId) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    // 检查目标用户是否存在
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: '目标用户不存在' });
    }
    
    // 这里可以实现用户屏蔽逻辑，例如在Redis中设置屏蔽列表
    // 为了简化，我们只发送一个通知
    
    // 通知直播间屏蔽用户
    req.app.get('io').to(roomId).emit('block-user', { 
      userId: targetUserId, 
      username: targetUser.username,
      duration: duration || 60 // 默认屏蔽1小时
    });
    
    res.json({ message: `用户 ${targetUser.username} 已被屏蔽` });
  } catch (error) {
    console.error('屏蔽用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;