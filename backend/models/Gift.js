const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gift = sequelize.define('Gift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '礼物价格（虚拟货币）'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '礼物图标URL'
  },
  animation: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '礼物动画效果'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'gifts'
});

module.exports = Gift;