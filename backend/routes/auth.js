const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { recordAnalytics, updateUserStats } = require('./analytics');
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

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, isStreamer } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        email: email
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户已存在' });
    }
    
    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isStreamer: isStreamer || false
    });
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 记录注册统计
    await recordAnalytics('user_registration', user.id);
    
    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isStreamer: user.isStreamer,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({
      where: {
        email: email
      }
    });
    
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: '密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 记录登录统计
    await recordAnalytics('user_login', user.id);
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isStreamer: user.isStreamer,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { username, isStreamer } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新用户信息
    user.username = username || user.username;
    user.isStreamer = typeof isStreamer !== 'undefined' ? isStreamer : user.isStreamer;
    
    await user.save();
    
    // 移除密码字段
    const { password, ...userInfo } = user.toJSON();
    
    res.json({ 
      message: '用户信息更新成功',
      user: userInfo
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;