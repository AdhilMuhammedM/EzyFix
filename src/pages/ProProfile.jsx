import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Languages,
  MapPin,
  Clock,
  Award,
  ShieldCheck,
  CheckCircle2,
  Phone,
  HeartHandshake,
  IndianRupee,
} from 'lucide-react';
import TrustChip from '../components/TrustChip.jsx';
import SkillChip from '../components/SkillChip.jsx';
import WhyRankPanel from '../components/WhyRankPanel.jsx';
import VouchCard from '../components/VouchCard.jsx';
import CallModal from '../components/CallModal.jsx';
import VouchForm from '../components/VouchForm.jsx';
import Toast from '../components/Toast.jsx';
import ProBadge from '../components/ProBadge.jsx';
import {
  getPro,
  listQualifications,
  listVouches,
  listRawVouchesForPro,
  listRawQualificationsForPro,
} from '../data/repo.js';
import { enrichPro, getVisibleVouches } from '../lib/scoring.js';
import { QUALIFICATION_TYPES } from '../lib/config.js';

export default function ProProfile() {
  const { id } = useParams();
  const [pro, setPro] = useState(null);
  const [approvedQuals, setApprovedQuals] = useState([]);
  const [vouches, setVouches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVouchModalOpen, setIsVouchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadProData = async () => {
    try {
      setLoading(true);
      const fetchedPro = await getPro(id);
      if (!fetchedPro) {
        setPro(null);
        return;
      }

      // Public qualifications (scope: 'public' only returns approved)
      const quals = await listQualifications(id, { scope: 'public' });
      const rawQuals = await listRawQualificationsForPro(id);

      // Public vouches
      const vList = await listVouches(id);
      const rawVouches = await listRawVouchesForPro(id);

      const enriched = enrichPro(fetchedPro, rawVouches, rawQuals);

      setPro(enriched);
      setApprovedQuals(quals);
      setVouches(vList);
    } catch (err) {
      console.error('Error loading pro profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProData();
  }, [id]);

  const handleVouchSubmitted = (newVouch) => {
    setToastMessage('Thank you! Your vouch has been published to this profile.');
    loadProData(); // Refresh vouches and trust level
  };

  const handleContactLogged = () => {
    setToastMessage('Contact logged. You can now vouch for this pro.');
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-card border border-[#E6E6E0] p-4 animate-pulse" />
        <div className="h-32 bg-white rounded-card border border-[#E6E6E0] p-4 animate-pulse" />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="flex-1 p-6 text-center space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#072339] font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all professionals</span>
        </Link>
        <div className="bg-white rounded-card border border-[#E6E6E0] p-8 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-[#072339]">Professional not found</h2>
          <p className="text-xs text-gray-500 mt-1">
            The requested service professional does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const trust = pro.trust || { count: 0, level: 0, label: 'New' };
  const skill = pro.skill || { points: 0, level: 0, label: 'Starter' };

  return (
    <div className="flex-1 pb-24">
      {/* Top Navigation */}
      <div className="px-4 py-3 bg-[#F8F8F6] border-b border-[#E6E6E0]/60">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#072339] font-semibold hover:text-[#0D3352]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to directory</span>
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Profile Card */}
        <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold text-[#072339]">
                  {pro.fullName}
                </h1>
                {pro.isPro && <ProBadge size="sm" />}
                {pro.availableNow ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available now
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                    Busy
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-gray-700 mt-1">
                {pro.service}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Home: {pro.homeArea}</span>
              </p>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <TrustChip level={trust.level} label={trust.label} count={trust.count} size="md" />
            <SkillChip level={skill.level} label={skill.label} points={skill.points} size="md" />
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#E6E6E0]/60 text-xs">
            <div className="p-2.5 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0]/70 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">Experience</p>
                <p className="font-semibold text-[#072339]">{pro.yearsExperience} years</p>
              </div>
            </div>

            <div className="p-2.5 bg-[#F8F8F6] rounded-lg border border-[#E6E6E0]/70 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">Inspection charge</p>
                <p className="font-semibold text-[#072339]">
                  {pro.visitCharge ? `₹${pro.visitCharge}` : 'On call'}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {pro.bio && (
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">About</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{pro.bio}</p>
            </div>
          )}

          {/* Areas Served */}
          {Array.isArray(pro.areasServed) && pro.areasServed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1">Areas served</h3>
              <div className="flex flex-wrap gap-1.5">
                {pro.areasServed.map((area) => (
                  <span
                    key={area}
                    className="text-xs px-2.5 py-0.5 bg-[#F8F8F6] text-[#072339] border border-[#E6E6E0] rounded-md font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {Array.isArray(pro.languages) && pro.languages.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-gray-400" />
                <span>Languages spoken</span>
              </h3>
              <p className="text-xs text-gray-600">{pro.languages.join(', ')}</p>
            </div>
          )}

          {/* Skills Tags */}
          {Array.isArray(pro.skills) && pro.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1">Specialties & skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {pro.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-100 rounded-md font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why this rank panel */}
          <WhyRankPanel pro={pro} />
        </section>

        {/* SECTION 1: Verified Qualifications (Skill Section) */}
        <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E6E0] pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#072339]" />
              <h2 className="font-serif text-sm font-bold text-[#072339]">
                Verified Qualifications ({approvedQuals.length})
              </h2>
            </div>
            <SkillChip level={skill.level} label={skill.label} points={skill.points} size="sm" />
          </div>

          {approvedQuals.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {approvedQuals.map((qual) => (
                <div
                  key={qual.id}
                  className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] space-y-1 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-[#072339] leading-tight">
                      {qual.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Verified
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    {qual.issuer} · {qual.year}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Type: {QUALIFICATION_TYPES[qual.type]?.label || qual.type}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500">
              No verified qualifications added yet.
            </div>
          )}
        </section>

        {/* SECTION 2: Trust & Vouches Section */}
        <section className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E6E0] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#072339]" />
              <h2 className="font-serif text-sm font-bold text-[#072339]">
                Community Vouches ({vouches.length})
              </h2>
            </div>
            <TrustChip level={trust.level} label={trust.label} count={trust.count} size="sm" />
          </div>

          {vouches.length > 0 ? (
            <div className="space-y-3 pt-1">
              {getVisibleVouches(vouches, pro.isPro).map((v) => (
                <VouchCard key={v.id} vouch={v} />
              ))}
              {!pro.isPro && (vouches.length - getVisibleVouches(vouches, pro.isPro).length > 0) && (
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] text-center text-xs text-gray-600">
                  <p>
                    {vouches.length - getVisibleVouches(vouches, pro.isPro).length} more {vouches.length - getVisibleVouches(vouches, pro.isPro).length === 1 ? 'vouch is' : 'vouches are'} visible when this pro is on the Pro plan.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="font-serif text-sm font-semibold text-[#072339]">
                No vouches yet
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Be the first customer to vouch for {pro.fullName} after they complete work for you.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E6E6E0] p-3 shadow-lg">
        <div className="max-w-app mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCallModalOpen(true)}
            className="flex-1 py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl transition-colors shadow flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVouchModalOpen(true)}
            className="flex-1 py-3 px-4 bg-[#FDB60C] hover:bg-amber-hover text-[#072339] font-bold text-xs rounded-xl transition-colors shadow flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Vouch for {pro.fullName.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Call Dialog Modal */}
      <CallModal
        pro={pro}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onContactLogged={handleContactLogged}
      />

      {/* Vouch Modal */}
      <VouchForm
        pro={pro}
        isOpen={isVouchModalOpen}
        onClose={() => setIsVouchModalOpen(false)}
        onVouchSubmitted={handleVouchSubmitted}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
