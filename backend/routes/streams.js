const express = require('express');
const LiveRoom = require('../models/LiveRoom');
const router = express.Router();

// 验证推流密钥
router.post('/validate', async (req, res) => {
  try {
    const { streamKey } = req.body;
    
    // 查找对应的直播间
    const room = await LiveRoom.findOne({
      where: {
        streamKey: streamKey
      }
    });
    
    if (!room) {
      return res.status(404).json({ 
        valid: false, 
        message: '无效的推流密钥' 
      });
    }
    
    res.json({
      valid: true,
      roomId: room.id,
      roomTitle: room.title
    });
  } catch (error) {
    console.error('验证推流密钥错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取直播间推流地址
router.get('/:roomId/stream-url', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // 查找对应的直播间
    const room = await LiveRoom.findByPk(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        message: '直播间不存在' 
      });
    }
    
    // 构造推流地址
    const rtmpUrl = `rtmp://${req.get('host').split(':')[0]}:1935/live/${room.streamKey}`;
    
    res.json({
      rtmpUrl,
      streamKey: room.streamKey
    });
  } catch (error) {
    console.error('获取推流地址错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;