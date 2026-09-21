import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight } from 'lucide-react';
import TrustChip from './TrustChip.jsx';
import SkillChip from './SkillChip.jsx';
import ProBadge from './ProBadge.jsx';
import WhyRankPanel from './WhyRankPanel.jsx';

/**
 * Generates 2 initials from a full name
 */
function getInitials(name) {
  if (!name) return 'PR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar background colors based on name hash for vibrant identity
 */
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function ProCard({ pro, rankIndex }) {
  const initials = getInitials(pro.fullName);
  const avatarClass = getAvatarColor(pro.fullName);

  const trust = pro.trust || { count: 0, level: 0, label: 'New' };
  const skill = pro.skill || { points: 0, level: 0, label: 'Starter' };
  const verifiedQualsCount = skill.totalApproved ?? (skill.points || 0);
  const isPro = Boolean(pro.isPro);

  return (
    <article className="bg-white rounded-card border border-[#E6E6E0] p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-full">
      <Link to={`/pro/${pro.id}`} className="block group flex-1 flex flex-col justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar + Rank Badge (Only for Pro pros with valid rankIndex) */}
          <div className="relative flex-shrink-0">
            {isPro && rankIndex != null && (
              <span
                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#072339] text-[#FDB60C] font-bold text-xs flex items-center justify-center shadow-sm z-10"
                title={`Rank #${rankIndex} in current view`}
              >
                {rankIndex}
              </span>
            )}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border ${avatarClass} shadow-inner`}
            >
              {initials}
            </div>
            {/* Availability Dot */}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                pro.availableNow ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
              title={pro.availableNow ? 'Available now' : 'Currently busy'}
            />
          </div>

          {/* Pro Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-serif text-base font-semibold text-[#072339] truncate group-hover:text-blue-900 transition-colors">
                  {pro.fullName}
                </h2>
                {isPro && <ProBadge size="sm" />}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#072339] transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </div>

            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {pro.service} · {pro.homeArea}
            </p>

            {/* Chips: Trust & Skill */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <TrustChip level={trust.level} label={trust.label} count={trust.count} size="sm" />
              <SkillChip level={skill.level} label={skill.label} points={skill.points} size="sm" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-3.5 pt-2.5 border-t border-[#E6E6E0]/60 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#072339]">{trust.count}</span>
            <span>{trust.count === 1 ? 'vouch' : 'vouches'}</span>
            <span className="text-gray-300">·</span>
            <span className="font-medium text-[#072339]">{verifiedQualsCount}</span>
            <span>verified {verifiedQualsCount === 1 ? 'qualification' : 'qualifications'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span>{pro.yearsExperience} yrs exp</span>
          </div>
        </div>
      </Link>

      {/* Why This Rank Panel (Only shown on ranked Pro cards) */}
      {isPro && <WhyRankPanel pro={pro} />}
    </article>
  );
}
