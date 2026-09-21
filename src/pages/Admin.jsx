import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle,
  XCircle,
  FileText,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Award,
  MessageSquare,
  Shield,
  Eye,
  Flag,
  ThumbsDown,
  ShieldAlert,
} from 'lucide-react';
import Toast from '../components/Toast.jsx';
import {
  listPendingQualifications,
  reviewQualification,
  listAllVouchesForAdmin,
  removeVouch,
  resetDemoData,
  listFlagsForAdmin,
  resolveFlag,
  removeIssueReview,
} from '../data/repo.js';
import { DEFAULT_ADMIN_PASSCODE, QUALIFICATION_TYPES } from '../lib/config.js';

export default function Admin() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('qualifications'); // 'qualifications' | 'vouches' | 'flags' | 'tools'
  const [pendingQuals, setPendingQuals] = useState([]);
  const [allVouches, setAllVouches] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Rejection reason dialog state
  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    qualId: null,
    reason: '',
  });

  // Vouch removal dialog state
  const [removeDialog, setRemoveDialog] = useState({
    isOpen: false,
    vouchId: null,
    reason: '',
  });

  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const expectedPasscode = import.meta.env?.VITE_ADMIN_PASSCODE || DEFAULT_ADMIN_PASSCODE;

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.trim() === expectedPasscode.trim()) {
      setIsAuthenticated(true);
      setAuthError('');
      loadAdminData(passcode.trim());
    } else {
      setAuthError('Incorrect admin passcode.');
    }
  };

  const loadAdminData = async (adminCode = passcode) => {
    setLoading(true);
    try {
      const quals = await listPendingQualifications(adminCode);
      const vList = await listAllVouchesForAdmin(adminCode);
      const fList = await listFlagsForAdmin(adminCode);
      setPendingQuals(quals);
      setAllVouches(vList);
      setFlags(fList);
    } catch (err) {
      setToastMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissFlag = async (id) => {
    try {
      await resolveFlag(passcode, id, 'dismissed', 'Dismissed by admin.');
      setToastMessage('Flag dismissed.');
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleResolveFlag = async (id) => {
    try {
      await resolveFlag(passcode, id, 'resolved', 'Investigated and resolved by admin.');
      setToastMessage('Flag marked as resolved.');
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleApproveQual = async (id) => {
    try {
      await reviewQualification(passcode, id, 'approved');
      setToastMessage('Qualification approved!');
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleConfirmRejectQual = async () => {
    if (!rejectDialog.qualId) return;
    try {
      await reviewQualification(
        passcode,
        rejectDialog.qualId,
        'rejected',
        rejectDialog.reason || 'Document does not meet authenticity criteria.'
      );
      setToastMessage('Qualification rejected.');
      setRejectDialog({ isOpen: false, qualId: null, reason: '' });
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleConfirmRemoveVouch = async () => {
    if (!removeDialog.vouchId) return;
    try {
      await removeVouch(
        passcode,
        removeDialog.vouchId,
        removeDialog.reason || 'Flagged for violating community standards.'
      );
      setToastMessage('Vouch removed.');
      setRemoveDialog({ isOpen: false, vouchId: null, reason: '' });
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all demo data to initial seed? Current changes will be restored.')) return;
    try {
      await resetDemoData(passcode);
      setToastMessage('Demo dataset reset to initial state!');
      loadAdminData();
    } catch (err) {
      setToastMessage(err.message);
    }
  };

  // 1. PASSCODE GATE
  if (!isAuthenticated) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-center max-w-md mx-auto w-full py-8">
        <div className="bg-white rounded-card border border-[#E6E6E0] p-6 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#072339] text-[#FDB60C] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h1 className="font-serif text-lg font-bold text-[#072339]">
              Admin Verification Console
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Passcode protected portal for manual document approvals and moderation.
            </p>
          </div>

          {authError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#072339] mb-1">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (default: admin123)"
                className="w-full px-3 py-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none focus:border-[#072339]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              Unlock Console
            </button>
          </form>

          <p className="text-[11px] text-gray-400 text-center">
            Demo passcode default: <code>admin123</code>
          </p>
        </div>
      </div>
    );
  }

  // 2. ADMIN CONSOLE
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 max-w-6xl mx-auto w-full space-y-6">
      {/* Console Top Header */}
      <div className="bg-white rounded-card border border-[#E6E6E0] p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="font-serif text-base font-bold text-[#072339]">
            Admin Verification Console
          </h1>
          <p className="text-[11px] text-gray-500">
            Manual qualification approvals & moderation
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAuthenticated(false)}
          className="text-xs text-gray-500 hover:text-[#072339] font-medium"
        >
          Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F8F8F6] p-1 rounded-xl border border-[#E6E6E0] text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('qualifications')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'qualifications'
              ? 'bg-[#072339] text-white shadow-sm font-semibold'
              : 'text-gray-600 hover:text-[#072339]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Pending ({pendingQuals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vouches')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'vouches'
              ? 'bg-[#072339] text-white shadow-sm font-semibold'
              : 'text-gray-600 hover:text-[#072339]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Vouches ({allVouches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flags')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'flags'
              ? 'bg-[#072339] text-white shadow-sm font-semibold'
              : 'text-gray-600 hover:text-[#072339]'
          }`}
        >
          <Flag className="w-3.5 h-3.5 text-amber-400" />
          <span>Flags ({flags.filter((f) => f.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'tools'
              ? 'bg-[#072339] text-white shadow-sm font-semibold'
              : 'text-gray-600 hover:text-[#072339]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>
      </div>

      {/* TAB 1: PENDING QUALIFICATIONS */}
      {activeTab === 'qualifications' && (
        <section className="space-y-3">
          {pendingQuals.length > 0 ? (
            pendingQuals.map((qual) => (
              <div
                key={qual.id}
                className="bg-white rounded-card border border-[#E6E6E0] p-4 shadow-sm space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#072339]">
                      {qual.title}
                    </h3>
                    <p className="text-gray-500 font-medium">
                      Pro: <strong>{qual.proName}</strong> ({qual.proService})
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded">
                    Pending
                  </span>
                </div>

                <div className="bg-[#F8F8F6] p-2.5 rounded-lg border border-[#E6E6E0] space-y-1 text-[11px] text-gray-700">
                  <p><strong>Issuer:</strong> {qual.issuer}</p>
                  <p><strong>Year:</strong> {qual.year}</p>
                  <p><strong>Type:</strong> {QUALIFICATION_TYPES[qual.type]?.label || qual.type}</p>
                  {qual.credentialNumber && (
                    <p><strong>Credential #:</strong> {qual.credentialNumber}</p>
                  )}
                  {qual.documentDataUrl && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDocUrl(qual.documentDataUrl)}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Attached Document</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions: Approve / Reject */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveQual(qual.id)}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRejectDialog({ isOpen: true, qualId: qual.id, reason: '' })}
                    className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-card border border-[#E6E6E0] p-8 text-center text-xs text-gray-500">
              No pending qualifications waiting for review.
            </div>
          )}
        </section>
      )}

      {/* TAB 2: ALL VOUCHES (MODERATION) */}
      {activeTab === 'vouches' && (
        <section className="space-y-3">
          {allVouches.map((v) => (
            <div
              key={v.id}
              className={`bg-white rounded-card border p-4 shadow-sm space-y-2 text-xs ${
                v.status === 'removed' ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-[#E6E6E0]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#072339]">
                    Vouch for <strong>{v.proName}</strong> ({v.proService})
                  </h3>
                  <p className="text-gray-500 text-[11px]">
                    By: {v.voucherName} · Area: {v.voucherArea} · Month: {v.jobMonth}
                  </p>
                </div>

                {v.status === 'removed' ? (
                  <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">
                    Removed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRemoveDialog({ isOpen: true, vouchId: v.id, reason: '' })}
                    className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <p className="text-gray-600 text-[11px]">
                <strong>Job done:</strong> {v.jobDone}
              </p>
              <p className="text-gray-700 italic">"{v.feedback}"</p>

              {v.status === 'removed' && v.removedReason && (
                <p className="text-[11px] text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  <strong>Removal Reason:</strong> {v.removedReason}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* TAB 3: DEMO TOOLS */}
      {activeTab === 'tools' && (
        <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-serif text-sm font-bold text-[#072339] flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-[#072339]" />
              Reset Demo Dataset
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Resets localStorage database to the original 12 professionals, seeded vouches, and pending qualifications from Section 10 of the build specification.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data Now</span>
            </button>
          </div>
        </section>
      )}

      {/* TAB 3: FLAGS & REPORTS */}
      {activeTab === 'flags' && (
        <section className="space-y-3">
          {flags.length > 0 ? (
            flags.map((flag) => (
              <div
                key={flag.id}
                className="bg-white rounded-card border border-[#E6E6E0] p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          flag.targetType === 'pro'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {flag.targetType === 'pro' ? 'Pro Profile' : 'Vouch'}
                      </span>
                      <h3 className="font-serif text-sm font-bold text-[#072339]">
                        {flag.targetName}
                      </h3>
                    </div>
                    {flag.targetContext && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{flag.targetContext}</p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      flag.status === 'pending'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : flag.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {flag.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between text-amber-950 font-semibold">
                    <span>Reason: {flag.reason}</span>
                    <span className="text-[10px] text-amber-700 font-normal">
                      Reporter: {flag.reporterPhone}
                    </span>
                  </div>
                  <p className="text-amber-900 text-xs italic leading-relaxed">
                    "{flag.details}"
                  </p>
                </div>

                {flag.resolutionNote && (
                  <p className="text-[11px] text-gray-500 italic">
                    Note: {flag.resolutionNote}
                  </p>
                )}

                {flag.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDismissFlag(flag.id)}
                      className="flex-1 py-1.5 px-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs transition-colors"
                    >
                      Dismiss Flag
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveFlag(flag.id)}
                      className="flex-1 py-1.5 px-3 bg-[#072339] hover:bg-[#0D3352] text-white rounded-lg font-semibold text-xs transition-colors shadow"
                    >
                      Resolve & Close
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-card border border-[#E6E6E0] p-8 text-center space-y-2 text-xs text-gray-500">
              <Shield className="w-8 h-8 text-gray-300 mx-auto" />
              <h3 className="font-serif text-sm font-semibold text-[#072339]">
                No flags or reports
              </h3>
              <p>Community reports and flagged pros/vouches will appear here for review.</p>
            </div>
          )}
        </section>
      )}

      {/* Rejection Dialog Modal */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 border border-[#E6E6E0] shadow-xl space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#072339]">
              Reject Qualification
            </h3>
            <p className="text-xs text-gray-600">
              Please enter a reason. This will be visible to the professional in their dashboard.
            </p>
            <textarea
              rows={3}
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              placeholder="e.g. Document unreadable or not matching claimed trade."
              className="w-full p-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, qualId: null, reason: '' })}
                className="flex-1 py-1.5 border border-[#E6E6E0] text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectQual}
                className="flex-1 py-1.5 bg-rose-700 text-white text-xs rounded-lg font-semibold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vouch Removal Dialog Modal */}
      {removeDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 border border-[#E6E6E0] shadow-xl space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#072339]">
              Remove Vouch
            </h3>
            <p className="text-xs text-gray-600">
              Enter reason for removal. Removed vouches do not count toward trust score.
            </p>
            <textarea
              rows={3}
              value={removeDialog.reason}
              onChange={(e) => setRemoveDialog({ ...removeDialog, reason: e.target.value })}
              placeholder="e.g. Spam, fake vouch, or inappropriate content."
              className="w-full p-2 text-xs bg-[#F8F8F6] border border-[#E6E6E0] rounded-lg focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRemoveDialog({ isOpen: false, vouchId: null, reason: '' })}
                className="flex-1 py-1.5 border border-[#E6E6E0] text-xs rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveVouch}
                className="flex-1 py-1.5 bg-rose-700 text-white text-xs rounded-lg font-semibold"
              >
                Remove Vouch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-xs font-bold text-[#072339]">Document Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="text-gray-400 hover:text-black text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto border border-[#E6E6E0] rounded-lg p-1 bg-gray-50 flex items-center justify-center">
              {previewDocUrl.startsWith('data:image/') ? (
                <img src={previewDocUrl} alt="Document preview" className="max-w-full rounded" />
              ) : (
                <iframe src={previewDocUrl} title="Document PDF" className="w-full h-80" />
              )}
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
