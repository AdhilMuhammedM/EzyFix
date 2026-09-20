import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

/**
 * WhyRankPanel
 * Expandable panel explaining trust points, skill points, and total score.
 * For a Free pro, also shows "Not ranked. This pro is on the free plan."
 */
export default function WhyRankPanel({ pro }) {
  const [expanded, setExpanded] = useState(false);

  const trustLevel = pro.trust?.level ?? 0;
  const skillLevel = pro.skill?.level ?? 0;
  const score = pro.score ?? trustLevel + skillLevel;
  const vouchCount = pro.vouchCount ?? pro.trust?.count ?? 0;
  const skillPoints = pro.skillPoints ?? pro.skill?.points ?? 0;
  const isPro = Boolean(pro.isPro);

  return (
    <div className="mt-3 border-t border-[#E6E6E0] pt-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[#072339]/70 hover:text-[#072339] py-1 transition-colors group"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-amber" />
          <span>{isPro ? 'Why this rank?' : 'Score breakdown'}</span>
          <span className="text-[11px] text-gray-500 font-normal">
            (Total Score: <strong className="text-[#072339]">{score}/4</strong>)
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-[#072339]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#072339]" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-white/70 rounded-lg border border-[#E6E6E0] space-y-2 text-[#072339]">
          {!isPro && (
            <div className="p-2 bg-amber-50 rounded-md border border-amber-200 text-amber-900 text-[11px] font-medium">
              Not ranked. This pro is on the free plan.
            </div>
          )}

          <div className="flex items-center justify-between pb-1.5 border-b border-[#E6E6E0]/60">
            <div>
              <span className="font-semibold">Trust points:</span>{' '}
              <span className="text-gray-600">
                {trustLevel} {trustLevel === 1 ? 'pt' : 'pts'} ({vouchCount} active {vouchCount === 1 ? 'vouch' : 'vouches'})
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              {vouchCount >= 3 ? '3+ vouches = Level 2' : vouchCount >= 1 ? '1-2 vouches = Level 1' : '0 vouches = Level 0'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-[#E6E6E0]/60">
            <div>
              <span className="font-semibold">Skill points:</span>{' '}
              <span className="text-gray-600">
                {skillLevel} {skillLevel === 1 ? 'pt' : 'pts'} ({skillPoints} approved {skillPoints === 1 ? 'qual' : 'quals'})
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              {skillPoints >= 2 ? '2+ points = Level 2' : skillPoints === 1 ? '1 point = Level 1' : '0 points = Level 0'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5 font-medium">
            <span className="font-bold">Total score:</span>
            <span className="text-sm font-bold text-[#072339]">
              {score} / 4
            </span>
          </div>

          <p className="text-[11px] text-gray-500 pt-1 leading-relaxed">
            {isPro
              ? 'Tiebreakers in Best match: Score \u2192 Vouches \u2192 Verified skill credentials \u2192 Alphabetical.'
              : 'Trust and skill points are earned only. Subscribed Pro pros are ranked and listed first.'}
          </p>
        </div>
      )}
    </div>
  );
}
