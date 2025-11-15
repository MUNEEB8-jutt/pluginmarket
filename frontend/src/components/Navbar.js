import React, { useState } from 'react';

function Navbar({ navigate, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#2a2a2a] border-b-4 border-black sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate('home')}
            className="text-xl text-[#3eba3e] hover:text-[#4eca4e] transition-colors"
          >
            ⛏️ PluginVerse
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate('home')}
                  className="mc-button text-white px-4 py-2 text-xs hover:bg-[#3eba3e] transition-colors"
                >
                  🔍 DISCOVER PLUGINS
                </button>

                <button
                  onClick={() => navigate('profile')}
                  className="mc-button text-white px-4 py-2 text-xs hover:bg-[#3eba3e] transition-colors"
                >
                  📊 DASHBOARD
                </button>

                <button
                  onClick={() => navigate('deposit')}
                  className="mc-button mc-button-gold text-black px-4 py-2 text-xs"
                >
                  💰 DEPOSIT
                </button>

                <div className="flex items-center gap-2 bg-[#1c1c1c] border-2 border-black px-4 py-2">
                  <span className="text-[#ffd700]">🪙</span>
                  <span className="text-sm text-[#ffd700] font-bold">{user.coins}</span>
                </div>

                <button
                  onClick={() => navigate('profile')}
                  className="mc-button text-white px-4 py-2 text-xs"
                >
                  👤 {user.username}
                </button>

                {user.is_admin && (
                  <button
                    onClick={() => navigate('admin')}
                    className="mc-button mc-button-gold text-black px-4 py-2 text-xs"
                  >
                    ⚙️ ADMIN
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="mc-button mc-button-red text-white px-4 py-2 text-xs"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('home')}
                  className="mc-button text-white px-4 py-2 text-xs hover:bg-[#3eba3e] transition-colors"
                >
                  🔍 DISCOVER PLUGINS
                </button>
                <button
                  onClick={() => navigate('login')}
                  className="mc-button text-white px-4 py-2 text-xs"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => navigate('signup')}
                  className="mc-button mc-button-green text-white px-4 py-2 text-xs"
                >
                  SIGN UP
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden mc-button text-white px-4 py-2 text-xs"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-[#1c1c1c] border-2 border-black px-4 py-2 mb-2">
                  <span className="text-[#ffd700]">🪙</span>
                  <span className="text-sm text-[#ffd700] font-bold">{user.coins}</span>
                  <span className="text-xs text-gray-400 ml-2">{user.username}</span>
                </div>

                <button
                  onClick={() => { navigate('home'); setMenuOpen(false); }}
                  className="w-full mc-button text-white px-4 py-2 text-xs"
                >
                  � DRISCOVER PLUGINS
                </button>

                <button
                  onClick={() => { navigate('profile'); setMenuOpen(false); }}
                  className="w-full mc-button text-white px-4 py-2 text-xs"
                >
                  📊 DASHBOARD
                </button>

                <button
                  onClick={() => { navigate('deposit'); setMenuOpen(false); }}
                  className="w-full mc-button mc-button-gold text-black px-4 py-2 text-xs"
                >
                  💰 DEPOSIT
                </button>

                {user.is_admin && (
                  <button
                    onClick={() => { navigate('admin'); setMenuOpen(false); }}
                    className="w-full mc-button mc-button-gold text-black px-4 py-2 text-xs"
                  >
                    ⚙️ ADMIN
                  </button>
                )}

                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  className="w-full mc-button mc-button-red text-white px-4 py-2 text-xs"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate('home'); setMenuOpen(false); }}
                  className="w-full mc-button text-white px-4 py-2 text-xs"
                >
                  🔍 DISCOVER PLUGINS
                </button>
                <button
                  onClick={() => { navigate('login'); setMenuOpen(false); }}
                  className="w-full mc-button text-white px-4 py-2 text-xs"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => { navigate('signup'); setMenuOpen(false); }}
                  className="w-full mc-button mc-button-green text-white px-4 py-2 text-xs"
                >
                  SIGN UP
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
