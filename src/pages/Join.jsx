import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { SERVICES, AREAS, LANGUAGES, STORAGE_KEYS } from '../lib/config.js';
import { validatePro } from '../lib/validation.js';
import { createPro } from '../data/repo.js';

export default function Join() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    service: SERVICES[0],
    homeArea: AREAS[0],
    areasServed: [AREAS[0]],
    yearsExperience: 1,
    languages: ['Malayalam', 'English'],
    skillsInput: '',
    bio: '',
    visitCharge: '',
    availableNow: true,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); // { pro, manageCode }
  const [copied, setCopied] = useState(false);

  const handleAreaServedToggle = (area) => {
    if (formData.areasServed.includes(area)) {
      if (area === formData.homeArea) return; // cannot remove homeArea
      setFormData({
        ...formData,
        areasServed: formData.areasServed.filter((a) => a !== area),
      });
    } else {
      setFormData({
        ...formData,
        areasServed: [...formData.areasServed, area],
      });
    }
  };

  const handleLanguageToggle = (lang) => {
    if (formData.languages.includes(lang)) {
      if (formData.languages.length === 1) return; // at least 1 language required
      setFormData({
        ...formData,
        languages: formData.languages.filter((l) => l !== lang),
      });
    } else {
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
      });
    }
  };

  const handleHomeAreaChange = (newHomeArea) => {
    const newServed = formData.areasServed.includes(newHomeArea)
      ? formData.areasServed
      : [...formData.areasServed, newHomeArea];
    setFormData({
      ...formData,
      homeArea: newHomeArea,
      areasServed: newServed,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const skillsArray = formData.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      fullName: formData.fullName,
      phone: formData.phone,
      service: formData.service,
      homeArea: formData.homeArea,
      areasServed: formData.areasServed,
      yearsExperience: formData.yearsExperience,
      languages: formData.languages,
      skills: skillsArray,
      bio: formData.bio,
      visitCharge: formData.visitCharge,
      availableNow: formData.availableNow,
    };

    const validation = validatePro(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await createPro(payload);
      setSuccessData(result);

      // Save manage credentials to this device
      localStorage.setItem(
        STORAGE_KEYS.MANAGE,
        JSON.stringify({
          proId: result.pro.id,
          phone: formData.phone.trim(),
          manageCode: result.manageCode,
        })
      );
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!successData?.manageCode) return;
    navigator.clipboard.writeText(successData.manageCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SUCCESS SCREEN
  if (successData) {
    return (
      <div className="flex-1 p-5 space-y-5 animate-fadeIn">
        <div className="bg-white rounded-card border border-[#E6E6E0] p-6 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-serif text-xl font-bold text-[#072339]">
              Registration Complete!
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Welcome, {successData.pro.fullName}. Your profile is now live in the directory with <strong>New</strong> & <strong>Starter</strong> badges.
            </p>
          </div>

          {/* Manage Code Warning Card */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Save your private manage code</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This code gives you access to edit your profile, toggle your availability, and add qualifications to improve your ranking. We only show this once.
            </p>

            <div className="pt-2 flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Manage Code
                </span>
                <p className="font-mono text-xl font-bold text-[#072339] tracking-widest">
                  {successData.manageCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#072339] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-[#0D3352]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              to="/manage"
              className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl shadow flex items-center justify-center gap-2"
            >
              <span>Go to Your Pro Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/plans"
              className="w-full py-2 px-4 bg-amber-50 border border-amber-200 text-amber-950 hover:bg-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Want to be ranked? See the Pro plan.</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/pro/${successData.pro.id}`}
              className="w-full py-2 px-4 border border-[#E6E6E0] text-gray-700 hover:bg-gray-50 font-medium text-xs rounded-xl flex items-center justify-center"
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 max-w-4xl mx-auto w-full space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-card border border-[#E6E6E0] p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#072339] p-1.5 shadow-sm flex items-center justify-center flex-shrink-0">
            <img src="/logo-icon.png" alt="EzyFix" className="w-full h-full object-contain rounded" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#072339]">
            Join as a Service Professional
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
          Create your professional profile on EzyFix. No real payments, no bidding wars, and no star rating penalties. Add verified trade qualifications anytime to improve your skill level.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-card border border-[#E6E6E0] p-6 shadow-sm space-y-5">
        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errors.form}
          </div>
        )}

        {/* Name & Phone in 2-Column Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Ramesh K"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          {/* Mobile Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              10-digit mobile number <span className="text-red-500">*</span>{' '}
              <span className="text-gray-400 font-normal">(kept private until contact)</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Service & Home Area in 2-Column Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Service */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Primary trade / service <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.service && <p className="text-[11px] text-red-600 mt-1">{errors.service}</p>}
          </div>

          {/* Home Area */}
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Home area / base <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.homeArea}
              onChange={(e) => handleHomeAreaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {errors.homeArea && <p className="text-[11px] text-red-600 mt-1">{errors.homeArea}</p>}
          </div>
        </div>

        {/* Areas Served */}
        <div>
          <label className="block text-xs font-semibold text-[#072339] mb-1">
            Areas served <span className="text-red-500">*</span>{' '}
            <span className="text-gray-400 font-normal">(must include home area)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {AREAS.map((area) => {
              const isChecked = formData.areasServed.includes(area);
              const isHome = area === formData.homeArea;
              return (
                <label
                  key={area}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-white border-[#072339] text-[#072339] font-medium shadow-xs'
                      : 'bg-[#F8F8F6] border-[#E6E6E0] text-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isHome}
                    onChange={() => handleAreaServedToggle(area)}
                    className="rounded text-[#072339] focus:ring-0"
                  />
                  <span>{area} {isHome && '(Home)'}</span>
                </label>
              );
            })}
          </div>
          {errors.areasServed && <p className="text-[11px] text-red-600 mt-1">{errors.areasServed}</p>}
        </div>

        {/* Years of Experience & Visit Charge */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Experience (years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              max={60}
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.yearsExperience && (
              <p className="text-[11px] text-red-600 mt-1">{errors.yearsExperience}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#072339] mb-1">
              Visit charge (₹) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.visitCharge}
              onChange={(e) => setFormData({ ...formData, visitCharge: e.target.value })}
              placeholder="e.g. 200"
              className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
            />
            {errors.visitCharge && (
              <p className="text-[11px] text-red-600 mt-1">{errors.visitCharge}</p>
            )}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-semibold text-[#072339] mb-1">
            Languages spoken <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => {
              const isSelected = formData.languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-[#072339] text-white border-[#072339] font-medium'
                      : 'bg-[#F8F8F6] text-gray-700 border-[#E6E6E0]'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
          {errors.languages && <p className="text-[11px] text-red-600 mt-1">{errors.languages}</p>}
        </div>

        {/* Skills Tags Input */}
        <div>
          <label className="block text-xs font-semibold text-[#072339] mb-1">
            Specialty tags <span className="text-gray-400 font-normal">(comma-separated, max 6)</span>
          </label>
          <input
            type="text"
            value={formData.skillsInput}
            onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
            placeholder="e.g. Leak repair, Tap installation, Pipe fitting"
            className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
          />
          {errors.skills && <p className="text-[11px] text-red-600 mt-1">{errors.skills}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#072339] mb-1">
            Short bio <span className="text-gray-400 font-normal">(max 300 characters)</span>
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Describe your background and services..."
            className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
          />
          <div className="flex justify-end text-[10px] text-gray-400 mt-0.5">
            <span>{formData.bio.length}/300</span>
          </div>
          {errors.bio && <p className="text-[11px] text-red-600 mt-0.5">{errors.bio}</p>}
        </div>

        {/* Available Now Toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2 text-xs text-[#072339] cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={formData.availableNow}
              onChange={(e) => setFormData({ ...formData, availableNow: e.target.checked })}
              className="rounded border-[#E6E6E0] text-[#072339] focus:ring-0"
            />
            <span>Mark me as 'Available now' immediately</span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? 'Creating Profile...' : 'Register as Professional'}
          </button>
        </div>
      </form>
    </div>
  );
}
