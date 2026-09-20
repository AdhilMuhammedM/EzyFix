import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, Award, Zap, ArrowDownUp, Crown } from 'lucide-react';
import TrustChip from './TrustChip.jsx';
import SkillChip from './SkillChip.jsx';
import { PRO_PRICE_INR_PER_MONTH } from '../lib/config.js';

export default function HowRankingWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full border border-[#E6E6E0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="px-5 py-4 bg-[#072339] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FDB60C]" />
            <h3 className="font-serif text-base font-semibold text-white">
              How Ranking Works
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#072339]">
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-amber-900 leading-relaxed">
            <p className="font-semibold text-xs mb-0.5">Transparent & Fair: No AI, No Star Ratings</p>
            <p className="text-[11px] text-amber-800">
              EzyFix ranks service professionals using two clear, objective signals: <strong>Trust</strong> (from real community vouches) and <strong>Skill</strong> (from verified trade qualifications).
            </p>
          </div>

          {/* Trust Breakdown */}
          <div className="space-y-2">
            <h4 className="font-serif text-xs font-bold text-[#072339] flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#072339]" />
              1. Trust Points (0 to 2)
            </h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Vouches must be from verified customers who contacted the pro through EzyFix. Each customer's phone counts once.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <TrustChip level={0} label="New" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">0 vouches</p>
                <p className="font-bold text-xs text-[#072339]">0 pts</p>
              </div>
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <TrustChip level={1} label="Community vouched" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">1–2 vouches</p>
                <p className="font-bold text-xs text-[#072339]">1 pt</p>
              </div>
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <TrustChip level={2} label="Highly trusted" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">3+ vouches</p>
                <p className="font-bold text-xs text-[#072339]">2 pts</p>
              </div>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="space-y-2 pt-2 border-t border-[#E6E6E0]">
            <h4 className="font-serif text-xs font-bold text-[#072339] flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4 text-[#072339]" />
              2. Skill Points (0 to 2)
            </h4>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Qualifications must be approved by admin review (ITI degrees, trade licences, professional certifications, training courses).
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <SkillChip level={0} label="Starter" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">0 qualifications</p>
                <p className="font-bold text-xs text-[#072339]">0 pts</p>
              </div>
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <SkillChip level={1} label="Skilled" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">1 qualification</p>
                <p className="font-bold text-xs text-[#072339]">1 pt</p>
              </div>
              <div className="p-2 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1">
                <SkillChip level={2} label="Expert" size="sm" />
                <p className="text-[10px] text-gray-500 font-medium">2+ qualifications</p>
                <p className="font-bold text-xs text-[#072339]">2 pts</p>
              </div>
            </div>
          </div>

          {/* Best Match Formula & Tiebreakers */}
          <div className="space-y-2 pt-2 border-t border-[#E6E6E0]">
            <h4 className="font-serif text-xs font-bold text-[#072339] flex items-center gap-1.5 uppercase tracking-wider">
              <ArrowDownUp className="w-4 h-4 text-[#072339]" />
              3. Best Match Score (0 to 4)
            </h4>
            <div className="p-3 bg-[#072339] text-white rounded-xl text-center">
              <p className="text-xs text-[#FDB60C] font-semibold">Total Best Match Score</p>
              <p className="text-xl font-bold font-serif my-0.5">Trust Points + Skill Points</p>
              <p className="text-[10px] text-gray-300">Scale from 0 (Starter / New) to 4 (Expert & Highly Trusted)</p>
            </div>

            <div className="p-3 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-1 text-[11px] text-gray-600">
              <p className="font-semibold text-[#072339]">Tiebreaker Sequence:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Higher Best match score (0 to 4)</li>
                <li>More active community vouches</li>
                <li>More verified skill qualification points</li>
                <li>Alphabetical name order</li>
              </ol>
            </div>
          </div>

          {/* Pro Plan Section */}
          <div className="space-y-2 pt-2 border-t border-[#E6E6E0]">
            <h4 className="font-serif text-xs font-bold text-[#072339] flex items-center gap-1.5 uppercase tracking-wider">
              <Crown className="w-4 h-4 text-[#FDB60C]" />
              4. Pro Plan
            </h4>
            <div className="p-3 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0] space-y-2 text-[11px] text-gray-600">
              <p className="leading-relaxed">
                The Pro plan decides who is ranked and listed first. Subscribed Pro pros are ranked and displayed above unranked pros.
              </p>
              <div className="p-2 bg-amber-50 rounded-md border border-amber-200 text-amber-900 font-medium">
                <strong>Fairness guarantee:</strong> Pro never changes Trust or Skill levels. Trust points and skill points are strictly earned through customer vouches and verified credentials.
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-[#072339]">
                  ₹{PRO_PRICE_INR_PER_MONTH} per month (demo price)
                </span>
                <Link
                  to="/plans"
                  onClick={onClose}
                  className="px-2.5 py-1 bg-[#072339] hover:bg-[#0D3352] text-white text-[11px] font-semibold rounded-md transition-colors"
                >
                  See plans
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-medium text-xs rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
