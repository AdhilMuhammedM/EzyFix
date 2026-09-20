import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  ShieldCheck,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  LogOut,
  Save,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import TrustChip from '../components/TrustChip.jsx';
import SkillChip from '../components/SkillChip.jsx';
import ProBadge from '../components/ProBadge.jsx';
import QualificationForm from '../components/QualificationForm.jsx';
import Toast from '../components/Toast.jsx';
import {
  getProByManageAccess,
  updatePro,
  listQualifications,
  deleteQualification,
  listVouches,
  listPros,
  listRawVouchesForPro,
  listRawQualificationsForPro,
  cancelPro,
} from '../data/repo.js';
import { enrichPro, rankOf, projectedRank } from '../lib/scoring.js';
import { STORAGE_KEYS, QUALIFICATION_TYPES, SERVICES, AREAS } from '../lib/config.js';

function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export default function Manage() {
  const [credentials, setCredentials] = useState({ phone: '', manageCode: '' });
  const [pro, setPro] = useState(null);
  const [qualifications, setQualifications] = useState([]);
  const [vouches, setVouches] = useState([]);
  const [serviceRank, setServiceRank] = useState(null);
  const [projectedServiceRank, setProjectedServiceRank] = useState(null);
  const [totalPeers, setTotalPeers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isQualModalOpen, setIsQualModalOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Edit profile toggle
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Check localStorage for saved credentials
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MANAGE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone && parsed.manageCode) {
          setCredentials(parsed);
          loadProDashboard(parsed.phone, parsed.manageCode);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const loadProDashboard = async (phone, manageCode) => {
    setLoading(true);
    setLoginError('');
    try {
      const proData = await getProByManageAccess({ phone, manageCode });
      if (!proData) {
        setLoginError('Invalid phone number or manage code.');
        setPro(null);
        setLoading(false);
        return;
      }

      // Save credentials on device
      localStorage.setItem(
        STORAGE_KEYS.MANAGE,
        JSON.stringify({ phone, manageCode })
      );

      // Load qualifications (owner scope includes pending and rejectReason)
      const quals = await listQualifications(proData.id, { scope: 'owner' });

      // Load vouches
      const vList = await listVouches(proData.id);

      // Raw for scoring
      const rawQuals = await listRawQualificationsForPro(proData.id);
      const rawVouches = await listRawVouchesForPro(proData.id);
      const enriched = enrichPro(proData, rawVouches, rawQuals);

      // Calculate Rank among same service peers
      const allPros = await listPros();
      const allEnriched = await Promise.all(
        allPros.map(async (p) => {
          const pV = await listRawVouchesForPro(p.id);
          const pQ = await listRawQualificationsForPro(p.id);
          return enrichPro(p, pV, pQ);
        })
      );

      const rank = rankOf(proData.id, allEnriched);
      const projRank = projectedRank(proData.id, allEnriched);
      const peersCount = allEnriched.filter((p) => p.service === proData.service).length;

      setPro(enriched);
      setQualifications(quals);
      setVouches(vList);
      setServiceRank(rank);
      setProjectedServiceRank(projRank);
      setTotalPeers(peersCount);
      setEditForm({
        fullName: proData.fullName,
        service: proData.service,
        homeArea: proData.homeArea,
        areasServed: [...proData.areasServed],
        yearsExperience: proData.yearsExperience,
        languages: [...proData.languages],
        skills: [...(proData.skills || [])],
        bio: proData.bio || '',
        visitCharge: proData.visitCharge ?? '',
        availableNow: proData.availableNow,
      });
    } catch (err) {
      setLoginError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!credentials.phone || !credentials.manageCode) {
      setLoginError('Please enter both phone and manage code.');
      return;
    }
    loadProDashboard(credentials.phone, credentials.manageCode);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.MANAGE);
    setPro(null);
    setCredentials({ phone: '', manageCode: '' });
  };

  const handleToggleAvailable = async () => {
    if (!pro) return;
    try {
      const newStatus = !pro.availableNow;
      await updatePro(pro.id, credentials.manageCode, { availableNow: newStatus });
      setPro({ ...pro, availableNow: newStatus });
      setToastMessage(newStatus ? 'Marked as Available now!' : 'Marked as Busy.');
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleCancelPro = async () => {
    try {
      setCancelling(true);
      await cancelPro(pro.id, credentials.manageCode);
      setShowCancelModal(false);
      setToastMessage('Pro subscription cancelled.');
      await loadProDashboard(credentials.phone, credentials.manageCode);
    } catch (err) {
      setToastMessage(err.message || 'Failed to cancel Pro subscription.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteQualification = async (qualId) => {
    if (!window.confirm('Delete this pending qualification?')) return;
    try {
      await deleteQualification(qualId, credentials.manageCode);
      setToastMessage('Pending qualification deleted.');
      loadProDashboard(credentials.phone, credentials.manageCode);
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updatePro(pro.id, credentials.manageCode, editForm);
      setToastMessage('Profile updated successfully!');
      setIsEditing(false);
      loadProDashboard(credentials.phone, credentials.manageCode);
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-5 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-white rounded-card border border-[#E6E6E0] p-4 animate-pulse" />
      </div>
    );
  }

  // 1. AUTHENTICATION GATE
  if (!pro) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-center max-w-sm mx-auto">
        <div className="bg-white rounded-card border border-[#E6E6E0] p-6 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#072339] text-[#FDB60C] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h1 className="font-serif text-lg font-bold text-[#072339]">
              Professional Sign-in
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Enter your registered mobile phone and private manage code to access your dashboard.
            </p>
          </div>

          {loginError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#072339] mb-1">
                Registered mobile phone
              </label>
              <input
                type="tel"
                required
                value={credentials.phone}
                onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                placeholder="e.g. 9000000004"
                className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#072339] mb-1">
                Manage code (6 characters)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={credentials.manageCode}
                onChange={(e) =>
                  setCredentials({ ...credentials, manageCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g. DEMO01"
                className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339] font-mono tracking-widest"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Access Dashboard
              </button>
            </div>
          </form>

          {/* Quick Demo Hint */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-tight">
            <strong>Demo tip:</strong> For Jomon K (plumber), use phone <code>9000000004</code> and manage code <code>DEMO01</code>.
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW
  const trust = pro.trust || { count: 0, level: 0, label: 'New' };
  const skill = pro.skill || { points: 0, level: 0, label: 'Starter' };

  // Expert skill points progress (2 points needed for Expert)
  const expertProgressPercent = Math.min(100, Math.round((skill.points / 2) * 100));

  return (
    <div className="flex-1 p-4 pb-16 space-y-4">
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold text-[#072339]">
                {pro.fullName}
              </h1>
              <span className="text-xs text-gray-500">({pro.service})</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage Code: <span className="font-mono font-semibold text-[#072339]">{pro.manageCode}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
            title="Log out from this device"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Card */}
        <div className={`p-4 rounded-xl border ${pro.isPro ? 'bg-[#072339] text-white border-[#0D3352]' : 'bg-[#F8F8F6] border-[#E6E6E0]'} space-y-2.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pro.isPro ? (
                <ProBadge size="sm" />
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700">
                  Free plan
                </span>
              )}
              <span className={`text-xs font-semibold ${pro.isPro ? 'text-white' : 'text-[#072339]'}`}>
                {pro.isPro ? `Pro active until ${formatDate(pro.proUntil)}` : 'Free plan'}
              </span>
            </div>

            {pro.isPro ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs text-rose-300 hover:text-rose-100 underline font-medium"
              >
                Cancel Pro
              </button>
            ) : (
              <Link
                to="/plans"
                className="text-xs text-[#072339] hover:underline font-semibold flex items-center gap-1"
              >
                <span>See the Pro plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {!pro.isPro && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="leading-relaxed">
                You're not ranked yet. With Pro you would rank <strong>#{projectedServiceRank || '-'}</strong> of {totalPeers} {pro.service}s.
              </p>
              <div>
                <Link
                  to="/plans"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#072339] hover:bg-[#0D3352] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <span>See the Pro plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Availability Switch */}
        <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#072339]">Status: </span>
            <span className={`text-xs font-bold ${pro.availableNow ? 'text-emerald-700' : 'text-gray-500'}`}>
              {pro.availableNow ? 'Available now' : 'Busy / Not taking calls'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleAvailable}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pro.availableNow
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {pro.availableNow ? 'Switch to Busy' : 'Set Available'}
          </button>
        </div>

        {/* Chips & Ranking Stats */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1">
            <span className="text-[10px] text-gray-500 font-medium">
              {pro.isPro ? 'Service Rank' : 'Projected Rank'}
            </span>
            <div className="flex items-baseline gap-1">
              <TrendingUp className="w-4 h-4 text-amber" />
              <span className="font-serif text-xl font-bold text-[#072339]">
                #{pro.isPro ? (serviceRank || '-') : (projectedServiceRank || '-')}
              </span>
              <span className="text-[11px] text-gray-500">
                {pro.isPro ? `of ${totalPeers} ${pro.service}s` : 'with Pro plan'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1">
            <span className="text-[10px] text-gray-500 font-medium">Current Badges</span>
            <div className="flex flex-col gap-1">
              <TrustChip level={trust.level} label={trust.label} count={trust.count} size="sm" />
              <SkillChip level={skill.level} label={skill.label} points={skill.points} size="sm" />
            </div>
          </div>
        </div>

        {/* Skill Progress Bar toward Expert */}
        <div className="p-3 bg-white rounded-xl border border-[#E6E6E0] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#072339] flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber" />
              Progress toward Expert
            </span>
            <span className="font-bold text-[#072339]">{skill.points} / 2 pts</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FDB60C] transition-all duration-500"
              style={{ width: `${expertProgressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400">
            {skill.points >= 2
              ? 'You have reached the maximum Expert skill level!'
              : `Add ${2 - skill.points} more approved qualification to achieve Expert rank.`}
          </p>
        </div>
      </div>

      {/* Qualifications Section */}
      <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#E6E6E0] pb-2.5">
          <div>
            <h2 className="font-serif text-sm font-bold text-[#072339] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#072339]" />
              Your Qualifications ({qualifications.length}/8)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsQualModalOpen(true)}
            className="px-3 py-1.5 bg-[#072339] hover:bg-[#0D3352] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add qualification</span>
          </button>
        </div>

        {qualifications.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {qualifications.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-[#072339] leading-tight">{q.title}</h4>
                  {/* Status Badge */}
                  {q.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Approved
                    </span>
                  )}
                  {q.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Pending review
                    </span>
                  )}
                  {q.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-800 bg-rose-100 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      <XCircle className="w-3 h-3 text-rose-700" />
                      Rejected
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-[11px]">
                  {q.issuer} · {q.year} · Type: {QUALIFICATION_TYPES[q.type]?.label || q.type}
                </p>

                {/* Reject reason shown to owner only */}
                {q.status === 'rejected' && q.rejectReason && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong>Reason:</strong> {q.rejectReason}
                  </p>
                )}

                {/* Owner delete action for pending qualifications */}
                {q.status === 'pending' && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteQualification(q.id)}
                      className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete pending</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-500">
            No qualifications added yet. Tap "Add qualification" above to submit certificates.
          </div>
        )}
      </section>

      {/* Edit Profile Section */}
      <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#E6E6E0] pb-2.5">
          <h2 className="font-serif text-sm font-bold text-[#072339]">
            Profile Details
          </h2>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-semibold text-[#072339] hover:underline"
          >
            {isEditing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#072339]">Bio</label>
              <textarea
                rows={3}
                maxLength={300}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-[#072339]">Experience (yrs)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={editForm.yearsExperience}
                  onChange={(e) => setEditForm({ ...editForm, yearsExperience: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#072339]">Visit charge (₹)</label>
                <input
                  type="number"
                  value={editForm.visitCharge}
                  onChange={(e) => setEditForm({ ...editForm, visitCharge: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#072339] text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save changes</span>
            </button>
          </form>
        ) : (
          <div className="text-xs text-gray-600 space-y-2">
            <p><strong>Bio:</strong> {pro.bio || 'None provided'}</p>
            <p><strong>Areas served:</strong> {pro.areasServed?.join(', ')}</p>
            <p><strong>Visit charge:</strong> {pro.visitCharge ? `₹${pro.visitCharge}` : 'None'}</p>
          </div>
        )}
      </section>

      {/* Vouches Received (Read-only) */}
      <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
        <h2 className="font-serif text-sm font-bold text-[#072339] flex items-center gap-1.5 border-b border-[#E6E6E0] pb-2.5">
          <MessageSquare className="w-4 h-4 text-[#072339]" />
          Vouches Received ({vouches.length})
        </h2>

        {vouches.length > 0 ? (
          <div className="space-y-2.5">
            {vouches.map((v) => (
              <div key={v.id} className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#072339]">
                  <span>{v.voucherName} ({v.voucherArea})</span>
                  <span className="text-[10px] text-gray-400 font-normal">{v.jobMonth}</span>
                </div>
                <p className="text-gray-500 text-[11px] font-medium">Job: {v.jobDone}</p>
                <p className="text-gray-700 italic">"{v.feedback}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-500">
            No vouches received yet. Customers who call you through EzyFix can submit vouches.
          </div>
        )}
      </section>

      {/* Add Qualification Modal */}
      <QualificationForm
        proId={pro.id}
        manageCode={credentials.manageCode}
        isOpen={isQualModalOpen}
        onClose={() => setIsQualModalOpen(false)}
        onQualificationAdded={() => {
          setToastMessage('Qualification submitted for admin review!');
          loadProDashboard(credentials.phone, credentials.manageCode);
        }}
      />

      {/* Cancel Pro Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E6E6E0] shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-base font-bold text-[#072339]">
                Cancel Pro subscription?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cancel Pro subscription? You will lose your ranked position and full vouch visibility.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 px-3 border border-[#E6E6E0] hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Keep Pro
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelPro}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
