import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function DepositPage({ navigate, user, onLogout }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('easypaisa');
  const [txnId, setTxnId] = useState('');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('login');
      return;
    }
    fetchPaymentSettings();
  }, [user]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch(`${window.API_BASE}/payment-settings`);
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch payment settings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          method,
          txn_id: txnId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.detail || 'Deposit request failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-[#1c1c1c]">
        <Navbar navigate={navigate} user={user} onLogout={onLogout} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#2a2a2a] border-4 border-[#3eba3e] p-8 text-center glow-green">
              <div className="text-6xl mb-6">😊</div>
              <h2 className="text-2xl text-[#3eba3e] mb-4">Request Submitted!</h2>
              <p className="text-sm text-gray-300 mb-6">
                Admin verify karega, coins thori der me add honge.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('profile')}
                  className="w-full mc-button mc-button-green text-white py-4 text-sm"
                >
                  VIEW PROFILE
                </button>
                <button
                  onClick={() => navigate('home')}
                  className="w-full mc-button text-white py-4 text-sm"
                >
                  BACK TO HOME
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl text-[#ffd700] mb-2">💰 Add Coins</h1>
            <p className="text-xs text-gray-400">Deposit to buy plugins</p>
          </div>

          <div className="bg-[#2a2a2a] border-4 border-black p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-300 mb-2">Amount (Coins)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ffd700]"
                  required
                  min="1"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-3">Payment Method</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 bg-[#1c1c1c] border-2 border-black p-4 cursor-pointer hover:border-[#3eba3e]">
                    <input
                      type="radio"
                      name="method"
                      value="easypaisa"
                      checked={method === 'easypaisa'}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white">Easypaisa</div>
                      {paymentSettings && (
                        <div className="text-xs text-[#3eba3e]">{paymentSettings.easypaisa}</div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-[#1c1c1c] border-2 border-black p-4 cursor-pointer hover:border-[#3eba3e]">
                    <input
                      type="radio"
                      name="method"
                      value="jazzcash"
                      checked={method === 'jazzcash'}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white">JazzCash</div>
                      {paymentSettings && (
                        <div className="text-xs text-[#3eba3e]">{paymentSettings.jazzcash}</div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-[#1c1c1c] border-2 border-black p-4 cursor-pointer hover:border-[#3eba3e]">
                    <input
                      type="radio"
                      name="method"
                      value="upi"
                      checked={method === 'upi'}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white">UPI</div>
                      {paymentSettings && (
                        <div className="text-xs text-[#3eba3e]">{paymentSettings.upi}</div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ffd700]"
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              {error && (
                <div className="bg-red-900 border-2 border-red-600 p-3 text-center">
                  <p className="text-xs text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mc-button mc-button-gold text-black py-4 text-sm disabled:opacity-50"
              >
                {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('profile')}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                ← Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepositPage;
