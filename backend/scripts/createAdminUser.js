const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

async function createAdminUser() {
  try {
    // 等待数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步数据库模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步成功');
    
    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({ where: { isAdmin: true } });
    if (existingAdmin) {
      console.log('已存在管理员用户:', existingAdmin.username);
      return;
    }
    
    // 创建管理员用户
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isStreamer: true,
      isAdmin: true
    });
    
    console.log('管理员用户创建成功:');
    console.log('用户名:', adminUser.username);
    console.log('邮箱:', adminUser.email);
    console.log('密码: admin123 (请登录后及时修改)');
    console.log('管理员权限:', adminUser.isAdmin);
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行脚本
createAdminUser();