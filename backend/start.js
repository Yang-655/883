const path = require('path');
console.log('当前工作目录:', process.cwd());
console.log('尝试加载 server.js...');
console.log('文件路径:', path.join(process.cwd(), 'server.js'));

try {
  require('./server.js');
} catch (error) {
  console.error('加载 server.js 时出错:', error.message);
  console.error('错误详情:', error);
}