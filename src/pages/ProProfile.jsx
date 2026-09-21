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
  Flag,
  AlertTriangle,
  ThumbsDown,
} from 'lucide-react';
import TrustChip from '../components/TrustChip.jsx';
import SkillChip from '../components/SkillChip.jsx';
import WhyRankPanel from '../components/WhyRankPanel.jsx';
import VouchCard from '../components/VouchCard.jsx';
import CallModal from '../components/CallModal.jsx';
import VouchForm from '../components/VouchForm.jsx';
import IssueReviewModal from '../components/IssueReviewModal.jsx';
import FlagModal from '../components/FlagModal.jsx';
import Toast from '../components/Toast.jsx';
import ProBadge from '../components/ProBadge.jsx';
import {
  getPro,
  listQualifications,
  listVouches,
  listRawVouchesForPro,
  listRawQualificationsForPro,
  listIssuesForPro,
} from '../data/repo.js';
import { enrichPro, getVisibleVouches } from '../lib/scoring.js';
import { QUALIFICATION_TYPES } from '../lib/config.js';

export default function ProProfile() {
  const { id } = useParams();
  const [pro, setPro] = useState(null);
  const [approvedQuals, setApprovedQuals] = useState([]);
  const [vouches, setVouches] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVouchModalOpen, setIsVouchModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState({ targetType: 'pro', targetId: null, targetTitle: '' });
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

      // Issues / bad reviews
      const issueList = await listIssuesForPro(id);

      const enriched = enrichPro(fetchedPro, rawVouches, rawQuals);

      setPro(enriched);
      setApprovedQuals(quals);
      setVouches(vList);
      setIssues(issueList);
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

  const handleIssueSubmitted = (newIssue) => {
    setToastMessage('Your report has been published to this profile.');
    loadProData();
  };

  const handleFlagSubmitted = () => {
    setToastMessage('Report submitted to administration for investigation.');
  };

  const handleFlagVouch = (vouch) => {
    setFlagTarget({
      targetType: 'vouch',
      targetId: vouch.id,
      targetTitle: `Vouch by ${vouch.voucherName}`,
    });
    setIsFlagModalOpen(true);
  };

  const handleFlagPro = () => {
    setFlagTarget({
      targetType: 'pro',
      targetId: pro.id,
      targetTitle: `${pro.fullName} (${pro.service})`,
    });
    setIsFlagModalOpen(true);
  };

  const handleContactLogged = () => {
    setToastMessage('Contact logged. You can now vouch or report an issue for this pro.');
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
  const { visible: visibleVouches, hiddenCount } = getVisibleVouches(vouches, pro.isPro);

  return (
    <div className="flex-1 pb-24 lg:pb-16 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Navigation */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#072339] font-semibold hover:text-[#0D3352]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to directory</span>
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Main Left Column */}
        <div className="lg:col-span-8 space-y-5">
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

          {/* Action Bar for Feedback & Moderation */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setIsVouchModalOpen(true)}
              className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
              <span>Vouch</span>
            </button>
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Report Issue</span>
            </button>
            <button
              type="button"
              onClick={handleFlagPro}
              className="py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              title="Flag this profile for admin review"
            >
              <Flag className="w-3.5 h-3.5 text-gray-500" />
              <span>Flag</span>
            </button>
          </div>

          {/* Positive Vouches List */}
          {visibleVouches.length > 0 ? (
            <div className="space-y-3 pt-1">
              {visibleVouches.map((v) => (
                <VouchCard key={v.id} vouch={v} onFlag={handleFlagVouch} />
              ))}
              {!pro.isPro && hiddenCount > 0 && (
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E6E6E0] text-center text-xs text-gray-600">
                  <p>
                    {hiddenCount} more {hiddenCount === 1 ? 'vouch is' : 'vouches are'} visible when this pro is on the Pro plan.
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

          {/* Critical Reviews & Issues Subsection */}
          {issues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-100 space-y-3">
              <div className="flex items-center gap-2 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                  Reported Issues & Bad Experiences ({issues.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {issues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-rose-950">
                          {iss.reviewerName} <span className="text-[11px] font-normal text-rose-800">({iss.reviewerArea})</span>
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          {iss.jobDone} · {iss.jobMonth}
                        </p>
                      </div>
                      <span className="text-[10px] text-rose-600 font-medium">
                        {iss.createdAt ? new Date(iss.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    {Array.isArray(iss.issueTags) && iss.issueTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {iss.issueTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-900 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-rose-900 leading-relaxed italic">
                      "{iss.feedback}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Sticky Action Card on Desktop */}
      <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 space-y-4">
        <div className="bg-white rounded-card border border-[#E6E6E0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E0]">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Inspection charge</p>
              <p className="font-serif text-lg font-bold text-[#072339]">
                {pro.visitCharge ? `₹${pro.visitCharge}` : 'On call'}
              </p>
            </div>
            <div>
              {pro.availableNow ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available now
                </span>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                  Currently busy
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="w-full py-3 px-4 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-sm rounded-xl transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call {pro.fullName.split(' ')[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVouchModalOpen(true)}
              className="w-full py-3 px-4 bg-[#FDB60C] hover:bg-amber-hover text-[#072339] font-bold text-sm rounded-xl transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Vouch for {pro.fullName.split(' ')[0]}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#E6E6E0] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="flex-1 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title="Report a bad experience or issue"
            >
              <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Report Issue</span>
            </button>

            <button
              type="button"
              onClick={handleFlagPro}
              className="flex-1 py-2 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title="Flag pro to admin"
            >
              <Flag className="w-3.5 h-3.5 text-gray-500" />
              <span>Flag Pro</span>
            </button>
          </div>

          <div className="pt-1 text-[11px] text-gray-500 text-center leading-relaxed">
            No platform cut. Direct contact with verified community vouches.
          </div>
        </div>
      </div>
    </div>

      {/* Sticky Bottom Action Bar (Mobile & Tablet Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E6E6E0] p-3 shadow-lg lg:hidden">
        <div className="max-w-app mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCallModalOpen(true)}
            className="flex-1 py-3 px-3 bg-[#072339] hover:bg-[#0D3352] text-white font-semibold text-xs rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVouchModalOpen(true)}
            className="flex-1 py-3 px-3 bg-[#FDB60C] hover:bg-amber-hover text-[#072339] font-bold text-xs rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Vouch</span>
          </button>

          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
            title="Report a bad experience or issue"
          >
            <ThumbsDown className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Issue</span>
          </button>

          <button
            type="button"
            onClick={handleFlagPro}
            className="py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center"
            title="Flag pro to admin"
          >
            <Flag className="w-4 h-4 text-gray-600" />
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

      {/* Issue / Bad Review Modal */}
      <IssueReviewModal
        pro={pro}
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onIssueSubmitted={handleIssueSubmitted}
      />

      {/* Flag Modal */}
      <FlagModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        targetType={flagTarget.targetType}
        targetId={flagTarget.targetId}
        targetTitle={flagTarget.targetTitle}
        onFlagSubmitted={handleFlagSubmitted}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
