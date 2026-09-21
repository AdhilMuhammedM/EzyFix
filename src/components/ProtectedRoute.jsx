import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, ArrowRight, User, Wrench, LogOut } from 'lucide-react';

export function getDemoSession() {
  try {
    const raw = localStorage.getItem('ezyfix_demo_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  localStorage.removeItem('ezyfix_demo_session');
  window.dispatchEvent(new Event('ezyfix-session-update'));
}

export default function ProtectedRoute({ allowedRole, children }) {
  const location = useLocation();
  const session = getDemoSession();

  // 1. Prerequisite: If not signed in, redirect to /login
  if (!session || !session.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Access Enforcement:
  // If route is restricted to a specific role and current session is different
  if (allowedRole && session.role !== allowedRole) {
    const isWorkerSection = allowedRole === 'worker';
    const targetRoleLabel = isWorkerSection ? 'Worker / Pro' : 'Customer (User)';
    const currentRoleLabel = session.role === 'worker' ? 'Worker / Pro' : 'Customer (User)';
    const currentHomePath = session.role === 'worker' ? '/manage' : '/';
    const currentHomeLabel = session.role === 'worker' ? 'Worker Dashboard' : 'Customer Directory';

    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-md max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
              Access Restricted
            </div>
            <h2 className="font-serif text-xl font-bold text-[#072339]">
              {isWorkerSection ? 'Worker Section Only' : 'Customer Section Only'}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              You are currently signed in as a <strong className="text-[#072339]">{currentRoleLabel}</strong> ({session.name}).
              Under application rules, {session.role === 'user' ? 'customers cannot access worker tools (Join, Plans, Manage)' : 'workers cannot browse the customer directory'}.
            </p>
          </div>

          <div className="p-3 bg-[#F8F8F6] border border-[#E6E6E0] rounded-xl text-left space-y-1 text-xs">
            <div className="flex items-center justify-between text-gray-500">
              <span>Active User ID:</span>
              <span className="font-mono text-[#072339] font-medium">{session.userId}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500">
              <span>Account Type:</span>
              <span className="font-semibold text-[#072339] capitalize">{session.role}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500">
              <span>Required Role:</span>
              <span className="font-semibold text-amber-700 capitalize">{allowedRole}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              to={currentHomePath}
              className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {currentHomeLabel}</span>
            </Link>

            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Switch to {targetRoleLabel} Session</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
