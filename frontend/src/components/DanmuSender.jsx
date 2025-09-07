import React, { useState, useRef } from 'react';
import axios from 'axios';
import './DanmuSender.css';

const DanmuSender = ({ room, user, onSendDanmu }) => {
  const [content, setContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [danmuStyle, setDanmuStyle] = useState({
    color: '#ffffff',
    size: 'medium',
    position: 'scroll',
    fontSize: 16,
    fontFamily: 'Arial',
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  });
  const inputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    try {
      const response = await axios.post('/api/danmus/send', {
        content,
        roomId: room.id,
        ...danmuStyle
      });
      
      // 调用父组件的回调函数
      if (onSendDanmu) {
        onSendDanmu(response.data.danmu);
      }
      
      // 清空输入框
      setContent('');
    } catch (error) {
      console.error('发送弹幕失败:', error);
      alert('发送弹幕失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  const handleKeyPress = (e) => {
    // Ctrl+Enter 或 Cmd+Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend(e);
    }
  };

  const handleColorChange = (color) => {
    setDanmuStyle(prev => ({ ...prev, color }));
  };

  const handleSizeChange = (size) => {
    setDanmuStyle(prev => ({ ...prev, size }));
  };

  const handlePositionChange = (position) => {
    setDanmuStyle(prev => ({ ...prev, position }));
  };

  const handleFontSizeChange = (fontSize) => {
    setDanmuStyle(prev => ({ ...prev, fontSize: parseInt(fontSize) }));
  };

  const handleFontFamilyChange = (fontFamily) => {
    setDanmuStyle(prev => ({ ...prev, fontFamily }));
  };

  const handleBackgroundColorChange = (backgroundColor) => {
    setDanmuStyle(prev => ({ ...prev, backgroundColor }));
  };

  const handleBorderColorChange = (borderColor) => {
    setDanmuStyle(prev => ({ ...prev, borderColor }));
  };

  const predefinedColors = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ff7f00'
  ];

  const sizeOptions = [
    { value: 'small', label: '小' },
    { value: 'medium', label: '中' },
    { value: 'large', label: '大' }
  ];

  const positionOptions = [
    { value: 'scroll', label: '滚动' },
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' }
  ];

  const fontFamilyOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Georgia', label: 'Georgia' }
  ];

  return (
    <div className="danmu-sender">
      <form onSubmit={handleSend} className="danmu-form">
        <div className="danmu-input-container">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入弹幕内容，按 Ctrl+Enter 发送"
            className="danmu-input"
            maxLength={500}
          />
          <div className="danmu-input-info">
            <span>{content.length}/500</span>
          </div>
        </div>
        
        <div className="danmu-actions">
          <button 
            type="button" 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            设置
          </button>
          <button type="submit" className="send-button">
            发送
          </button>
        </div>
      </form>
      
      {showSettings && (
        <div className="danmu-settings">
          <div className="settings-section">
            <h4>颜色</h4>
            <div className="color-options">
              {predefinedColors.map(color => (
                <div
                  key={color}
                  className={`color-option ${danmuStyle.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h4>大小</h4>
            <div className="radio-group">
              {sizeOptions.map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="size"
                    value={option.value}
                    checked={danmuStyle.size === option.value}
                    onChange={(e) => handleSizeChange(e.target.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h4>位置</h4>
            <div className="radio-group">
              {positionOptions.map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="position"
                    value={option.value}
                    checked={danmuStyle.position === option.value}
                    onChange={(e) => handlePositionChange(e.target.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h4>字体大小</h4>
            <input
              type="range"
              min="12"
              max="30"
              value={danmuStyle.fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="font-size-slider"
            />
            <span className="font-size-value">{danmuStyle.fontSize}px</span>
          </div>
          
          <div className="settings-section">
            <h4>字体</h4>
            <select 
              value={danmuStyle.fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="font-family-select"
            >
              {fontFamilyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="settings-section">
            <h4>背景色</h4>
            <div className="color-options">
              {predefinedColors.map(color => (
                <div
                  key={color}
                  className={`color-option ${danmuStyle.backgroundColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleBackgroundColorChange(color)}
                />
              ))}
              <div
                className="color-option custom-color"
                style={{ backgroundColor: 'transparent' }}
                onClick={() => {
                  const customColor = prompt('输入自定义颜色 (十六进制)', danmuStyle.backgroundColor);
                  if (customColor) handleBackgroundColorChange(customColor);
                }}
              >
                +
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h4>边框色</h4>
            <div className="color-options">
              {predefinedColors.map(color => (
                <div
                  key={color}
                  className={`color-option ${danmuStyle.borderColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleBorderColorChange(color)}
                />
              ))}
              <div
                className="color-option custom-color"
                style={{ backgroundColor: 'transparent' }}
                onClick={() => {
                  const customColor = prompt('输入自定义边框颜色 (十六进制)', danmuStyle.borderColor);
                  if (customColor) handleBorderColorChange(customColor);
                }}
              >
                +
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DanmuSender;