import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function ProfilePage({ navigate, user, onLogout }) {
  const [purchases, setPurchases] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('login');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      let currentUserData = user;
      
      // Fetch current user data
      const userResponse = await fetch(`${window.API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        currentUserData = await userResponse.json();
        localStorage.setItem('user', JSON.stringify(currentUserData));
      }

      // Fetch deposits
      const depositsResponse = await fetch(`${window.API_BASE}/deposits/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (depositsResponse.ok) {
        const depositsData = await depositsResponse.json();
        setDeposits(depositsData);
      }

      // Fetch plugins to show purchased ones
      const pluginsResponse = await fetch(`${window.API_BASE}/plugins`);
      if (pluginsResponse.ok) {
        const allPlugins = await pluginsResponse.json();
        const userPurchases = allPlugins.filter(p => currentUserData.purchases?.includes(p.id));
        setPurchases(userPurchases);
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2a2a2a] border-4 border-black p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl text-[#3eba3e] mb-2">📊 Dashboard</h1>
                <p className="text-sm text-white mb-1">👤 {user.username}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-3">
                  <span className="text-2xl">🪙</span>
                  <span className="text-2xl text-[#ffd700] font-bold">{user.coins}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('deposit')}
                    className="mc-button mc-button-gold text-black px-4 py-2 text-xs"
                  >
                    💰 DEPOSIT
                  </button>
                  <button
                    onClick={() => navigate('home')}
                    className="mc-button mc-button-green text-white px-4 py-2 text-xs"
                  >
                    🔍 DISCOVER
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#1c1c1c] border-2 border-black p-4 text-center">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-xl text-[#3eba3e] font-bold">{purchases.length}</div>
                <div className="text-xs text-gray-400">Plugins Owned</div>
              </div>
              <div className="bg-[#1c1c1c] border-2 border-black p-4 text-center">
                <div className="text-2xl mb-2">🪙</div>
                <div className="text-xl text-[#ffd700] font-bold">{user.coins}</div>
                <div className="text-xs text-gray-400">Coins Balance</div>
              </div>
              <div className="bg-[#1c1c1c] border-2 border-black p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-xl text-white font-bold">{deposits.length}</div>
                <div className="text-xs text-gray-400">Deposits Made</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl text-white mb-4">📦 My Plugins</h2>
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : purchases.length === 0 ? (
              <div className="bg-[#2a2a2a] border-4 border-black p-8 text-center">
                <p className="text-sm text-gray-400">No plugins purchased yet</p>
                <button
                  onClick={() => navigate('home')}
                  className="mc-button mc-button-green text-white px-6 py-3 text-xs mt-4"
                >
                  BROWSE PLUGINS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="bg-[#2a2a2a] border-4 border-black p-4 cursor-pointer hover:border-[#3eba3e]"
                    onClick={() => navigate('plugin', plugin.id)}
                  >
                    <h3 className="text-sm text-white mb-2">{plugin.name}</h3>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{plugin.description}</p>
                    <div className="text-xs text-[#3eba3e]">✓ Owned</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl text-white mb-4">💰 Deposit History</h2>
            {deposits.length === 0 ? (
              <div className="bg-[#2a2a2a] border-4 border-black p-8 text-center">
                <p className="text-sm text-gray-400">No deposits yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="bg-[#2a2a2a] border-4 border-black p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm text-white mb-1">
                        🪙 {deposit.amount} coins
                      </div>
                      <div className="text-xs text-gray-400">
                        {deposit.method} • {deposit.txn_id}
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 border-2 ${
                      deposit.status === 'Approved' 
                        ? 'bg-green-900 border-green-600 text-green-200'
                        : deposit.status === 'Rejected'
                        ? 'bg-red-900 border-red-600 text-red-200'
                        : 'bg-yellow-900 border-yellow-600 text-yellow-200'
                    }`}>
                      {deposit.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
