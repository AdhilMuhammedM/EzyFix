import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Wrench, Shield } from 'lucide-react';
import { clearDemoSession } from './ProtectedRoute.jsx';

export default function Header() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('ezyfix_demo_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const updateSession = () => {
      try {
        const raw = localStorage.getItem('ezyfix_demo_session');
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
    };

    window.addEventListener('storage', updateSession);
    window.addEventListener('ezyfix-session-update', updateSession);
    return () => {
      window.removeEventListener('storage', updateSession);
      window.removeEventListener('ezyfix-session-update', updateSession);
    };
  }, []);

  const handleLogout = () => {
    clearDemoSession();
    navigate('/login');
  };

  // Determine home link depending on active role or login requirement
  const homeLink = !session ? '/login' : session.role === 'worker' ? '/manage' : '/';

  return (
    <header className="sticky top-0 z-30 bg-[#072339] text-white border-b border-[#0D3352] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 shadow-md">
      <div className="flex items-center justify-between">
        <Link to={homeLink} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
            <img
              src="/logo-icon.png"
              alt="EzyFix Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">EzyFix</span>
              <span className="text-[#FDB60C] text-2xl sm:text-3xl font-black leading-none ml-0.5">.</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300 -mt-1 font-sans tracking-wide">Small Fixes. Big Help.</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm font-medium" aria-label="Main Navigation">
          {/* 1. NOT LOGGED IN: Only show Login entry */}
          {!session && (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors border border-amber-400/50 bg-[#FDB60C] text-[#072339] font-bold shadow-xs hover:bg-amber-400 flex items-center gap-1.5`
              }
            >
              <span>Demo Login</span>
            </NavLink>
          )}

          {/* 2. LOGGED IN AS CUSTOMER (USER): Only Customer links */}
          {session && session.role === 'user' && (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                Find Pros
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#FDB60C] font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`
                }
              >
                Admin
              </NavLink>

              {/* Customer Session Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 px-2 sm:px-2.5 py-1 rounded-lg text-xs">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[70px] sm:max-w-[100px] truncate font-semibold">{session.name.split(' ')[0]}</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1 py-0.2 rounded hidden sm:inline">User</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                title="Log out / Switch Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}

          {/* 3. LOGGED IN AS WORKER: Only Worker links (manage, plans, join) */}
          {session && session.role === 'worker' && (
            <>
              <NavLink
                to="/manage"
                className={({ isActive }) =>
                  `px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/plans"
                className={({ isActive }) =>
                  `px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#FDB60C] font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                Plans
              </NavLink>

              <NavLink
                to="/join"
                className={({ isActive }) =>
                  `px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                Join
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#FDB60C] font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`
                }
              >
                Admin
              </NavLink>

              {/* Worker Session Badge */}
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/40 text-amber-300 px-2 sm:px-2.5 py-1 rounded-lg text-xs">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[70px] sm:max-w-[100px] truncate font-semibold">{session.name.split(' ')[0]}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1 py-0.2 rounded hidden sm:inline">Worker</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                title="Log out / Switch Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
