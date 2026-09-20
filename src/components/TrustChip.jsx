import React from 'react';
import { ShieldCheck, Shield } from 'lucide-react';

/**
 * TrustChip
 * Shield icon + label.
 * New = pink (#F1D9D3)
 * Community vouched = gold (#F8E3A6)
 * Highly trusted = sage (#D6E3D3)
 * Text is navy (#072339).
 */
export default function TrustChip({ level = 0, label = 'New', count = 0, size = 'md' }) {
  // Styles based on level
  const bgStyles = {
    0: 'bg-[#F1D9D3] border-[#E8C2BA]', // New (pink)
    1: 'bg-[#F8E3A6] border-[#E9D18A]', // Community vouched (gold)
    2: 'bg-[#D6E3D3] border-[#BDD0BA]', // Highly trusted (sage)
  };

  const currentBg = bgStyles[level] || bgStyles[0];
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-[#072339] border rounded-full ${
        isSmall ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${currentBg} shadow-sm select-none`}
      title={`Trust Level ${level}: ${label} (${count} active voucher${count === 1 ? '' : 's'})`}
    >
      {level >= 1 ? (
        <ShieldCheck className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#072339]`} />
      ) : (
        <Shield className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#072339]`} />
      )}
      <span>{label}</span>
    </span>
  );
}
