// 数据库配置
module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'livestream_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER || 'livestream',
    password: process.env.DB_PASSWORD || 'livestream123',
    database: process.env.DB_NAME || 'livestream_dev',
    host: process.env.DB_HOST || 'database',
    dialect: 'mysql',
  }
};