import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function AdminPanel({ navigate, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('deposits');
  const [deposits, setDeposits] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({ easypaisa: '', jazzcash: '', upi: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Plugin form
  const [pluginForm, setPluginForm] = useState({
    name: '',
    description: '',
    price: '',
    logo: null,
    file: null
  });

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('home');
      return;
    }
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      if (activeTab === 'deposits') {
        const res = await fetch(`${window.API_BASE}/admin/deposits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setDeposits(await res.json());
      } else if (activeTab === 'plugins') {
        const res = await fetch(`${window.API_BASE}/plugins`);
        if (res.ok) setPlugins(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${window.API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'settings') {
        const res = await fetch(`${window.API_BASE}/payment-settings`);
        if (res.ok) setPaymentSettings(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  const handleApproveDeposit = async (depositId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${window.API_BASE}/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('✓ Deposit approved');
        fetchData();
      }
    } catch (err) {
      setMessage('✗ Failed to approve');
    }
  };

  const handleRejectDeposit = async (depositId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${window.API_BASE}/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('✓ Deposit rejected');
        fetchData();
      }
    } catch (err) {
      setMessage('✗ Failed to reject');
    }
  };

  const handleAddPlugin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('📤 Uploading plugin files...');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', pluginForm.name);
    formData.append('description', pluginForm.description);
    formData.append('price', pluginForm.price);
    formData.append('logo', pluginForm.logo);
    formData.append('plugin_file', pluginForm.file);

    try {
      setMessage('⏳ Uploading to MongoDB...');
      
      const res = await fetch(`${window.API_BASE}/admin/plugins`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✓ Plugin added successfully!');
        setPluginForm({ name: '', description: '', price: '', logo: null, file: null });
        // Reset file inputs
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
        setTimeout(() => {
          fetchData();
          setMessage('');
        }, 2000);
      } else {
        setMessage(`✗ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`✗ Error: ${err.message || 'Connection failed'}`);
      console.error('Plugin upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlugin = async (pluginId) => {
    if (!window.confirm('Delete this plugin?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${window.API_BASE}/admin/plugins/${pluginId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('✓ Plugin deleted');
        fetchData();
      }
    } catch (err) {
      setMessage('✗ Failed to delete');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${window.API_BASE}/admin/payment-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentSettings)
      });

      if (res.ok) {
        setMessage('✓ Settings updated');
      } else {
        setMessage('✗ Failed to update');
      }
    } catch (err) {
      setMessage('✗ Connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.is_admin) return null;

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-[#ffd700] mb-2">⚙️ Admin Panel</h1>
          <p className="text-xs text-gray-400">Command Block Interface</p>
        </div>

        {message && (
          <div className={`max-w-2xl mx-auto mb-6 p-4 border-2 text-center ${
            message.includes('✓') 
              ? 'bg-green-900 border-green-600 text-green-200'
              : 'bg-red-900 border-red-600 text-red-200'
          }`}>
            <p className="text-xs">{message}</p>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['deposits', 'plugins', 'users', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mc-button px-6 py-3 text-xs whitespace-nowrap ${
                activeTab === tab ? 'mc-button-gold text-black' : 'text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <h2 className="text-xl text-white mb-4">💰 Deposit Requests</h2>
            {deposits.filter(d => d.status === 'Pending').length === 0 ? (
              <div className="bg-[#2a2a2a] border-4 border-black p-8 text-center">
                <p className="text-sm text-gray-400">No pending deposits</p>
              </div>
            ) : (
              deposits.filter(d => d.status === 'Pending').map((deposit) => (
                <div key={deposit.id} className="bg-[#2a2a2a] border-4 border-black p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-white mb-1">User: {deposit.username}</div>
                      <div className="text-xs text-gray-400">Amount: 🪙 {deposit.amount}</div>
                      <div className="text-xs text-gray-400">Method: {deposit.method}</div>
                      <div className="text-xs text-gray-400">TXN ID: {deposit.txn_id}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveDeposit(deposit.id)}
                      className="mc-button mc-button-green text-white px-6 py-2 text-xs flex-1"
                    >
                      ✓ APPROVE
                    </button>
                    <button
                      onClick={() => handleRejectDeposit(deposit.id)}
                      className="mc-button mc-button-red text-white px-6 py-2 text-xs flex-1"
                    >
                      ✗ REJECT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'plugins' && (
          <div>
            <h2 className="text-xl text-white mb-4">📦 Add New Plugin</h2>
            <div className="bg-[#2a2a2a] border-4 border-black p-6 mb-8">
              <form onSubmit={handleAddPlugin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Plugin Name"
                  value={pluginForm.name}
                  onChange={(e) => setPluginForm({...pluginForm, name: e.target.value})}
                  className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={pluginForm.description}
                  onChange={(e) => setPluginForm({...pluginForm, description: e.target.value})}
                  className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm h-24"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (coins)"
                  value={pluginForm.price}
                  onChange={(e) => setPluginForm({...pluginForm, price: e.target.value})}
                  className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm"
                  required
                />
                <div>
                  <label className="block text-xs text-gray-300 mb-2">Logo Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPluginForm({...pluginForm, logo: e.target.files[0]})}
                    className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-2">Plugin File</label>
                  <input
                    type="file"
                    onChange={(e) => setPluginForm({...pluginForm, file: e.target.files[0]})}
                    className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mc-button mc-button-green text-white py-4 text-sm"
                >
                  {loading ? 'ADDING...' : 'ADD PLUGIN'}
                </button>
              </form>
            </div>

            <h2 className="text-xl text-white mb-4">All Plugins ({plugins.length})</h2>
            {plugins.length === 0 ? (
              <div className="bg-[#2a2a2a] border-4 border-black p-8 text-center">
                <p className="text-sm text-gray-400">No plugins yet. Add one above!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {plugins.map((plugin) => (
                <div key={plugin.id} className="bg-[#2a2a2a] border-4 border-black p-4">
                  <h3 className="text-sm text-white mb-2">{plugin.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">Price: 🪙 {plugin.price}</p>
                  <p className="text-xs text-gray-400 mb-3">Downloads: {plugin.downloads}</p>
                  <button
                    onClick={() => handleDeletePlugin(plugin.id)}
                    className="mc-button mc-button-red text-white px-4 py-2 text-xs w-full"
                  >
                    DELETE PLUGIN
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl text-white mb-4">👥 All Users</h2>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="bg-[#2a2a2a] border-4 border-black p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white">{u.username}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#ffd700]">🪙 {u.coins}</div>
                    <div className="text-xs text-gray-400">{u.purchases?.length || 0} plugins</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl text-white mb-4">💳 Payment Settings</h2>
            <div className="bg-[#2a2a2a] border-4 border-black p-6">
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-2">Easypaisa Number</label>
                  <input
                    type="text"
                    value={paymentSettings.easypaisa}
                    onChange={(e) => setPaymentSettings({...paymentSettings, easypaisa: e.target.value})}
                    className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-2">JazzCash Number</label>
                  <input
                    type="text"
                    value={paymentSettings.jazzcash}
                    onChange={(e) => setPaymentSettings({...paymentSettings, jazzcash: e.target.value})}
                    className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={paymentSettings.upi}
                    onChange={(e) => setPaymentSettings({...paymentSettings, upi: e.target.value})}
                    className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mc-button mc-button-gold text-black py-4 text-sm"
                >
                  {loading ? 'UPDATING...' : 'UPDATE SETTINGS'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
