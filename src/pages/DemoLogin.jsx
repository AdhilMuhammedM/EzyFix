import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Wrench,
  KeyRound,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';
import { AREAS, STORAGE_KEYS } from '../lib/config.js';
import { getDemoSession, clearDemoSession } from '../components/ProtectedRoute.jsx';

// Fixed demo verification code for project presentations
export const FIXED_DEMO_OTP = '123456';

export default function DemoLogin() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(() => getDemoSession());

  const [formData, setFormData] = useState(() => {
    const existing = getDemoSession();
    return {
      name: existing?.name || '',
      place: existing?.place || AREAS[0],
      userId: existing?.userId || 'USR-8092',
      role: existing?.role || 'user', // 'user' | 'worker'
      otp: '',
    };
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      userId: prev.userId || (role === 'user' ? 'USR-8092' : 'WRK-4011'),
    }));
  };

  const handleFillDemoCode = () => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || 'Adhil Dev',
      userId: prev.userId || (prev.role === 'user' ? 'USR-8092' : 'WRK-4011'),
      otp: FIXED_DEMO_OTP,
    }));
    setErrors((prev) => ({ ...prev, otp: null, form: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name';
    }

    if (!formData.place.trim()) {
      newErrors.place = 'Please select or enter your place';
    }

    if (!formData.userId.trim()) {
      newErrors.userId = 'Please provide a User ID';
    }

    if (formData.otp.trim() !== FIXED_DEMO_OTP) {
      newErrors.otp = `Invalid demo OTP. Please enter the fixed demo code: ${FIXED_DEMO_OTP}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Persist active demo session
    const sessionData = {
      name: formData.name.trim(),
      place: formData.place,
      userId: formData.userId.trim(),
      role: formData.role,
      authenticated: true,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('ezyfix_demo_session', JSON.stringify(sessionData));
    window.dispatchEvent(new Event('ezyfix-session-update'));

    if (formData.role === 'user') {
      // Pre-populate customer identity for immediate seamless calling & vouching
      localStorage.setItem(
        STORAGE_KEYS.CUSTOMER,
        JSON.stringify({
          name: formData.name.trim(),
          phone: '9847123456',
          area: formData.place,
        })
      );

      setSuccessMessage(`Welcome, ${formData.name}! Diverting to Customer directory...`);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 600);
    } else {
      // Worker session: Pre-populate manage credentials so they land in dashboard
      localStorage.setItem(
        STORAGE_KEYS.MANAGE,
        JSON.stringify({
          phone: '9000000004',
          manageCode: 'DEMO01',
        })
      );

      setSuccessMessage(`Welcome, ${formData.name}! Diverting to Worker dashboard...`);
      setTimeout(() => {
        navigate('/manage', { replace: true });
      }, 600);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-[#E6E6E0] p-6 sm:p-8 shadow-md max-w-lg w-full space-y-6">
        {/* Brand Logo & Presentation Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white border border-[#E6E6E0] p-1.5 shadow-xs flex items-center justify-center">
            <img src="/logo-icon.png" alt="EzyFix" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Project Demo Gateway</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#072339]">
              Sign In to Session
            </h1>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Sign-in is required to enter the application. Role-based routing enforces separate sessions for Customers and Workers.
            </p>
          </div>
        </div>

        {/* Existing Active Session Quick Continue */}
        {activeSession && activeSession.authenticated && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-950">Active Session: {activeSession.name}</p>
                <p className="text-[11px] text-emerald-700 capitalize">
                  Destination: {activeSession.role === 'user' ? 'Customer Directory' : 'Worker Dashboard'}
                </p>
              </div>
            </div>
            <Link
              to={activeSession.role === 'worker' ? '/manage' : '/'}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs whitespace-nowrap"
            >
              <span>Enter Main Window</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Presentation Fixed OTP Badge & Quick-Fill */}
        <div className="p-3.5 bg-[#F8F8F6] border border-[#E6E6E0] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#072339] text-xs">Project Presentation OTP</p>
              <p className="text-[11px] text-gray-500">
                Fixed Demo Code: <strong className="font-mono text-[#072339] bg-amber-100/60 px-1.5 py-0.5 rounded font-bold">{FIXED_DEMO_OTP}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemoCode}
            className="px-3 py-1.5 bg-[#072339] hover:bg-[#0D3352] text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            1-Click Demo Fill
          </button>
        </div>

        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1.5">
              Select Session Destination <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('user')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.role === 'user'
                    ? 'border-[#072339] bg-[#072339]/5 ring-2 ring-[#072339]/20'
                    : 'border-[#E6E6E0] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.role === 'user' ? 'bg-[#072339] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-[#072339]">Customer</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Browse directory, find verified pros, vouch & call
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('worker')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.role === 'worker'
                    ? 'border-[#072339] bg-[#072339]/5 ring-2 ring-[#072339]/20'
                    : 'border-[#E6E6E0] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.role === 'worker' ? 'bg-[#FDB60C] text-[#072339]' : 'bg-gray-100 text-gray-600'}`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-[#072339]">Worker / Pro</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Manage trade skills, see ranking & qualifications
                </p>
              </button>
            </div>
          </div>

          {/* Name & Place in Responsive 2-Column Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[#072339] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Adhil Dev"
                className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="place" className="block text-xs font-semibold text-[#072339] mb-1">
                Place / Area <span className="text-red-500">*</span>
              </label>
              <select
                id="place"
                name="place"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {errors.place && <p className="text-[11px] text-red-600 mt-1">{errors.place}</p>}
            </div>
          </div>

          {/* User ID */}
          <div>
            <label htmlFor="userId" className="block text-xs font-semibold text-[#072339] mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder={formData.role === 'user' ? 'e.g. USR-8092' : 'e.g. WRK-4011'}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] font-mono"
            />
            {errors.userId && <p className="text-[11px] text-red-600 mt-1">{errors.userId}</p>}
          </div>

          {/* OTP Input with Fixed Demo Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="otp" className="block text-xs font-semibold text-[#072339]">
                OTP <span className="text-gray-400 font-normal">(One-Time Password)</span> <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, otp: FIXED_DEMO_OTP })}
                className="text-[11px] text-amber-600 hover:text-amber-700 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Use Demo OTP ({FIXED_DEMO_OTP})</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.trim() })}
                placeholder="123456"
                className="w-full px-3 py-2.5 text-sm bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] font-mono tracking-widest text-center font-bold text-[#072339]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 select-none uppercase">
                Demo Code
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-400">Fixed demo code: <strong className="font-mono text-gray-600">{FIXED_DEMO_OTP}</strong> (nothing actual)</span>
              {errors.otp && <span className="text-red-600 font-medium">{errors.otp}</span>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <span>Divert to {formData.role === 'user' ? 'Customer' : 'Worker'} Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Role Access Information */}
        <div className="pt-2 border-t border-[#E6E6E0]/60 text-center">
          <p className="text-[11px] text-gray-500 leading-normal">
            Login is a prerequisite to enter the main window. <br className="hidden sm:inline" />
            <span className="text-gray-600 font-medium">Customer (User)</span> accounts access the directory; <span className="text-gray-600 font-medium">Worker</span> accounts access trade tools (Join, Plans, Manage).
          </p>
        </div>
      </div>
    </div>
  );
}
