# 直播推流和拉流API文档

## 推流地址格式

### RTMP推流
```
rtmp://[服务器IP]:1935/live/[streamKey]
```

### 推流鉴权
- 推流时需要在URL中包含streamKey
- streamKey在创建直播间时生成
- 推流软件需要支持自定义推流路径

## 拉流地址格式

### RTMP拉流
```
rtmp://[服务器IP]:1935/live/[streamKey]
```

### HTTP-FLV拉流
```
http://[服务器IP]:8080/live/[streamKey].flv
```

### HLS拉流
```
http://[服务器IP]:8080/live/[streamKey].m3u8
```

### WebRTC拉流
```
http://[服务器IP]:8080/rtc/v1/play/?app=live&stream=[streamKey]
```

## 推流软件配置示例

### OBS Studio配置
1. 设置 -> 推流
2. 服务: 自定义
3. 服务器: `rtmp://[服务器IP]:1935/live`
4. 串流密钥: `[streamKey]`

### 推流参数建议
- 分辨率: 1920x1080 (1080p) 或 1280x720 (720p)
- 帧率: 30fps
- 视频编码: H.264
- 音频编码: AAC
- 视频码率: 2000-4000 kbps
- 音频码率: 128 kbps

## API接口

### 获取推流地址
```
GET /api/rooms/{roomId}/stream-url
```

响应:
```json
{
  "rtmpUrl": "rtmp://server:1935/live/streamKey123",
  "streamKey": "streamKey123"
}
```

### 验证推流密钥
```
POST /api/streams/validate
```

请求:
```json
{
  "streamKey": "streamKey123"
}
```

响应:
```json
{
  "valid": true,
  "roomId": 123
}
```