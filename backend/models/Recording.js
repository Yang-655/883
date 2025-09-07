const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const LiveRoom = require('./LiveRoom');

const Recording = sequelize.define('Recording', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '录制视频标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '录制视频描述'
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '录制文件名'
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '录制文件路径'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '视频时长（秒）'
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '文件大小（字节）'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LiveRoom,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('recording', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'recording',
    comment: '录制状态'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '录制开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '录制结束时间'
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '视频缩略图路径'
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '观看次数'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否公开'
  }
}, {
  timestamps: true,
  tableName: 'recordings',
  indexes: [
    {
      fields: ['roomId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

// 建立关系
Recording.belongsTo(User, { foreignKey: 'userId' });
Recording.belongsTo(LiveRoom, { foreignKey: 'roomId' });

module.exports = Recording;