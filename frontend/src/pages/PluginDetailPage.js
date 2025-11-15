import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function PluginDetailPage({ navigate, user, pluginId, onLogout }) {
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!pluginId) {
      navigate('home');
      return;
    }
    fetchPlugin();
  }, [pluginId]);

  const fetchPlugin = async () => {
    try {
      const response = await fetch(`${window.API_BASE}/plugins/${pluginId}`);
      if (response.ok) {
        const data = await response.json();
        setPlugin(data);
      } else {
        setMessage('Plugin not found');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to load plugin');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate('login');
      return;
    }

    setPurchasing(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/plugins/buy/${pluginId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Plugin purchased successfully!');
        setMessageType('success');
        
        // Fetch updated user data to get purchases list
        const userResponse = await fetch(`${window.API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const updatedUserData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          
          // Force page reload to show download button
          window.location.reload();
        }
      } else {
        setMessage(data.detail || 'Purchase failed');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Connection failed: ' + err.message);
      setMessageType('error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/plugins/${pluginId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Build the full download URL
        let downloadUrl = data.download_url;
        if (downloadUrl.startsWith('/api/')) {
          downloadUrl = `http://localhost:8000${downloadUrl}`;
        }
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.name || 'plugin';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage('✓ Download started!');
        setMessageType('success');
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Download failed');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Download failed: ' + err.message);
      setMessageType('error');
    }
  };

  // Check if user owns this plugin
  const isPurchased = user && user.purchases?.includes(pluginId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c]">
        <Navbar navigate={navigate} user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center text-[#3eba3e]">
          Loading plugin...
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen bg-[#1c1c1c]">
        <Navbar navigate={navigate} user={user} onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-400 mb-4">Plugin not found</p>
          <button
            onClick={() => navigate('home')}
            className="mc-button mc-button-green text-white px-6 py-3 text-xs"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('home')}
            className="mc-button text-white px-4 py-2 text-xs mb-6"
          >
            ← BACK
          </button>

          <div className="bg-[#2a2a2a] border-4 border-black p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-[#1c1c1c] border-4 border-black flex items-center justify-center overflow-hidden">
                {plugin.logo_url ? (
                  <img 
                    src={plugin.logo_url.startsWith('http') ? plugin.logo_url : `${window.API_BASE.replace('/api', '')}${plugin.logo_url}`}
                    alt={plugin.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="text-9xl">📦</div>';
                    }}
                  />
                ) : (
                  <div className="text-9xl">📦</div>
                )}
              </div>

              <div>
                <h1 className="text-3xl text-[#3eba3e] mb-4">{plugin.name}</h1>
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">🪙</span>
                    <span className="text-3xl text-[#ffd700] font-bold">{plugin.price}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ⬇️ {plugin.downloads} downloads
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm text-white mb-2">Description:</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>

                {message && (
                  <div className={`mb-4 p-4 border-2 text-center ${
                    messageType === 'success' 
                      ? 'bg-green-900 border-green-600 text-green-200 glow-green'
                      : 'bg-red-900 border-red-600 text-red-200 glow-red'
                  }`}>
                    <p className="text-xs">{message}</p>
                  </div>
                )}

                {isPurchased ? (
                  <div>
                    <div className="bg-green-900 border-2 border-green-600 p-3 text-center mb-4">
                      <p className="text-xs text-green-200">✓ You own this plugin!</p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="w-full mc-button mc-button-green text-white py-4 text-sm glow-green"
                    >
                      ⬇️ DOWNLOAD NOW
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleBuy}
                    disabled={purchasing}
                    className="w-full mc-button mc-button-gold text-black py-4 text-sm disabled:opacity-50"
                  >
                    {purchasing ? 'PURCHASING...' : `💰 BUY FOR ${plugin.price} COINS`}
                  </button>
                )}

                {!user && (
                  <p className="text-xs text-gray-400 text-center mt-4">
                    <button
                      onClick={() => navigate('login')}
                      className="text-[#3eba3e] hover:text-[#4eca4e]"
                    >
                      Login
                    </button>
                    {' '}to purchase
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PluginDetailPage;
