const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const LiveRoom = require('./LiveRoom');

const Danmu = sequelize.define('Danmu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '弹幕内容'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LiveRoom,
      key: 'id'
    }
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#ffffff',
    comment: '弹幕颜色 (十六进制)'
  },
  size: {
    type: DataTypes.ENUM('small', 'medium', 'large'),
    allowNull: false,
    defaultValue: 'medium',
    comment: '弹幕大小'
  },
  position: {
    type: DataTypes.ENUM('scroll', 'top', 'bottom'),
    allowNull: false,
    defaultValue: 'scroll',
    comment: '弹幕位置'
  },
  fontSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 16,
    comment: '字体大小'
  },
  fontFamily: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Arial',
    comment: '字体类型'
  },
  isVip: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为VIP用户发送'
  }
}, {
  timestamps: true,
  tableName: 'danmus',
  indexes: [
    {
      fields: ['roomId', 'createdAt']
    }
  ]
});

// 建立关系
Danmu.belongsTo(User, { foreignKey: 'userId' });
Danmu.belongsTo(LiveRoom, { foreignKey: 'roomId' });

module.exports = Danmu;