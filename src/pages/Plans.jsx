import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  ArrowLeft,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  ArrowRight,
  Zap,
} from 'lucide-react';
import ProBadge from '../components/ProBadge.jsx';
import Toast from '../components/Toast.jsx';
import { getProByManageAccess, subscribePro } from '../data/repo.js';
import { isProActive } from '../lib/scoring.js';
import { STORAGE_KEYS, PRO_PRICE_INR_PER_MONTH, PRO_DURATION_DAYS } from '../lib/config.js';

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

export default function Plans() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(null);
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.MANAGE);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.phone && parsed.manageCode) {
            setCredentials(parsed);
            const proData = await getProByManageAccess(parsed);
            if (proData) {
              setPro(proData);
            }
          }
        }
      } catch (err) {
        console.error('Error reading pro credentials:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const isPro = pro ? isProActive(pro) : false;

  const handleActivatePro = async () => {
    if (!pro || !credentials) return;
    try {
      setSubscribing(true);
      await subscribePro(pro.id, credentials.manageCode, PRO_DURATION_DAYS);
      setShowConfirmModal(false);
      setToastMessage(`Pro plan activated for ${PRO_DURATION_DAYS} days!`);
      setTimeout(() => {
        navigate('/manage');
      }, 800);
    } catch (err) {
      setToastMessage(err.message || 'Failed to activate Pro.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#F8F8F6] border-b border-[#E6E6E0]/60 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#072339] font-semibold hover:text-[#0D3352]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to directory</span>
        </Link>
        {pro && (
          <Link
            to="/manage"
            className="text-xs text-[#072339] font-semibold hover:underline"
          >
            Manage dashboard
          </Link>
        )}
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Title Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#FDB60C]" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#072339]">
            Choose Your Plan
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Only subscribed Pro pros are ranked and listed first. Trust and skill levels are strictly earned through honest work.
          </p>
        </div>

        {/* Demo Disclaimer */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2 max-w-3xl mx-auto">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demo environment:</strong> No real payment, card details, or payment provider are involved. Pro activation is instant for demonstration purposes.
          </p>
        </div>

        {/* Active Pro Status Banner (if signed in and Pro) */}
        {isPro && pro && (
          <div className="p-4 bg-[#072339] text-white rounded-xl shadow-sm flex items-center justify-between max-w-3xl mx-auto w-full">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ProBadge size="sm" />
                <span className="font-semibold text-xs text-white">Your Pro Plan is Active</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Active until {formatDate(pro.proUntil)}
              </p>
            </div>
            <Link
              to="/manage"
              className="px-3 py-1.5 bg-[#FDB60C] hover:bg-amber-hover text-[#072339] text-xs font-bold rounded-lg transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch pt-2">
          {/* FREE PLAN CARD */}
          <div className={`bg-white rounded-card border ${!isPro && pro ? 'border-gray-400 ring-1 ring-gray-400' : 'border-[#E6E6E0]'} p-6 shadow-sm flex flex-col justify-between h-full space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  Standard
                </span>
                <h2 className="font-serif text-lg font-bold text-[#072339] mt-0.5">
                  Free Plan
                </h2>
              </div>
              <span className="font-serif text-xl font-bold text-[#072339]">
                ₹0
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Ideal for getting started. Your profile is listed in the directory and customers can contact you directly.
            </p>

            <div className="space-y-2 pt-2 border-t border-[#E6E6E0] text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Listed in the directory (listed under "Not ranked", alphabetical)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Direct customer phone contact and call logging</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>1 newest vouch with feedback visible on public profile</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Earn Trust badges from genuine customer vouches</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Earn Skill badges from verified trade qualifications</span>
              </div>
            </div>

            <div className="pt-2">
              {!isPro && pro ? (
                <div className="w-full py-2.5 text-center bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl">
                  Current plan
                </div>
              ) : null}
            </div>
          </div>

          {/* PRO PLAN CARD */}
          <div className={`bg-white rounded-card border-2 ${isPro ? 'border-[#072339]' : 'border-[#FDB60C]'} p-6 shadow-md flex flex-col justify-between h-full space-y-4 relative overflow-hidden`}>
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FDB60C]" />

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <ProBadge size="sm" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                    Recommended
                  </span>
                </div>
                <h2 className="font-serif text-lg font-bold text-[#072339] mt-1">
                  Pro Plan
                </h2>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-0.5">
                  <span className="font-serif text-2xl font-bold text-[#072339]">
                    ₹{PRO_PRICE_INR_PER_MONTH}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">/mo</span>
                </div>
                <span className="text-[10px] text-gray-400 font-normal">demo price</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              For active service professionals who want to be ranked, listed first, and showcase all customer vouches.
            </p>

            <div className="space-y-2.5 pt-2 border-t border-[#E6E6E0] text-xs text-[#072339]">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#072339] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Ranked and listed first:</strong> Displayed above unranked free pros across Best match, Most trusted, and Most skilled
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#072339] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Rank number badge:</strong> Shows your position (#1, #2, etc.) directly on your profile card
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#072339] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Full vouch visibility:</strong> All customer vouches and feedback are visible on your public profile
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#072339] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Why this rank breakdown:</strong> Customers can see transparent scoring of your trust and verified skill points
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#072339] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Gold Pro badge:</strong> Distinguishes your profile across search and profile views
                </span>
              </div>
            </div>

            {/* Fairness notice */}
            <div className="p-2.5 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] text-[11px] text-gray-600">
              <strong className="text-[#072339]">Fairness policy:</strong> Subscribing to Pro unlocks ranking and visibility. It never buys or changes Trust or Skill points.
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {loading ? (
                <div className="w-full py-3 bg-gray-200 rounded-xl animate-pulse" />
              ) : isPro ? (
                <div className="w-full py-3 text-center bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Pro is currently active</span>
                </div>
              ) : pro ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-[#FDB60C]" />
                  <span>Start Pro (demo)</span>
                </button>
              ) : (
                <Link
                  to="/manage"
                  className="w-full py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>Log in to start Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="pt-4 space-y-3">
          <h3 className="font-serif text-sm font-bold text-[#072339]">
            Frequently Asked Questions
          </h3>

          <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="p-4 bg-white rounded-xl border border-[#E6E6E0] space-y-1.5 shadow-xs">
              <h4 className="font-semibold text-[#072339]">Does Pro guarantee #1 rank?</h4>
              <p className="leading-relaxed text-gray-600">
                No. Pro determines who is ranked and displayed above free pros. Among Pro pros, rankings are decided by your verified community vouches and approved skill credentials.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E6E6E0] space-y-1.5 shadow-xs">
              <h4 className="font-semibold text-[#072339]">Can a new pro with 0 vouches rank well?</h4>
              <p className="leading-relaxed text-gray-600">
                Yes! With Pro, adding verified qualifications (trade licences, ITI diplomas, training certificates) gives you skill points immediately, helping you rank alongside established pros.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E6E6E0] space-y-1.5 shadow-xs">
              <h4 className="font-semibold text-[#072339]">Can I cancel my Pro subscription?</h4>
              <p className="leading-relaxed text-gray-600">
                Yes. You can cancel anytime from your Manage dashboard. When cancelled, your profile moves to the free plan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E6E6E0] shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FDB60C] flex items-center justify-center mx-auto border border-amber-200">
              <Crown className="w-6 h-6 text-[#072339]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-base font-bold text-[#072339]">
                Activate Pro Plan (demo)
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Demo only. No payment is taken. This will activate Pro for {PRO_DURATION_DAYS} days.
              </p>
            </div>

            <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Plan:</span>
                <strong className="text-[#072339]">Pro ({PRO_DURATION_DAYS} days)</strong>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <strong className="text-[#072339]">₹{PRO_PRICE_INR_PER_MONTH} (demo)</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment method:</span>
                <span className="text-emerald-700 font-medium">None required</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={subscribing}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 border border-[#E6E6E0] hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={subscribing}
                onClick={handleActivatePro}
                className="flex-1 py-2.5 px-3 bg-[#072339] hover:bg-[#0D3352] text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
              >
                {subscribing ? 'Activating...' : `Activate Pro for ${PRO_DURATION_DAYS} days`}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
