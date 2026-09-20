import React from 'react';

/**
 * SkillChip
 * Three small pips with 1, 2 or 3 filled for Starter, Skilled and Expert.
 * Starter = light grey (#ECEBE6)
 * Skilled = light blue (#DCE8F5)
 * Expert = light violet (#E4DFF5)
 * Text is navy (#072339).
 */
export default function SkillChip({ level = 0, label = 'Starter', points = 0, size = 'md' }) {
  // Styles based on level
  const bgStyles = {
    0: 'bg-[#ECEBE6] border-[#D8D6CE]', // Starter (light grey)
    1: 'bg-[#DCE8F5] border-[#BFD4EB]', // Skilled (light blue)
    2: 'bg-[#E4DFF5] border-[#CEC5E8]', // Expert (light violet)
  };

  const currentBg = bgStyles[level] || bgStyles[0];
  const isSmall = size === 'sm';
  const filledPips = level + 1; // Level 0 -> 1 pip, Level 1 -> 2 pips, Level 2 -> 3 pips

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-[#072339] border rounded-full ${
        isSmall ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${currentBg} shadow-sm select-none`}
      title={`Skill Level ${level}: ${label} (${points} approved point${points === 1 ? '' : 's'})`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((pipIndex) => (
          <span
            key={pipIndex}
            className={`rounded-full ${
              isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'
            } transition-colors ${
              pipIndex <= filledPips
                ? 'bg-[#072339]'
                : 'bg-transparent border border-[#072339]/40'
            }`}
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
