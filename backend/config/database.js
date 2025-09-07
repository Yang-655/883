const { Sequelize } = require('sequelize');
const config = require('./db');

// 获取环境配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false // 设置为true可以查看SQL日志
  }
);

module.exports = sequelize;