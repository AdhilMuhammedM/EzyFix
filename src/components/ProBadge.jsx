import React from 'react';
import { Crown } from 'lucide-react';

/**
 * ProBadge component:
 * Crown icon plus text "Pro", amber background (#FDB60C), navy text (#072339).
 * Clearly distinguishable from TrustChip and SkillChip, never relies on color alone.
 * Also supports plan="free" rendering a plain text "Free plan" label (no icon).
 */
export default function ProBadge({ plan = 'pro', size = 'md' }) {
  if (plan === 'free') {
    return (
      <span className="text-xs text-gray-500 font-medium select-none">
        Free plan
      </span>
    );
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-[#072339] bg-[#FDB60C] border border-[#E5A30B] rounded-full shadow-xs select-none ${
        isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'
      }`}
      title="Pro plan: ranked professional"
    >
      <Crown className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#072339] flex-shrink-0`} />
      <span className="tracking-wide">Pro</span>
    </span>
  );
}
