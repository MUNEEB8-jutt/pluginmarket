import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import GoogleAd from '../components/GoogleAd';

function HomePage({ navigate, user, onLogout }) {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const response = await fetch(`${window.API_BASE}/plugins`);
      if (response.ok) {
        const data = await response.json();
        setPlugins(data);
      } else {
        setError('Failed to load plugins');
      }
    } catch (err) {
      setError('Backend connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl text-[#3eba3e] mb-4 drop-shadow-lg">
            ⛏️ PluginVerse
          </h1>
          <p className="text-sm md:text-base text-gray-400 mb-2">
            Minecraft Plugin Marketplace
          </p>
          <p className="text-xs text-gray-500 mb-6">
            🔍 Discover and download premium Minecraft plugins
          </p>
          
          {user && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => navigate('profile')}
                className="mc-button text-white px-6 py-3 text-xs hover:bg-[#3eba3e] transition-colors"
              >
                📊 MY DASHBOARD
              </button>
              <button
                onClick={() => navigate('deposit')}
                className="mc-button mc-button-gold text-black px-6 py-3 text-xs"
              >
                💰 ADD COINS
              </button>
            </div>
          )}
          
          {!user && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => navigate('login')}
                className="mc-button text-white px-6 py-3 text-xs"
              >
                LOGIN
              </button>
              <button
                onClick={() => navigate('signup')}
                className="mc-button mc-button-green text-white px-6 py-3 text-xs"
              >
                SIGN UP
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center text-[#3eba3e] text-xl">
            Loading plugins...
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto bg-red-900 border-4 border-red-600 p-6 text-center">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && plugins.length === 0 && (
          <div className="text-center text-gray-400 text-sm">
            No plugins available yet
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-[#2a2a2a] border-3 border-black hover:border-[#3eba3e] transition-all duration-200 hover:scale-102 cursor-pointer rounded-sm overflow-hidden"
              onClick={() => navigate('plugin', plugin.id)}
            >
              <div className="aspect-square bg-[#1c1c1c] border-b-3 border-black flex items-center justify-center overflow-hidden">
                {plugin.logo_url ? (
                  <img 
                    src={plugin.logo_url.startsWith('http') ? plugin.logo_url : `${window.API_BASE.replace('/api', '')}${plugin.logo_url}`}
                    alt={plugin.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="text-4xl">📦</div>';
                    }}
                  />
                ) : (
                  <div className="text-4xl">📦</div>
                )}
              </div>
              
              <div className="p-3">
                <h3 className="text-xs text-white mb-1 truncate font-bold">
                  {plugin.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2 line-clamp-1" style={{ fontSize: '10px' }}>
                  {plugin.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[#ffd700]" style={{ fontSize: '14px' }}>🪙</span>
                    <span className="text-[#ffd700] font-bold" style={{ fontSize: '11px' }}>
                      {plugin.price}
                    </span>
                  </div>
                  <div className="text-gray-500" style={{ fontSize: '10px' }}>
                    ⬇️ {plugin.downloads}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google AdSense - Below Plugins */}
        <div className="mt-8">
          <div className="bg-[#2a2a2a] border-4 border-[#ffd700] p-4">
            <div className="text-center mb-2">
              <span className="text-xs text-gray-400">Advertisement</span>
            </div>
            <GoogleAd slot="1234567890" format="auto" responsive={true} />
          </div>
        </div>

        {/* Custom Ad Banner - For Direct Advertisers */}
        <div className="mt-4">
          <a
            href="https://discord.gg/UnDRjTc9jP"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#2a2a2a] border-4 border-[#3eba3e] hover:border-[#ffd700] transition-all duration-300 hover:scale-102 cursor-pointer overflow-hidden"
          >
            <div className="relative p-6 text-center">
              <div className="text-3xl mb-2">📢</div>
              <h3 className="text-lg text-[#3eba3e] mb-2 font-bold">ADVERTISE HERE</h3>
              <div className="inline-block bg-[#7289da] text-white px-4 py-2 text-xs font-bold border-2 border-black hover:bg-[#8299ea] transition-colors">
                💬 Join Discord to Advertise
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
