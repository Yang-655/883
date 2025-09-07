const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  // 直播时长（分钟）
  totalStreamingMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 观看时长（分钟）
  totalViewingMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 发送的弹幕数
  totalDanmusSent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 发送的礼物数
  totalGiftsSent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 接收的礼物数
  totalGiftsReceived: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 发送的聊天消息数
  totalChatMessages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总消费金额
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  // 总收入金额
  totalEarned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  // 创建的房间数
  totalRoomsCreated: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 参与的房间数
  totalRoomsJoined: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 最后活跃时间
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'user_stats'
});

// 建立关系
UserStats.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserStats;