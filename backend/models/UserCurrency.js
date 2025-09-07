const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserCurrency = sequelize.define('UserCurrency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '用户虚拟货币余额'
  },
  totalSpent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '用户总消费'
  },
  totalReceived: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '用户总收入（作为主播）'
  }
}, {
  timestamps: true,
  tableName: 'user_currencies'
});

// 建立用户与虚拟货币的一对一关系
User.hasOne(UserCurrency, { foreignKey: 'userId' });
UserCurrency.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserCurrency;