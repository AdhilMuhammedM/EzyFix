import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-[#072339] text-white border-b border-[#0D3352] px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#FDB60C] text-[#072339] flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4 text-[#072339]" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="font-serif text-xl font-bold tracking-tight text-white">EzyFix</span>
              <span className="text-[#FDB60C] text-2xl font-black leading-none ml-0.5">.</span>
            </div>
            <p className="text-[10px] text-gray-300 -mt-1 font-sans tracking-wide">Small Fixes. Big Help.</p>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-medium" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Find
          </NavLink>
          <NavLink
            to="/join"
            className={({ isActive }) =>
              `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Join
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-white/15 text-[#FDB60C] font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Plans
          </NavLink>
          <NavLink
            to="/manage"
            className={({ isActive }) =>
              `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Manage
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-white/15 text-[#FDB60C] font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
