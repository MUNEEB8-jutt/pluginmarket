import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import PluginDetailPage from './pages/PluginDetailPage';
import DepositPage from './pages/DepositPage';
import AdminPanel from './pages/AdminPanel';
import MinecraftBackground from './components/MinecraftBackground';
import SocialButtons from './components/SocialButtons';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedPluginId, setSelectedPluginId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navigate = (page, pluginId = null) => {
    setCurrentPage(page);
    if (pluginId) setSelectedPluginId(pluginId);
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate(userData.is_admin ? 'admin' : 'home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('home');
  };

  const getVideoForPage = () => {
    switch (currentPage) {
      case 'home':
        return '/1.mp4';
      case 'profile':
      case 'deposit':
        return '/2.mp4';
      case 'plugin':
        return '/3.mp4';
      case 'admin':
        return '/4.mp4';
      default:
        return '/video.mp4';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigate={navigate} user={user} onLogout={handleLogout} />;
      case 'login':
        return <LoginPage navigate={navigate} onLogin={handleLogin} />;
      case 'signup':
        return <SignupPage navigate={navigate} onLogin={handleLogin} />;
      case 'profile':
        return <ProfilePage navigate={navigate} user={user} onLogout={handleLogout} />;
      case 'plugin':
        return <PluginDetailPage navigate={navigate} user={user} pluginId={selectedPluginId} onLogout={handleLogout} />;
      case 'deposit':
        return <DepositPage navigate={navigate} user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminPanel navigate={navigate} user={user} onLogout={handleLogout} />;
      default:
        return <HomePage navigate={navigate} user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="App">
      <MinecraftBackground videoSrc={getVideoForPage()} />
      <SocialButtons />
      {renderPage()}
    </div>
  );
}

export default App;
