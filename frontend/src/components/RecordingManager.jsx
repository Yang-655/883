import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecordingManager.css';

const RecordingManager = ({ user, onBack }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    fetchRecordings();
  }, [currentPage]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/recordings?page=${currentPage}&limit=10`);
      setRecordings(response.data.recordings);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('获取录制列表失败:', error);
      setLoading(false);
    }
  };

  const handleEdit = (recording) => {
    setSelectedRecording(recording);
    setEditForm({
      title: recording.title,
      description: recording.description,
      isPublic: recording.isPublic
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个录制吗？此操作不可恢复。')) {
      return;
    }

    try {
      await axios.delete(`/api/recordings/${id}`);
      fetchRecordings();
    } catch (error) {
      console.error('删除录制失败:', error);
      alert('删除录制失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/recordings/${selectedRecording.id}`, editForm);
      setShowEditModal(false);
      fetchRecordings();
    } catch (error) {
      console.error('更新录制信息失败:', error);
      alert('更新录制信息失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return <div className="recording-manager loading">加载中...</div>;
  }

  return (
    <div className="recording-manager">
      <div className="recording-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>我的录制</h2>
      </div>

      {recordings.length === 0 ? (
        <div className="no-recordings">
          <p>暂无录制内容</p>
        </div>
      ) : (
        <>
          <div className="recordings-grid">
            {recordings.map(recording => (
              <div key={recording.id} className="recording-card">
                <div className="recording-thumbnail">
                  {recording.thumbnail ? (
                    <img 
                      src={`/recordings/${recording.thumbnail}`} 
                      alt={recording.title}
                    />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <span className="play-icon">▶</span>
                    </div>
                  )}
                  <div className="recording-duration">
                    {formatDuration(recording.duration)}
                  </div>
                </div>
                <div className="recording-info">
                  <h3>{recording.title}</h3>
                  <p className="recording-description">{recording.description || '无描述'}</p>
                  <div className="recording-meta">
                    <span>大小: {formatFileSize(recording.size)}</span>
                    <span>观看: {recording.views} 次</span>
                    <span>
                      状态: 
                      <span className={`status ${recording.status}`}>
                        {recording.status === 'completed' ? '已完成' : 
                         recording.status === 'recording' ? '录制中' : '失败'}
                      </span>
                    </span>
                  </div>
                  <div className="recording-actions">
                    {recording.status === 'completed' && (
                      <button 
                        className="play-button"
                        onClick={() => window.open(`/playback/${recording.id}`, '_blank')}
                      >
                        播放
                      </button>
                    )}
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(recording)}
                    >
                      编辑
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(recording.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span>第 {currentPage} 页，共 {totalPages} 页</span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>编辑录制信息</h3>
              <button 
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="edit-form">
              <div className="form-group">
                <label>标题:</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>描述:</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({...editForm, isPublic: e.target.checked})}
                  />
                  公开显示
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  取消
                </button>
                <button type="submit">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingManager;