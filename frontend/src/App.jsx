import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import RoomList from './components/RoomList';
import VideoPlayer from './components/VideoPlayer';
import ChatRoom from './components/ChatRoom';
import StreamerPage from './components/StreamerPage';
import RecordingManager from './components/RecordingManager';
import PlaybackPlayer from './components/PlaybackPlayer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RealtimeMonitor from './components/RealtimeMonitor';
import './App.css';

const AppContent = () => {
  const { user, logout } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [view, setView] = useState('home'); // home, login, register, streamer, recordings, playback, analytics, monitor
  const [playbackId, setPlaybackId] = useState(null);

  // 根据URL路径设置初始视图
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') setView('login');
    else if (path === '/register') setView('register');
    else if (path === '/streamer') setView('streamer');
    else if (path === '/recordings') setView('recordings');
    else if (path === '/analytics') setView('analytics');
    else if (path === '/monitor') setView('monitor');
    else if (path.startsWith('/playback/')) {
      const id = path.split('/')[2];
      setPlaybackId(id);
      setView('playback');
    }
    else setView('home');
  }, []);

  const navigateTo = (newView, params = {}) => {
    if (newView === 'playback' && params.id) {
      setPlaybackId(params.id);
      window.history.pushState({}, '', `/playback/${params.id}`);
    } else {
      window.history.pushState({}, '', `/${newView}`);
    }
    setView(newView);
  };

  if (view === 'login') {
    return <Login />;
  }

  if (view === 'register') {
    return <Register />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>直播平台</h1>
        <nav className="app-nav">
          <button onClick={() => navigateTo('home')}>首页</button>
          {user ? (
            <>
              {user.isStreamer && (
                <button onClick={() => navigateTo('streamer')}>主播中心</button>
              )}
              <button onClick={() => navigateTo('recordings')}>我的录制</button>
              {user.isAdmin && (
                <>
                  <button onClick={() => navigateTo('analytics')}>数据统计</button>
                  <button onClick={() => navigateTo('monitor')}>实时监控</button>
                </>
              )}
              <span>欢迎, {user.username}</span>
              <button onClick={logout}>退出</button>
            </>
          ) : (
            <>
              <button onClick={() => navigateTo('login')}>登录</button>
              <button onClick={() => navigateTo('register')}>注册</button>
            </>
          )}
        </nav>
      </header>
      
      <main className="app-main">
        {view === 'streamer' ? (
          <StreamerPage />
        ) : view === 'recordings' ? (
          <RecordingManager user={user} onBack={() => navigateTo('home')} />
        ) : view === 'playback' ? (
          <PlaybackPlayer recordingId={playbackId} onBack={() => navigateTo('recordings')} />
        ) : view === 'analytics' ? (
          <AnalyticsDashboard user={user} onBack={() => navigateTo('home')} />
        ) : view === 'monitor' ? (
          <RealtimeMonitor user={user} onBack={() => navigateTo('home')} />
        ) : !currentRoom ? (
          <RoomList onSelectRoom={setCurrentRoom} />
        ) : (
          <div className="live-view">
            <VideoPlayer room={currentRoom} user={user} onBack={() => setCurrentRoom(null)} />
            <ChatRoom room={currentRoom} user={user} />
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;