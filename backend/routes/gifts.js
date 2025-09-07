const express = require('express');
const jwt = require('jsonwebtoken');
const Gift = require('../models/Gift');
const UserCurrency = require('../models/UserCurrency');
const GiftTransaction = require('../models/GiftTransaction');
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

// 获取所有礼物
router.get('/', async (req, res) => {
  try {
    const gifts = await Gift.findAll({
      order: [['price', 'ASC']]
    });
    res.json(gifts);
  } catch (error) {
    console.error('获取礼物列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户虚拟货币余额
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 查找或创建用户货币记录
    let userCurrency = await UserCurrency.findOne({
      where: { userId }
    });
    
    if (!userCurrency) {
      userCurrency = await UserCurrency.create({ userId });
    }
    
    res.json({
      balance: userCurrency.balance,
      totalSpent: userCurrency.totalSpent,
      totalReceived: userCurrency.totalReceived
    });
  } catch (error) {
    console.error('获取用户余额错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 充值虚拟货币（演示用，实际应接入支付系统）
router.post('/recharge', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body; // amount为充值金额
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: '充值金额无效' });
    }
    
    // 查找或创建用户货币记录
    let userCurrency = await UserCurrency.findOne({
      where: { userId }
    });
    
    if (!userCurrency) {
      userCurrency = await UserCurrency.create({ 
        userId,
        balance: amount
      });
    } else {
      userCurrency.balance += amount;
      await userCurrency.save();
    }
    
    res.json({
      message: '充值成功',
      balance: userCurrency.balance
    });
  } catch (error) {
    console.error('充值错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送礼物
router.post('/send', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const senderId = req.user.userId;
    const { receiverId, giftId, roomId, quantity = 1, message } = req.body;
    
    // 验证参数
    if (!receiverId || !giftId || !roomId) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 检查不能给自己送礼物
    if (senderId === receiverId) {
      return res.status(400).json({ message: '不能给自己送礼物' });
    }
    
    // 获取礼物信息
    const gift = await Gift.findByPk(giftId, { transaction });
    if (!gift) {
      return res.status(404).json({ message: '礼物不存在' });
    }
    
    // 计算总价格
    const totalPrice = gift.price * quantity;
    
    // 检查发送者余额
    let senderCurrency = await UserCurrency.findOne({
      where: { userId: senderId },
      transaction
    });
    
    if (!senderCurrency || senderCurrency.balance < totalPrice) {
      return res.status(400).json({ message: '余额不足' });
    }
    
    // 更新发送者余额
    senderCurrency.balance -= totalPrice;
    senderCurrency.totalSpent += totalPrice;
    await senderCurrency.save({ transaction });
    
    // 更新接收者余额
    let receiverCurrency = await UserCurrency.findOne({
      where: { userId: receiverId },
      transaction
    });
    
    if (!receiverCurrency) {
      receiverCurrency = await UserCurrency.create({
        userId: receiverId,
        balance: 0,
        totalReceived: totalPrice
      }, { transaction });
    } else {
      receiverCurrency.totalReceived += totalPrice;
      await receiverCurrency.save({ transaction });
    }
    
    // 创建礼物交易记录
    const giftTransaction = await GiftTransaction.create({
      senderId,
      receiverId,
      giftId,
      roomId,
      quantity,
      totalPrice,
      message
    }, { transaction });
    
    // 提交事务
    await transaction.commit();
    
    // 返回成功响应
    res.status(201).json({
      message: '礼物发送成功',
      transaction: giftTransaction,
      balance: senderCurrency.balance
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('发送礼物错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取礼物交易记录
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;
    
    const transactions = await GiftTransaction.findAndCountAll({
      where: {
        [sequelize.Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['username', 'avatar'] },
        { model: Gift, attributes: ['name', 'icon'] },
        { model: LiveRoom, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建初始礼物数据（仅在开发环境使用）
router.post('/init', async (req, res) => {
  try {
    // 检查是否已存在礼物数据
    const existingGifts = await Gift.count();
    if (existingGifts > 0) {
      return res.json({ message: '礼物数据已存在' });
    }
    
    // 创建初始礼物数据
    const initialGifts = [
      { name: '小花', price: 10, icon: 'flower.png', description: '一朵美丽的小花' },
      { name: '啤酒', price: 50, icon: 'beer.png', description: '一杯冰镇啤酒' },
      { name: '火箭', price: 1000, icon: 'rocket.png', description: '一枚冲天火箭' },
      { name: '跑车', price: 5000, icon: 'car.png', description: '一辆豪华跑车' },
      { name: '游艇', price: 10000, icon: 'yacht.png', description: '一艘豪华游艇' }
    ];
    
    await Gift.bulkCreate(initialGifts);
    
    res.json({ message: '初始礼物数据创建成功', gifts: initialGifts });
  } catch (error) {
    console.error('创建初始礼物数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;