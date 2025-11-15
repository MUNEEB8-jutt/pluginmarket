import React, { useState } from 'react';

function SignupPage({ navigate, onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${window.API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.detail || 'Signup failed');
      }
    } catch (err) {
      setError('Connection failed. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-[#3eba3e] mb-2">⛏️ Sign Up</h1>
          <p className="text-xs text-gray-400">Join PluginVerse</p>
        </div>

        <div className="bg-[#2a2a2a] border-4 border-black p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm focus:outline-none focus:border-[#3eba3e]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm focus:outline-none focus:border-[#3eba3e]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1c1c1c] border-2 border-black text-white px-4 py-3 text-sm focus:outline-none focus:border-[#3eba3e]"
                required
                minLength="6"
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
              className="w-full mc-button mc-button-green text-white py-4 text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'SIGN UP'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('login')}
              className="text-xs text-[#3eba3e] hover:text-[#4eca4e]"
            >
              Already have account? Login
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('home')}
              className="text-xs text-gray-400 hover:text-gray-300"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
