/**
 * SRS录制回调处理脚本
 * 处理SRS服务器的录制回调事件
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  backendUrl: 'http://127.0.0.1:3000/api/recordings/srs',
  recordingPath: './objs/nginx/html/recordings'
};

// 确保录制目录存在
function ensureRecordingDirectory() {
  const dir = CONFIG.recordingPath;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 处理开始录制回调
function handleStartRecording(data) {
  console.log('开始录制:', data);
  
  // 确保目录存在
  ensureRecordingDirectory();
  
  // 创建应用和流目录
  const appDir = path.join(CONFIG.recordingPath, data.app);
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  return {
    code: 0,
    msg: 'OK'
  };
}

// 处理结束录制回调
function handleStopRecording(data) {
  console.log('结束录制:', data);
  
  // 可以在这里添加额外的处理逻辑
  // 例如生成缩略图、转码等
  
  return {
    code: 0,
    msg: 'OK'
  };
}

// HTTP服务器
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        let response;
        
        switch(data.action) {
          case 'on_publish':
            response = handleStartRecording(data);
            break;
          case 'on_unpublish':
            response = handleStopRecording(data);
            break;
          default:
            response = {
              code: 0,
              msg: 'OK'
            };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('处理回调错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 1, msg: 'Internal Server Error' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 1, msg: 'Not Found' }));
  }
});

// 启动服务器
const PORT = 8081;
server.listen(PORT, () => {
  console.log(`SRS录制回调服务器运行在端口 ${PORT}`);
});

module.exports = {
  handleStartRecording,
  handleStopRecording
};