const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Gift = require('./Gift');
const LiveRoom = require('./LiveRoom');

const GiftTransaction = sequelize.define('GiftTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  giftId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Gift,
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  totalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '总价格 = 单价 * 数量'
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '附带消息'
  }
}, {
  timestamps: true,
  tableName: 'gift_transactions'
});

// 建立关系
GiftTransaction.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
GiftTransaction.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
GiftTransaction.belongsTo(Gift, { foreignKey: 'giftId' });
GiftTransaction.belongsTo(LiveRoom, { foreignKey: 'roomId' });

module.exports = GiftTransaction;