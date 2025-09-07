// 简单的API测试脚本
const axios = require('axios');

// 测试服务器基础URL
const BASE_URL = 'http://localhost:3000';

// 测试用户数据
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  isStreamer: true
};

let authToken = '';
let createdUser = null;
let createdRoom = null;

async function runTests() {
  console.log('开始测试直播软件API...\n');
  
  try {
    // 1. 测试服务器是否运行
    await testServerStatus();
    
    // 2. 测试用户注册
    await testUserRegistration();
    
    // 3. 测试用户登录
    await testUserLogin();
    
    // 4. 测试创建直播间
    await testCreateRoom();
    
    // 5. 测试获取活跃直播间
    await testGetActiveRooms();
    
    console.log('\n所有测试完成！');
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
}

async function testServerStatus() {
  console.log('1. 测试服务器状态...');
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('   √ 服务器运行正常:', response.data.message);
  } catch (error) {
    throw new Error('服务器未运行或无法访问');
  }
}

async function testUserRegistration() {
  console.log('2. 测试用户注册...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    createdUser = response.data.user;
    console.log('   √ 用户注册成功:', createdUser.username);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   ! 用户已存在，跳过注册');
    } else {
      throw new Error('用户注册失败: ' + error.message);
    }
  }
}

async function testUserLogin() {
  console.log('3. 测试用户登录...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = response.data.token;
    createdUser = response.data.user;
    console.log('   √ 用户登录成功:', createdUser.username);
  } catch (error) {
    throw new Error('用户登录失败: ' + error.message);
  }
}

async function testCreateRoom() {
  console.log('4. 测试创建直播间...');
  try {
    const response = await axios.post(`${BASE_URL}/api/rooms`, {
      title: '测试直播间',
      description: '这是一个测试直播间'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    createdRoom = response.data.room;
    console.log('   √ 直播间创建成功:', createdRoom.title);
  } catch (error) {
    throw new Error('创建直播间失败: ' + error.message);
  }
}

async function testGetActiveRooms() {
  console.log('5. 测试获取活跃直播间...');
  try {
    const response = await axios.get(`${BASE_URL}/api/rooms/active`);
    console.log('   √ 获取活跃直播间成功，当前有', response.data.length, '个直播间');
  } catch (error) {
    throw new Error('获取活跃直播间失败: ' + error.message);
  }
}

// 运行测试
runTests();