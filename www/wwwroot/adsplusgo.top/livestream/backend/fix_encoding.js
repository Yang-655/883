const fs = require('fs');
const path = require('path');

// 读取原始文件
const originalFilePath = path.join(__dirname, '../../../../../../Users/12568/LikePai/backend/server.js');
const targetFilePath = path.join(__dirname, 'server.js');

// 以UTF-8编码读取文件
fs.readFile(originalFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件时出错:', err);
    return;
  }
  
  // 以UTF-8编码写入文件
  fs.writeFile(targetFilePath, data, 'utf8', (err) => {
    if (err) {
      console.error('写入文件时出错:', err);
      return;
    }
    
    console.log('文件编码修复完成');
  });
});