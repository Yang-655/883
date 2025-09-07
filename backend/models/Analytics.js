const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const LiveRoom = require('./LiveRoom');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 统计类型
  type: {
    type: DataTypes.ENUM(
      'user_registration',     // 用户注册
      'user_login',           // 用户登录
      'room_created',         // 房间创建
      'room_started',         // 房间开始直播
      'room_stopped',         // 房间结束直播
      'viewer_joined',        // 观众加入
      'viewer_left',          // 观众离开
      'chat_message',         // 聊天消息
      'gift_sent',            // 礼物发送
      'danmu_sent',           // 弹幕发送
      'recording_created',    // 录制创建
      'recording_played',     // 录制播放
      'report_submitted',     // 举报提交
      'content_blocked'       // 内容屏蔽
    ),
    allowNull: false,
    comment: '统计类型'
  },
  // 关联的用户ID
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  // 关联的房间ID
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: LiveRoom,
      key: 'id'
    }
  },
  // 数值数据
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '数值数据（如礼物金额等）'
  },
  // 字符串数据
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '附加数据（JSON格式）'
  },
  // IP地址
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  // 用户代理
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理信息'
  },
  // 地理位置
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '地理位置信息'
  }
}, {
  timestamps: true,
  tableName: 'analytics',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['roomId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// 建立关系
Analytics.belongsTo(User, { foreignKey: 'userId' });
Analytics.belongsTo(LiveRoom, { foreignKey: 'roomId' });

module.exports = Analytics;