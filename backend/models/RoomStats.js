const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const LiveRoom = require('./LiveRoom');

const RoomStats = sequelize.define('RoomStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: LiveRoom,
      key: 'id'
    }
  },
  // 总观看时长（分钟）
  totalViewingMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 最高同时在线人数
  peakViewers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总观众数
  totalViewers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总弹幕数
  totalDanmus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总聊天消息数
  totalChatMessages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总礼物数
  totalGifts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 总礼物金额
  totalGiftValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  // 平均观看时长（分钟）
  averageViewingMinutes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  // 直播时长（分钟）
  streamingMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 开始时间
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // 结束时间
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'room_stats'
});

// 建立关系
RoomStats.belongsTo(LiveRoom, { foreignKey: 'roomId' });

module.exports = RoomStats;